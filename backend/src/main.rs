use std::{time::Instant, collections::HashMap, sync::{Arc, Mutex}, io::Read};

use axum::routing::{get, patch, post};
use sqlx::postgres::PgPoolOptions;
use tracing::info;
use crate::{dictionary::Dictionary, resource::analyze::{write_analysis_cache_to_file_every_ten_minutes, AnalysisResultJson}, frequency_dictionary::FrequencyDictionary};

mod deinflect;
mod hangul;
mod dictionary;
mod search;
mod resource;
mod error_handling;
mod frequency_dictionary;
mod db;

#[derive(Clone)]
pub struct SharedState {
    dictionary: Arc<Dictionary>,
    frequency_dictionary: Arc<FrequencyDictionary>,
    // Mapping from unconjugated word to sequence number/id (entry in dictionary) is cached in 
    // a file because doing analysis on several thousand words can take several seconds
    analysis_cache: Arc<Mutex<HashMap<String, Vec<i32>>>>,
    db: sqlx::PgPool,
}

impl SharedState {
    fn new(db: sqlx::PgPool) -> Self {
        let start_time = Instant::now();
        let frequency_dictionary = FrequencyDictionary::new();
        // sequence no in different languages of KRDICTs are not always the same, so we need to use sequence no of the same
        // dict regardless of which language has been selected
        let dictionary = Arc::new(Dictionary::new(
            "dictionaries/[KO-JA] KRDICT/term_bank_1.json", 
            &frequency_dictionary
        ));
        info!("Loaded dictionary in {:.2}s", start_time.elapsed().as_secs_f32());
        Self {
            dictionary,
            frequency_dictionary: Arc::new(frequency_dictionary),
            analysis_cache: read_analysis_cache_from_file("analysis_cache.json").unwrap_or_default(),
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

    tokio::spawn(write_analysis_cache_to_file_every_ten_minutes(shared_state.analysis_cache.clone()));

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

pub fn read_analysis_cache_from_file(file_path: &str) -> std::io::Result<Arc<Mutex<HashMap<String, Vec<i32>>>>> {
    let time = Instant::now();
    let mut file = std::fs::File::open(file_path)?;
    let mut buffer = String::new();
    file.read_to_string(&mut buffer)?;

    let loaded_data: AnalysisResultJson = serde_json::from_str(&buffer)?;

    info!(
        "Loaded cached analysis results with {} entries in {:?}",
        loaded_data.0.len(),
        time.elapsed()
    );
    Ok(Arc::new(Mutex::new(loaded_data.0)))
}
