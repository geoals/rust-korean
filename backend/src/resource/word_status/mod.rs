pub mod count;

use crate::error_handling::AppError;
use crate::frequency_dictionary::FrequencyDictionary;
use crate::{frequency_dictionary, SharedState};
use axum::extract::{Path, State};
use axum::response::IntoResponse;
use axum::{http, Json};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use std::time::Instant;
use tracing::debug;

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
    let start_time = Instant::now();
    debug!("New request to update id {}", id); // TODO: request ID

    // Check for existing row and then either update or insert as a proper `insert on conflict update`
    // would require to dynamically build the SET clause which means we cannot use the compile time
    // checking of sqlx macros
    let existing_row = sqlx::query_as!(
        WordStatusEntity,
        // Override type of status as sqlx macros doesn't support user defined types
        "SELECT id, krdict_sequence_number, status as \"status: WordStatus\", ignored, tracked, user_id, created_at, updated_at
        FROM WordStatus
        WHERE krdict_sequence_number = $1 AND user_id = $2;",
        id,
        1 // TODO: user ID when we have more than 1 user
    )
    .fetch_optional(&state.db)
    .await?;

    let response = if let Some(existing_row) = existing_row {
        sqlx::query!(
            "UPDATE WordStatus
            SET status = $1, ignored = $2, tracked = $3
            WHERE krdict_sequence_number = $4 AND user_id = $5;",
            body.status.unwrap_or(existing_row.status) as _,
            body.ignored.unwrap_or(existing_row.ignored),
            body.tracked.unwrap_or(existing_row.tracked),
            id,
            1
        )
        .execute(&state.db)
        .await?;

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

    debug!("Request processed in {:?}", start_time.elapsed());
    Ok(response)
}

pub async fn get_handler(
    Path(id): Path<i32>,
    State(state): State<SharedState>,
) -> Result<impl IntoResponse, AppError> {
    let start_time = Instant::now();
    debug!("New request to get id {}", id); // TODO: request ID

    let existing_row = sqlx::query_as!(
        WordStatusEntity,
        // Override type of status as sqlx macros doesn't support user defined types
        "SELECT id, krdict_sequence_number, status as \"status: WordStatus\", ignored, tracked, user_id, created_at, updated_at
        FROM WordStatus
        WHERE krdict_sequence_number = $1 AND user_id = $2;",
        id,
        1 // TODO: user ID when we have more than 1 user
    )
    .fetch_optional(&state.db)
    .await?;

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
        .body(response_body)
        .unwrap(); // TODO: map error

    debug!("Request processed in {:?}", start_time.elapsed());
    Ok(response)
}

// TODO: don't expose this, and move sql to a service (its now duplicated here and in analyze endpoint)
#[derive(Debug, Clone, FromRow)]
#[allow(dead_code)]
pub struct WordStatusEntity {
    pub id: i32,
    pub krdict_sequence_number: Option<i32>,
    pub status: WordStatus,
    pub ignored: bool,
    pub tracked: bool,
    pub user_id: i32,
    pub created_at: Option<chrono::DateTime<chrono::Utc>>,
    pub updated_at: Option<chrono::DateTime<chrono::Utc>>,
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
