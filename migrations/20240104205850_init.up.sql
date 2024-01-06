DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'word_status') THEN
        CREATE TYPE word_status AS ENUM ('unknown', 'seen', 'known');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS WordStatus (
    id SERIAL PRIMARY KEY,
    krdict_sequence_number INTEGER UNIQUE,
    status word_status NOT NULL,
    ignored BOOLEAN NOT NULL,
    tracked BOOLEAN NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_and_sequence_no UNIQUE (user_id, krdict_sequence_number)
);

CREATE TABLE IF NOT EXISTS Lookup (
    id SERIAL PRIMARY KEY,
    headword VARCHAR(255) NOT NULL,
    conjugated_form VARCHAR(255),
    user_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER word_status_updated_at_trigger
BEFORE UPDATE ON WordStatus
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
