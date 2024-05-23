use axum::async_trait;
use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use axum_extra::headers::authorization::Bearer;
use axum_extra::headers::Authorization;
use axum_extra::TypedHeader;
use tower_cookies::Cookies;

use pasetors::claims::ClaimsValidationRules;
use pasetors::keys::AsymmetricPublicKey;
use pasetors::token::UntrustedToken;
use pasetors::version4::V4;
use pasetors::{public, Public};

use crate::error_handling::AppError;

use serde::{Deserialize, Serialize};

pub struct AuthSession(pub AuthToken);

// Based on https://docs.rs/axum/latest/axum/extract/index.html#implementing-fromrequestparts
#[async_trait]
impl<S> FromRequestParts<S> for AuthSession
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        match TypedHeader::<Authorization<Bearer>>::from_request_parts(parts, state).await {
            Ok(TypedHeader(auth_header)) => {
                let auth_token: AuthToken = verify_auth_token(auth_header.token().to_string())
                    .await
                    .map_err(|e| {
                        tracing::error!("Invalid token: {:#?}", e);
                        AppError::Unauthorized
                    })?;
                return Ok(Self(auth_token));
            }
            Err(_) => {
                let cookies = Cookies::from_request_parts(parts, state)
                    .await
                    .map_err(|e| {
                        tracing::error!("Missing token: {:#?}", e);
                        AppError::Unauthorized
                    })?;

                let auth_cookie = match cookies.get("rust-auth") {
                    Some(cookie) => cookie,
                    None => {
                        tracing::error!("No cookie found");
                        return Err(AppError::Unauthorized);
                    }
                };
                let auth_token: AuthToken = verify_auth_token(auth_cookie.value().to_string())
                    .await
                    .map_err(|e| {
                        tracing::error!("Invalid token: {:#?}", e);
                        AppError::Unauthorized
                    })?;
                return Ok(Self(auth_token));
            }
        }
    }
}

pub async fn verify_auth_token(token: String) -> Result<AuthToken, AppError> {
    let public_key = AsymmetricPublicKey::<V4>::try_from(
        "k4.public.ExR1TQ4Fb3OHkdR80kJIwgB7d8WNHpiijKYfQQJztyk",
    )?;

    let validation_rules = ClaimsValidationRules::new();
    let untrusted_token = UntrustedToken::<Public, V4>::try_from(&token)?;
    let trusted_token = public::verify(
        &public_key,
        &untrusted_token,
        &validation_rules,
        None,
        Some("fsdjklsfd".as_bytes()),
    )?;
    let claims = trusted_token.payload_claims().unwrap();

    let user_id_string = serde_json::from_value::<String>(
        claims.get_claim("user_id").unwrap().clone(),
    )
    .map_err(|e| AppError::Parsing(format!("Could not parse user_id from auth-token, {}", e)))?;

    let user_id = uuid::Uuid::parse_str(&user_id_string)
        .map_err(|e| AppError::Uuid(format!("user_id in auth-token is not a valid uuid, {}", e)))?;

    let is_admin = serde_json::from_value::<bool>(claims.get_claim("is_admin").unwrap().clone())
        .map_err(|e| {
            AppError::Parsing(format!("Could not parse is_admin from auth-token, {}", e))
        })?;

    Ok(AuthToken { user_id, is_admin })
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct AuthToken {
    pub user_id: uuid::Uuid,
    pub is_admin: bool,
}
