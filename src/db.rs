use sqlx::postgres::PgPoolOptions;

pub async fn init_db() -> Result<sqlx::PgPool, sqlx::Error> {
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect("postgres://postgres:secret@localhost/postgres")
        .await?;

    sqlx::query(r#"
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'word_status') THEN
                CREATE TYPE word_status AS ENUM ('unknown', 'seen', 'known');
            END IF;
        END$$;"#
    )
        .execute(&pool)
        .await?;

    sqlx::query(r#"
        CREATE TABLE IF NOT EXISTS WordStatus (
            id SERIAL PRIMARY KEY,
            krdict_sequence_number INTEGER,
            status VARCHAR(100) NOT NULL, -- TODO use enum
            ignored BOOLEAN NOT NULL,
            tracked BOOLEAN NOT NULL,
            user_id INTEGER NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT unique_user_and_sequence_no UNIQUE (user_id, krdict_sequence_number)
        );"#
    )
        .execute(&pool)
        .await?;

    sqlx::query(r#"
        CREATE TABLE IF NOT EXISTS Lookup (
            id SERIAL PRIMARY KEY,
            headword VARCHAR(255) NOT NULL,
            conjugated_form VARCHAR(255),
            user_id INTEGER NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );"#
    )
        .execute(&pool)
        .await?;

    Ok(pool)
}

#[derive(Debug, sqlx::Type)]
pub enum StatusEntity {
    Unknown,
    Seen,
    Known,
}
