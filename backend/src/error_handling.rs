use axum::{http, response::IntoResponse};
use serde::Serialize;
use tracing::error;

#[derive(Debug)]
pub enum AppError {
    Sql(sqlx::Error),
    Parsing(String),
    Paseto(pasetors::errors::Error),
    Uuid(String),
    Unauthorized,
}

impl From<sqlx::Error> for AppError {
    fn from(error: sqlx::Error) -> Self {
        Self::Sql(error)
    }
}

impl From<pasetors::errors::Error> for AppError {
    fn from(error: pasetors::errors::Error) -> Self {
        Self::Paseto(error)
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        #[derive(Serialize)]
        struct ErrorResponse {
            message: String,
        }

        match self {
            AppError::Sql(err) => {
                error!("SQL error: {:?}", err);
                http::StatusCode::INTERNAL_SERVER_ERROR
            }
            AppError::Parsing(err) => {
                error!("Parse error: {:?}", err);
                http::StatusCode::INTERNAL_SERVER_ERROR
            }
            AppError::Uuid(err) => {
                error!("UUID error: {:?}", err);
                http::StatusCode::INTERNAL_SERVER_ERROR
            }
            AppError::Paseto(err) => {
                error!("Paseto error: {:?}", err);
                http::StatusCode::INTERNAL_SERVER_ERROR
            }
            AppError::Unauthorized => http::StatusCode::UNAUTHORIZED,
        }
        .into_response()
    }
}
