use crate::dictionary::{Headword, KrDictEntry};
use crate::error_handling::AppError;
use crate::extractors::auth_session::AuthSession;
use crate::routes::word_status::{WordStatus, WordStatusResponse};
use crate::{db, search, SharedState};
use axum::extract::{Path, State};
use serde::Serialize;
use std::collections::BTreeMap;
use std::sync::Arc;
use tracing::info;

use super::ApiResponse;

pub async fn get(
    Path(term): Path<String>,
    State(state): State<SharedState>,
    AuthSession(session): AuthSession,
) -> Result<ApiResponse<LookupResponse>, AppError> {
    // Use Arc to avoid cloning the matches themselves when spawning task to insert in db
    let matches: Arc<Vec<KrDictEntry>> = Arc::new(search::get_all(&term, &state.dictionary));
    info!("Found {} matches", matches.len());

    if !matches.is_empty() {
        db::lookup::insert(
            state.db.clone(),
            term.clone(),
            Arc::clone(&matches),
            session.user_id,
        )
        .await?;
    }

    let ids = matches
        .iter()
        .map(|m| *m.sequence_number())
        .collect::<Vec<i32>>();

    let word_statuses: Vec<WordStatusResponse> =
        db::word_status::get_all(&state.db, &ids, session.user_id)
            .await?
            .iter()
            .map(|it| it.to_dto(None))
            .collect(); // TODO: frequency rank

    // TODO: remove unnecessary clone
    // Combine dictionary match with word status and map to DTO
    let matches = matches
        .iter()
        .map(|m| {
            let word_status = word_statuses
                .iter()
                .find(|ws| ws.id == Some(*m.sequence_number()))
                .unwrap_or(&WordStatusResponse {
                    id: None,
                    status: WordStatus::Unknown,
                    ignored: false,
                    frequency_rank: None,
                })
                .clone();

            LookupDTO {
                dict_entry: m.clone(),
                status: word_status,
            }
        })
        .collect::<Vec<LookupDTO>>();

    let mut matches_map = group_matches_by_headword(matches);
    sort_list_in_each_key_by_stars(&mut matches_map);
    Ok(ApiResponse::JsonData(matches_map))
}

fn group_matches_by_headword(matches: Vec<LookupDTO>) -> LookupResponse {
    LookupResponse(matches.into_iter().fold(
        BTreeMap::new(),
        |mut map: BTreeMap<Headword, Vec<LookupDTO>>, match_| {
            map.entry(match_.dict_entry.headword().clone())
                .or_default()
                .push(match_);
            map
        },
    ))
}

fn sort_list_in_each_key_by_stars(matches_map: &mut LookupResponse) {
    for value in matches_map.0.values_mut() {
        value.sort_by_key(|v| *v.dict_entry.stars());
        value.reverse();
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LookupDTO {
    pub dict_entry: KrDictEntry,
    pub status: WordStatusResponse,
}

#[derive(Serialize)]
pub struct LookupResponse(BTreeMap<Headword, Vec<LookupDTO>>);
