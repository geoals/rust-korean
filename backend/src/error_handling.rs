use axum::{http, response::IntoResponse};
use serde::Serialize;
use tracing::error;

#[derive(Debug)]
pub enum AppError {
    SQLError(sqlx::Error),
}

impl From<sqlx::Error> for AppError {
    fn from(error: sqlx::Error) -> Self {
        Self::SQLError(error)
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        #[derive(Serialize)]
        struct ErrorResponse {
            message: String,
        }

        match self {
            AppError::SQLError(err) => {
                error!("SQL error: {:?}", err);
                http::StatusCode::INTERNAL_SERVER_ERROR
            }
        }
        .into_response()
    }
}
