use std::{time::Instant, collections::HashMap};

use axum::{response::IntoResponse, extract::State, http};
use tracing::debug;

use crate::error_handling::AppError;
use crate::dictionary::KrDictEntry;
use crate::{search, SharedState};
use crate::resource::word_status::{WordStatusResponse, WordStatus};

// TODO refactor this abomination
pub async fn post_handler(
    State(state): State<SharedState>,
    body: String,
) -> Result<impl IntoResponse, AppError> {
    let start_time = Instant::now();
    debug!("New request to analyze text with length {}", body.len());

    let words = body.split_whitespace();

    // TODO change to hashmap
     let unconjugated_to_ids_tuples = words.map(|w| {
        let matches: Vec<KrDictEntry> = search::get(w, &state.dictionary);
        let ids = matches.iter().map(|m| *m.sequence_number()).collect::<Vec<i32>>();
        (w.to_owned(), ids)
    }).collect::<Vec<(String, Vec<i32>)>>();
    
    let id_to_unconjugated_word_map = unconjugated_to_ids_tuples
        .iter()
        .flat_map(|(word, ids)| ids.iter().map(|id| (*id, word.clone())))
        .collect::<HashMap<i32, String>>();

    let ids = id_to_unconjugated_word_map.keys().cloned().collect::<Vec<i32>>();

    let word_statuses = sqlx::query_as!(
        WordStatusResponse,
        "SELECT krdict_sequence_number as id, status as \"status: WordStatus\", ignored, tracked
        FROM WordStatus
        WHERE krdict_sequence_number = ANY($1) AND user_id = $2;",
        &ids,
        1 // TODO user ID when we have more than 1 user
    ).fetch_all(&state.db).await.unwrap();

    let id_to_status_map: HashMap<i32, WordStatusResponse> = word_statuses
        .iter()
        .map(|response| (response.id.unwrap(), response.clone())) // TODO unsafe unwrap
        .collect();

    // map from unconjugated word to list of statuses
    let mut response_body: HashMap<String, Vec<WordStatusResponse>> = HashMap::new();

    for (id, status) in id_to_status_map {
        let word = id_to_unconjugated_word_map.get(&id).unwrap(); // TODO unsafe unwrap
        response_body.entry(word.clone()).or_default().push(status);
    }

    let words_with_no_matches = unconjugated_to_ids_tuples
        .iter()
        .filter(|(_, ids)| ids.is_empty())
        .map(|(word, _)| word.clone())
        .collect::<Vec<String>>();

    for word in words_with_no_matches {
        response_body.entry(word).or_default();
    }

    let response = http::Response::builder()
        .status(http::StatusCode::OK)
        .body(serde_json::to_string(&response_body).unwrap()).unwrap();

    debug!("Request processed in {:?}", start_time.elapsed());
    Ok(response)
}