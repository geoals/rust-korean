use sqlx::{postgres::PgQueryResult, FromRow, PgPool};
use uuid::Uuid;

use crate::{error_handling::AppError, routes::word_status::WordStatus};

#[derive(Debug, Clone, FromRow)]
pub struct WordStatusEntity {
    pub id: i32,
    pub krdict_sequence_number: Option<i32>,
    pub status: WordStatus,
    pub ignored: bool,
    pub tracked: bool,
    pub user_id: Uuid,
    pub created_at: Option<chrono::DateTime<chrono::Utc>>,
    pub updated_at: Option<chrono::DateTime<chrono::Utc>>,
}

pub async fn get_all(
    db: &PgPool,
    ids: &Vec<i32>,
    user_id: Uuid,
) -> Result<Vec<WordStatusEntity>, AppError> {
    let result = sqlx::query_as!(
        WordStatusEntity,
        "SELECT id, krdict_sequence_number, status as \"status: WordStatus\", ignored, tracked, user_id, created_at, updated_at
        FROM WordStatus
        WHERE krdict_sequence_number = ANY($1) AND user_id = $2;",
        ids,
        user_id,
    ).fetch_all(db).await?;

    Ok(result)
}

pub async fn get_one(
    db: &PgPool,
    id: i32,
    user_id: Uuid,
) -> Result<Option<WordStatusEntity>, AppError> {
    let result = sqlx::query_as!(
        WordStatusEntity,
        // Override type of status as sqlx macros doesn't support user defined types
        "SELECT id, krdict_sequence_number, status as \"status: WordStatus\", ignored, tracked, user_id, created_at, updated_at
        FROM WordStatus
        WHERE krdict_sequence_number = $1 AND user_id = $2;",
        id,
        user_id,
    )
    .fetch_optional(db)
    .await?;

    Ok(result)
}

pub async fn update(
    db: &PgPool,
    id: i32,
    status: WordStatus,
    ignored: bool,
    tracked: bool,
    user_id: Uuid,
) -> Result<PgQueryResult, AppError> {
    let result = sqlx::query!(
        "UPDATE WordStatus
        SET status = $1, ignored = $2, tracked = $3
        WHERE krdict_sequence_number = $4 AND user_id = $5;",
        status as _,
        ignored,
        tracked,
        id,
        user_id,
    )
    .execute(db)
    .await?;

    Ok(result)
}
