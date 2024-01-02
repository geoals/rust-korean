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

    let response = serde_json::to_string(&matches).unwrap();

    debug!("Request processed in {:?}", start_time.elapsed());
    response
}
