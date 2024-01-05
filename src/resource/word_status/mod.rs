use std::time::Instant;
use axum::extract::{Path, State};
use axum::response::IntoResponse;
use serde::{Deserialize};
use sqlx::FromRow;
use tracing::debug;
use crate::{SharedState};

pub async fn post_handler(
    Path(id): Path<i32>,
    State(state): State<SharedState>,
) -> impl IntoResponse {
    let start_time = Instant::now();
    debug!("New request to update id {}", id); // TODO request ID

    // let word_status = sqlx::query_as!(
    //     WordStatusEntity,
    //     "SELECT * FROM WordStatus WHERE id = $1;",
    //     id
    // )
    //     .fetch_optional(&state.db)
    //     .await
    //     .unwrap();

    sqlx::query!(
        "INSERT INTO WordStatus
        (krdict_sequence_number, status, ignored, tracked, user_id)
        VALUES ($1, 'unseen', true, false, $2)
        ON CONFLICT (user_id, krdict_sequence_number) DO UPDATE SET
            ignored = NOT EXCLUDED.ignored,
            updated_at = CURRENT_TIMESTAMP
        ;",
        id,
        1 // TODO user ID when we have more than 1 user
    )
        .execute(&state.db)
        .await
        .unwrap();

    // TODO return 200 or 201

    // let response = serde_json::to_string(&matches).unwrap();
    let response = serde_json::to_string("").unwrap();

    debug!("Request processed in {:?}", start_time.elapsed());
    response
}

pub async fn get_handler(
    Path(id): Path<i32>,
    State(state): State<SharedState>,
) -> impl IntoResponse {
    serde_json::to_string("").unwrap()
}

#[derive(Debug, FromRow)]
struct WordStatusEntity {
    id: i32,
    krdict_sequence_number: Option<i32>,
    status: String, // TODO use enum
    ignored: bool,
    tracked: bool,
    user_id: i32,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
pub enum WordStatus {
    Unknown,
    Seen,
    Known,
}
