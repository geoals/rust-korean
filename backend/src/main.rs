use std::{time::Instant, collections::HashMap, sync::{Arc, Mutex}};

use axum::routing::{get, patch, post};
use sqlx::postgres::PgPoolOptions;
use tracing::info;
use crate::{dictionary::Dictionary, resource::analyze::read_from_file};

mod deinflect;
mod hangul;
mod dictionary;
mod search;
mod resource;
mod error_handling;
mod frequency_dictionary;

#[derive(Clone)]
pub struct SharedState {
    dictionary: Arc<Dictionary>,
    // Mapping from unconjugated word to sequence number/id (entry in dictionary) is cached in 
    // a file because doing analysis on several thousand words can take several seconds
    // TODO use async mutex/rwlock
    analysis_cache: Arc<Mutex<HashMap<String, Vec<i32>>>>,
    db: sqlx::PgPool,
}

impl SharedState {
    fn new(db: sqlx::PgPool) -> Self {
        let start_time = Instant::now();
        // sequence no in different languages of KRDICTs are not always the same, so we need to use sequence no of the same
        // dict regardless of which language has been selected
        let dictionary = Arc::new(Dictionary::new("dictionaries/[KO-JA] KRDICT/term_bank_1.json"));
        info!("Loaded dictionary in {:.2}s", start_time.elapsed().as_secs_f32());
        Self {
            dictionary,
            analysis_cache: read_from_file("analysis_cache.json").expect("Could not read cache file"),
            db,
        }
    }
}

#[tokio::main]
async fn main() -> Result<(), std::io::Error> {
    let start_time = Instant::now();
    tracing_subscriber::fmt::init();
    info!("Application starting...");

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
        .route("/word_status/count",get(resource::word_status::count::get_handler))
        .route("/analyze",          post(resource::analyze::post_handler))
        .with_state(shared_state);


    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await?;
    info!("Application ready in {:.2}s - listening on {}", start_time.elapsed().as_secs_f32(), listener.local_addr().unwrap());
    axum::serve(listener, app).await?;

    Ok(())
}
