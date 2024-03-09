use sqlx::PgPool;

use crate::resource::word_status::WordStatus;
use crate::resource::word_status::WordStatusEntity;

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
