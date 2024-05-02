pub mod count;

use crate::db::word_status::WordStatusEntity;
use crate::error_handling::AppError;
use crate::{db, SharedState};
use axum::extract::{Path, State};
use axum::Json;
use serde::{Deserialize, Serialize};

use super::ApiResponse;

#[derive(Debug, Serialize, Deserialize)]
pub struct WordStatusRequestDTO {
    status: Option<WordStatus>, // TODO: use enum
    ignored: Option<bool>,
    tracked: Option<bool>,
}

pub async fn patch(
    Path(id): Path<i32>,
    State(state): State<SharedState>,
    Json(body): Json<WordStatusRequestDTO>,
) -> Result<ApiResponse<()>, AppError> {
    // Check for existing row and then either update or insert as a proper `insert on conflict update`
    // would require to dynamically build the SET clause which means we cannot use the compile time
    // checking of sqlx macros
    let existing_row = db::word_status::get_one(&state.db, id).await?;

    if let Some(existing_row) = existing_row {
        db::word_status::update(
            &state.db,
            id,
            body.status.unwrap_or(existing_row.status) as _,
            body.ignored.unwrap_or(existing_row.ignored),
            body.tracked.unwrap_or(existing_row.tracked),
        )
        .await?;

        return Ok(ApiResponse::NoContent);
    }

    sqlx::query!(
        "INSERT INTO WordStatus
            (krdict_sequence_number, status, ignored, tracked, user_id)
            VALUES ($1, $2, $3, $4, $5);",
        id, // id user input is not validated
        body.status.unwrap_or(WordStatus::Unknown) as _,
        body.ignored.unwrap_or(false),
        body.tracked.unwrap_or(false),
        1 // TODO: user ID when we have more than 1 user
    )
    .execute(&state.db)
    .await?;

    Ok(ApiResponse::Created)
}

pub async fn get(
    Path(id): Path<i32>,
    State(state): State<SharedState>,
) -> Result<ApiResponse<WordStatusResponse>, AppError> {
    let existing_row = db::word_status::get_one(&state.db, id).await?;

    let response_body = if let Some(existing_row) = existing_row {
        existing_row.to_dto(None) // TODO: frequency rank
    } else {
        // TODO: return 404 if id doesn't exist in dictionary
        // TODO: single source of truth for default value
        WordStatusResponse {
            id: Some(id),
            status: WordStatus::Unknown,
            ignored: false,
            frequency_rank: None,
        }
    };

    Ok(ApiResponse::JsonData(response_body))
}

impl WordStatusEntity {
    pub fn to_dto(&self, frequency_rank: Option<u32>) -> WordStatusResponse {
        WordStatusResponse {
            id: self.krdict_sequence_number,
            status: self.status.clone(),
            ignored: self.ignored,
            frequency_rank,
        }
    }
}

// TODO: not public fields, use separate object for Analyze reponse, rename to DTO?
#[derive(Debug, Clone, Serialize)]
pub struct WordStatusResponse {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<i32>,
    pub status: WordStatus,
    pub ignored: bool,
    pub frequency_rank: Option<u32>,
}

impl WordStatusResponse {
    pub fn new(id: i32, frequency_rank: Option<u32>) -> Self {
        Self {
            id: Some(id),
            status: WordStatus::Unknown,
            ignored: false,
            frequency_rank,
        }
    }
}

#[derive(Debug, PartialEq, Serialize, Deserialize, sqlx::Type, Clone)]
#[sqlx(type_name = "word_status", rename_all = "snake_case")]
#[serde(rename_all = "camelCase")]
pub enum WordStatus {
    Unknown,
    Seen,
    Known,
}
