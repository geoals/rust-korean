use std::sync::Arc;

use sqlx::{postgres::PgQueryResult, PgPool};

use crate::dictionary::KrDictEntry;

pub async fn insert(db: PgPool, term: String, matches: Arc<Vec<KrDictEntry>>) -> PgQueryResult {
    return sqlx::query!(
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
        1 // TODO: user ID when we have more than 1 user
    )
    .execute(&db)
    .await
    .expect("Failed to insert into Lookup");
}
