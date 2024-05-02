use axum::{
    http,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

pub mod analyze;
pub mod lookup;
pub mod word_status;

pub enum ApiResponse<T> {
    JsonData(T),
    Created,
    // OK,
    NoContent,
}

impl<T> IntoResponse for ApiResponse<T>
where
    T: Serialize,
{
    fn into_response(self) -> Response {
        match self {
            Self::JsonData(data) => Json(data).into_response(),
            Self::Created => http::StatusCode::CREATED.into_response(),
            // Self::OK => http::StatusCode::OK.into_response(),
            Self::NoContent => http::StatusCode::NO_CONTENT.into_response(),
        }
    }
}
