use crate::error_handling::AppError;
use crate::SharedState;
use axum::extract::State;
use axum::response::{IntoResponse, Response};
use axum::Json;

pub async fn get_handler(
    State(state): State<SharedState>,
) -> Result<ApiResponse<WordStatusCountDTO>, AppError> {
    let word_status_counts = sqlx::query_as!(
        WordStatusCountEntity,
        "SELECT
        COUNT(CASE WHEN status = 'known' THEN 1 END) as known,
        COUNT(CASE WHEN status = 'unknown' THEN 1 END) as unknown,
        COUNT(CASE WHEN status = 'seen' THEN 1 END) as seen
        FROM WordStatus WHERE user_id = $1",
        1 // TODO: user ID when we have more than 1 user
    )
    .fetch_one(&state.db)
    .await?;

    let response = WordStatusCountDTO {
        known: word_status_counts.known.unwrap_or(0),
        seen: word_status_counts.seen.unwrap_or(0),
        unknown: word_status_counts.unknown.unwrap_or(0),
    };

    Ok(ApiResponse::JsonData(response))
}

pub enum ApiResponse<T> {
    JsonData(T),
}

impl IntoResponse for ApiResponse<WordStatusCountDTO> {
    fn into_response(self) -> Response {
        match self {
            Self::JsonData(data) => Json(data).into_response(),
        }
    }
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
