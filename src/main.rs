use axum::routing::get;
use tracing::debug;
use crate::dictionary::Dictionary;

mod deinflect;
mod hangul;
mod dictionary;
mod search;
mod resource;

#[derive(Clone)]
pub struct SharedState {
    dictionary: Dictionary,
}

impl SharedState {
    fn new() -> Self {
        Self {
            dictionary: Dictionary::new("dictionaries/[KO-JA] KRDICT/term_bank_1.json"),
        }
    }
}

#[tokio::main]
async fn main() {
    let shared_state = SharedState::new();
    let app = axum::Router::new()
        .route("/lookup/:term", get(resource::lookup::handler))
        .with_state(shared_state);

    tracing_subscriber::fmt::init();

    let listener = tokio::net::TcpListener::bind("localhost:3000").await.unwrap();
    debug!("listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}

