use axum::extract::{Path, State};
use axum::response::IntoResponse;
use tracing::{debug};
use crate::{SharedState, search};

pub async fn handler(
    Path(term): Path<String>,
    State(state): State<SharedState>,
) -> impl IntoResponse {
    debug!("New request for {}", term); // TODO request ID

    let matches = search::get(&term, &state.dictionary);
    debug!("Found {} matches", matches.len());
    matches.first().unwrap().get_first_definition().unwrap().clone()
}
