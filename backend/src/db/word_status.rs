use sqlx::{FromRow, PgPool};

use crate::routes::word_status::WordStatus;

#[derive(Debug, Clone, FromRow)]
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

pub async fn get_all(db: &PgPool, ids: &Vec<i32>) -> Vec<WordStatusEntity> {
    sqlx::query_as!(
        WordStatusEntity,
        "SELECT id, krdict_sequence_number, status as \"status: WordStatus\", ignored, tracked, user_id, created_at, updated_at
        FROM WordStatus
        WHERE krdict_sequence_number = ANY($1) AND user_id = $2;",
        ids,
        1 // TODO: user ID when we have more than 1 user
    ).fetch_all(db).await.expect("Failed to get word statuses")
}

pub async fn get_one(db: &PgPool, id: i32) -> Option<WordStatusEntity> {
    sqlx::query_as!(
        WordStatusEntity,
        // Override type of status as sqlx macros doesn't support user defined types
        "SELECT id, krdict_sequence_number, status as \"status: WordStatus\", ignored, tracked, user_id, created_at, updated_at
        FROM WordStatus
        WHERE krdict_sequence_number = $1 AND user_id = $2;",
        id,
        1 // TODO: user ID when we have more than 1 user
    )
    .fetch_optional(db)
    .await.expect("Failed to get word status")
}

pub async fn update(db: &PgPool, id: i32, status: WordStatus, ignored: bool, tracked: bool) {
    sqlx::query!(
        "UPDATE WordStatus
        SET status = $1, ignored = $2, tracked = $3
        WHERE krdict_sequence_number = $4 AND user_id = $5;",
        status as _,
        ignored,
        tracked,
        id,
        1
    )
    .execute(db)
    .await
    .expect("Failed to update word status");
}
