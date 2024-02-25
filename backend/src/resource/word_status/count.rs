use crate::SharedState;
use crate::error_handling::AppError;
use axum::extract::State;
use axum::http;
use axum::response::IntoResponse;
use tracing::debug;

pub async fn get_handler(
    State(state): State<SharedState>,
) -> Result<impl IntoResponse, AppError> {
    debug!("New request to get count of word statuses");
    let word_status_counts = sqlx::query_as!(
        WordStatusCountEntity,
        "SELECT
        COUNT(CASE WHEN status = 'known' THEN 1 END) as known,
        COUNT(CASE WHEN status = 'unknown' THEN 1 END) as unknown,
        COUNT(CASE WHEN status = 'seen' THEN 1 END) as seen
        FROM WordStatus WHERE user_id = $1",
        1 // TODO: user ID when we have more than 1 user
    ).fetch_one(&state.db).await?;

    let response_body = serde_json::to_string(&WordStatusCountDTO {
        known: word_status_counts.known.unwrap_or(0),
        seen: word_status_counts.seen.unwrap_or(0),
        unknown: word_status_counts.unknown.unwrap_or(0),
    }).unwrap();

    let response = http::Response::builder()
        .status(http::StatusCode::OK)
        .body(response_body).unwrap();
    Ok(response)

}

#[derive(Debug)]
struct WordStatusCountEntity {
    known: Option<i64>,
    seen: Option<i64>,
    unknown: Option<i64>,
}

#[derive(Debug, serde::Serialize)]
pub struct WordStatusCountDTO {
    known: i64,
    seen: i64,
    unknown: i64,
}