use std::time::Instant;
use axum::extract::{Path, State};
use axum::response::IntoResponse;
use serde::Serialize;
use tracing::debug;
use crate::dictionary::KrDictEntry;
use crate::resource::word_status::{WordStatus, WordStatusResponse};
use crate::{SharedState, search};

pub async fn get_handler(
    Path(term): Path<String>,
    State(state): State<SharedState>,
) -> impl IntoResponse {
    let start_time = Instant::now();
    debug!("New request for {}", term); // TODO request ID

    let matches: Vec<KrDictEntry> = search::get_all(&term, &state.dictionary);
    debug!("Found {} matches", matches.len());

    if !matches.is_empty() {
        // TODO do this asynchronously?
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

    let ids = matches.iter().map(|m| *m.sequence_number()).collect::<Vec<i32>>();

    let word_statuses = sqlx::query_as!(
        WordStatusResponse,
        "SELECT krdict_sequence_number as id, status as \"status: WordStatus\", ignored, tracked
        FROM WordStatus
        WHERE krdict_sequence_number = ANY($1) AND user_id = $2;",
        &ids,
        1 // TODO user ID when we have more than 1 user
    ).fetch_all(&state.db).await.unwrap();

    // TODO remove unnecessary clone
    let matches = matches.into_iter()
        .map(|m| {
            let word_status = word_statuses.iter()
                .find(|ws| ws.id == Some(*m.sequence_number()))
                .unwrap_or(&WordStatusResponse {
                    id: None,
                    status: WordStatus::Unknown,
                    ignored: false,
                    tracked: false,
                }).clone();

            LookupDTO {
                dict_entry: m,
                status: word_status,
            }
        })
        .collect::<Vec<LookupDTO>>();

    

    let response = serde_json::to_string(&matches).unwrap();

    debug!("Request processed in {:?}", start_time.elapsed());
    response
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LookupDTO {
    pub dict_entry: KrDictEntry,
    pub status: WordStatusResponse,
}

#[derive(Serialize)]
pub struct LookupResponse(Vec<LookupDTO>);
