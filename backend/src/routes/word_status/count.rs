use crate::error_handling::AppError;
use crate::extractors::auth_session::AuthSession;
use crate::routes::ApiResponse;
use crate::SharedState;
use axum::extract::State;

pub async fn get(
    State(state): State<SharedState>,
    AuthSession(session): AuthSession,
) -> Result<ApiResponse<WordStatusCountDTO>, AppError> {
    let word_status_counts = sqlx::query_as!(
        WordStatusCountEntity,
        "SELECT
        COUNT(CASE WHEN status = 'known' THEN 1 END) as known,
        COUNT(CASE WHEN status = 'unknown' THEN 1 END) as unknown,
        COUNT(CASE WHEN status = 'seen' THEN 1 END) as seen
        FROM WordStatus WHERE user_id = $1",
        session.user_id
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
