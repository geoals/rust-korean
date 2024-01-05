use std::str::FromStr;
use axum::routing::{get, post};
use serde::Deserialize;
use sqlx::{FromRow};
use tracing::debug;
use crate::dictionary::Dictionary;

mod deinflect;
mod hangul;
mod dictionary;
mod search;
mod resource;
mod db;

#[derive(Clone)]
pub struct SharedState {
    dictionary: Dictionary,
    db: sqlx::PgPool,
}

impl SharedState {
    fn new(db: sqlx::PgPool) -> Self {
        Self {
            dictionary: Dictionary::new("dictionaries/[KO-JA] KRDICT/term_bank_1.json"),
            db
        }
    }
}

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    tracing_subscriber::fmt::init();

    let db = db::init_db().await?;

    let shared_state = SharedState::new(db);
    let app = axum::Router::new()
        .route("/lookup/:term", get(resource::lookup::handler))
        .route("/word_status/:id", post(resource::word_status::post_handler))
        .route("/word_status/:id", get(resource::word_status::get_handler))
        // .route("/word_status/:id/toggle_tracked", post(resource::word_status::tracked::handler))
        // .route("/word_status/:id/seen", post(resource::word_status::seen::handler))
        // .route("/word_status/:id/known", post(resource::word_status::known::handler))
        // .route("/word_status/:id/unknown", post(resource::word_status::unknown::handler))
        .with_state(shared_state);

    let listener = tokio::net::TcpListener::bind("localhost:3000").await?;
    debug!("listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, app).await?;

    Ok(())
}
