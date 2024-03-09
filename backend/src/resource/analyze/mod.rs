use std::collections::HashSet;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use std::{collections::HashMap, time::Instant};

use axum::{extract::State, http, response::IntoResponse};
use serde::{Deserialize, Serialize};
use tokio::fs::File;
use tokio::io::AsyncWriteExt;
use tokio::time::sleep;
use tracing::{debug, info};

use crate::dictionary::KrDictEntry;
use crate::error_handling::AppError;
use crate::resource::word_status::{WordStatus, WordStatusEntity, WordStatusResponse};
use crate::{hangul, search, SharedState};

// TODO: refactor this abomination
// TODO: this response has data duplication, could be split into map of unconjugated word to ids and a map of id to status
pub async fn post_handler(
    State(state): State<SharedState>,
    body: String,
) -> Result<impl IntoResponse, AppError> {
    let start_time = Instant::now();
    debug!("New request to analyze text with length {}", body.len());

    let bodytext_with_only_hangul = body.replace(|c| !hangul::is_hangul(c), " ");
    let words = bodytext_with_only_hangul
        .split_whitespace()
        .collect::<HashSet<&str>>();

    let inflected_words_to_ids_tuples = get_inflected_word_to_ids_mapping(words, &state);
    save_ids_in_cache(&inflected_words_to_ids_tuples, &state);

    let mut id_to_inflected_words_map = HashMap::<i32, Vec<String>>::new();
    inflected_words_to_ids_tuples
        .iter()
        .for_each(|(word, ids)| {
            for id in ids {
                id_to_inflected_words_map
                    .entry(*id)
                    .or_default()
                    .push(word.clone());
            }
        });

    let ids = id_to_inflected_words_map
        .keys()
        .cloned()
        .collect::<Vec<i32>>();

    let word_statuses = sqlx::query_as!(
        WordStatusEntity,
        "SELECT id, krdict_sequence_number, status as \"status: WordStatus\", ignored, tracked, user_id, created_at, updated_at
        FROM WordStatus
        WHERE krdict_sequence_number = ANY($1) AND user_id = $2;",
        &ids,
        1 // TODO: user ID when we have more than 1 user
    )
    .fetch_all(&state.db)
    .await
    .unwrap();

    let ids_with_statuses = word_statuses
        .iter()
        .map(|response| response.krdict_sequence_number.unwrap()) // TODO: unsafe unwrap
        .collect::<HashSet<i32>>();
    let ids_with_no_statuses = ids
        .iter()
        .filter(|id| !ids_with_statuses.contains(id))
        .cloned()
        .collect::<Vec<i32>>();

    let id_to_status_map: HashMap<i32, WordStatusEntity> = word_statuses
        .iter()
        .map(|response| (response.krdict_sequence_number.unwrap(), response.clone())) // TODO: unsafe unwrap
        .collect();

    // map from unconjugated word to list of statuses
    let mut response_body: HashMap<String, Vec<WordStatusResponse>> = HashMap::new();

    // words that has statuses saved
    for (id, status) in id_to_status_map {
        let words = id_to_inflected_words_map.get(&id).unwrap(); // TODO: unsafe unwrap
        let deinflected_word = state
            .dictionary
            .get_by_sequence_number(id)
            .unwrap() // TODO: unsafe unwrap
            .headword()
            .clone();
        for word in words {
            response_body.entry(word.clone()).or_default().push(
                status
                    .clone()
                    .to_dto(state.frequency_dictionary.lookup(&deinflected_word)),
            );
        }
    }

    // words that has no statuses saved
    for id in ids_with_no_statuses {
        let words = id_to_inflected_words_map.get(&id).unwrap(); // TODO: unsafe unwrap
        let deinflected_word = state
            .dictionary
            .get_by_sequence_number(id)
            .unwrap() // TODO: unsafe unwrap
            .headword()
            .clone();
        for word in words {
            response_body
                .entry(word.clone())
                .or_default()
                .push(WordStatusResponse::new(
                    id,
                    state.frequency_dictionary.lookup(&deinflected_word),
                ));
        }
    }

    let words_with_no_matches = inflected_words_to_ids_tuples
        .iter()
        .filter(|(_, ids)| ids.is_empty())
        .map(|(word, _)| word.clone())
        .collect::<Vec<String>>();

    for word in words_with_no_matches {
        response_body.entry(word).or_default();
    }

    let response = http::Response::builder()
        .status(http::StatusCode::OK)
        .body(serde_json::to_string(&response_body).unwrap())
        .unwrap();

    debug!("Request processed in {:?}", start_time.elapsed());
    Ok(response)
}

// TODO: change to hashmap
fn get_inflected_word_to_ids_mapping(
    words: HashSet<&str>,
    state: &SharedState,
) -> Vec<(String, Vec<i32>)> {
    let unconjugated_to_ids_tuples = words
        .into_iter()
        .map(|word| {
            if let Ok(cached_matches) = state.analysis_cache.lock() {
                if (*cached_matches).contains_key(word) {
                    return (
                        word.to_owned(),
                        (*cached_matches).get(word).unwrap().clone(),
                    );
                }
            }
            let matches: Vec<KrDictEntry> = search::get_all(word, &state.dictionary);
            let ids = matches
                .iter()
                .map(|m| *m.sequence_number())
                .collect::<Vec<i32>>();
            (word.to_owned(), ids)
        })
        .collect::<Vec<(String, Vec<i32>)>>();
    unconjugated_to_ids_tuples
}

fn save_ids_in_cache(unconjugated_to_ids_tuples: &Vec<(String, Vec<i32>)>, state: &SharedState) {
    for (unconjugated, ids) in unconjugated_to_ids_tuples {
        if let Ok(mut cached_matches) = state.analysis_cache.lock() {
            (*cached_matches).insert(unconjugated.clone(), ids.clone());
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnalysisResultJson(pub HashMap<String, Vec<i32>>);

pub async fn write_analysis_cache_to_file_every_ten_minutes(
    analysis_cache: Arc<Mutex<HashMap<String, Vec<i32>>>>,
) {
    loop {
        let number_of_cached_items = analysis_cache.lock().unwrap().len();
        sleep(Duration::from_secs(60 * 10)).await;

        if let Ok(cached_matches) = analysis_cache.lock() {
            if cached_matches.len() == number_of_cached_items {
                continue;
            }
            debug!("Writing {} cached items to file", cached_matches.len());
            tokio::task::spawn(write_to_file("analysis_cache.json", cached_matches.clone()));
        }
    }
}

async fn write_to_file(file_path: &str, data: HashMap<String, Vec<i32>>) -> tokio::io::Result<()> {
    let serialized_data = serde_json::to_string(&AnalysisResultJson(data))?;
    let mut file = File::create(file_path).await?;
    file.write_all(serialized_data.as_bytes()).await?;
    Ok(())
}
