pub mod count;

use crate::db::word_status::WordStatusEntity;
use crate::error_handling::AppError;
use crate::{db, SharedState};
use axum::extract::{Path, State};
use axum::response::IntoResponse;
use axum::{http, Json};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct WordStatusRequest {
    status: Option<WordStatus>, // TODO: use enum
    ignored: Option<bool>,
    tracked: Option<bool>,
}

pub async fn patch_handler(
    Path(id): Path<i32>,
    State(state): State<SharedState>,
    Json(body): Json<WordStatusRequest>,
) -> Result<impl IntoResponse, AppError> {
    // Check for existing row and then either update or insert as a proper `insert on conflict update`
    // would require to dynamically build the SET clause which means we cannot use the compile time
    // checking of sqlx macros
    let existing_row = db::word_status::get_one(&state.db, id).await;

    let response = if let Some(existing_row) = existing_row {
        db::word_status::update(
            &state.db,
            id,
            body.status.unwrap_or(existing_row.status) as _,
            body.ignored.unwrap_or(existing_row.ignored),
            body.tracked.unwrap_or(existing_row.tracked),
        )
        .await;

        http::StatusCode::OK
    } else {
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

        http::StatusCode::CREATED
    };

    Ok(response)
}

pub async fn get_handler(
    Path(id): Path<i32>,
    State(state): State<SharedState>,
) -> Result<impl IntoResponse, AppError> {
    let existing_row = db::word_status::get_one(&state.db, id).await;

    let response_body = if let Some(existing_row) = existing_row {
        serde_json::to_string(&existing_row.to_dto(None)).unwrap() // TODO: map error, TODO: frequency rank
    } else {
        // TODO: return 404 if id doesn't exist in dictionary
        // TODO: single source of truth for default value
        serde_json::to_string(&WordStatusResponse {
            id: Some(id),
            status: WordStatus::Unknown,
            ignored: false,
            frequency_rank: None,
        })
        .unwrap() // TODO: map error
    };

    let response = http::Response::builder()
        .status(http::StatusCode::OK)
        .header(http::header::CONTENT_TYPE, "application/json")
        .body(response_body)
        .unwrap(); // TODO: map error

    Ok(response)
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

// TODO: not public fields, use separate object for Analyze reponse
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
