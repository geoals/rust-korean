use std::time::Instant;

use axum::routing::{get, patch};
use sqlx::postgres::PgPoolOptions;
use tracing::info;
use crate::dictionary::Dictionary;

mod deinflect;
mod hangul;
mod dictionary;
mod search;
mod resource;
mod error_handling;

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
async fn main() -> Result<(), std::io::Error> {
    let start_time = Instant::now();
    tracing_subscriber::fmt::init();

    let db = PgPoolOptions::new()
            .max_connections(128)
            .connect("postgres://postgres:secret@localhost/postgres")
            .await
            .unwrap();

    let shared_state = SharedState::new(db);
    let app = axum::Router::new()
        .route("/lookup/:term",     get(resource::lookup::get_handler))
        .route("/word_status/:id",  get(resource::word_status::get_handler))
        .route("/word_status/:id",  patch(resource::word_status::patch_handler))
        .with_state(shared_state);

    let listener = tokio::net::TcpListener::bind("localhost:3000").await?;
    info!("Application ready in {:?}, listening on {}", start_time.elapsed(), listener.local_addr().unwrap());
    axum::serve(listener, app).await?;

    Ok(())
}
