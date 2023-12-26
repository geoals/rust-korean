use std::time::Instant;
use axum::extract::{Path, State};
use axum::response::IntoResponse;
use tracing::{debug};
use crate::{SharedState, search};
use crate::dictionary::KrDictEntry;

pub async fn handler(
    Path(term): Path<String>,
    State(state): State<SharedState>,
) -> impl IntoResponse {
    let start_time = Instant::now();
    debug!("New request for {}", term); // TODO request ID

    let matches = search::get(&term, &state.dictionary);
    debug!("Found {} matches", matches.len());

    let response = if let Some(value) = matches.first() {
        value.get_first_definition().unwrap_or(&String::from("")).clone()
    } else {
        "".to_string()
    };

    debug!("Request processed in {:?}", start_time.elapsed());
    response
}
