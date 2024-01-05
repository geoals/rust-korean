use std::time::Instant;
use axum::extract::{Path, State};
use axum::response::IntoResponse;
use tracing::debug;
use crate::{SharedState, search};

pub async fn handler(
    Path(term): Path<String>,
    State(state): State<SharedState>,
) -> impl IntoResponse {
    let start_time = Instant::now();
    debug!("New request for {}", term); // TODO request ID

    let matches = search::get(&term, &state.dictionary);
    debug!("Found {} matches", matches.len());

    if !matches.is_empty() {
        sqlx::query!(r#"
            INSERT INTO Lookup (headword, conjugated_form, user_id)
            VALUES ($1, $2, $3)
            "#,
            matches[0].headword().clone(),
            if matches[0].headword() != &term { Some(term.clone()) } else { None },
            1 // TODO user ID when we have more than 1 user
        )
            .execute(&state.db)
            .await
            .expect("Failed to insert into Lookup");
    }

    let response = serde_json::to_string(&matches).unwrap();

    debug!("Request processed in {:?}", start_time.elapsed());
    response
}

// #[derive(Debug, FromRow)]
// struct Lookup {
//     id: i32,
//     headword: String,
//     conjugated_form: Option<String>,
//     user_id: i32,
//     created_at: chrono::DateTime<chrono::Utc>,
// }
