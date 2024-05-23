use std::sync::Arc;

use sqlx::{postgres::PgQueryResult, PgPool};
use uuid::Uuid;

use crate::{dictionary::KrDictEntry, error_handling::AppError};

pub async fn insert(
    db: PgPool,
    term: String,
    matches: Arc<Vec<KrDictEntry>>,
    user_id: Uuid,
) -> Result<PgQueryResult, AppError> {
    let result = sqlx::query!(
        r#"
            INSERT INTO Lookup (headword, conjugated_form, user_id)
            VALUES ($1, $2, $3)
            "#,
        matches[0].headword().clone(),
        if matches[0].headword() != &term {
            Some(term)
        } else {
            None
        },
        user_id,
    )
    .execute(&db)
    .await?;

    Ok(result)
}
