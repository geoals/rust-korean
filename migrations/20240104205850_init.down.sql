DROP TABLE IF EXISTS WordStatus;
DROP TABLE IF EXISTS Lookup;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'word_status') THEN
        DROP TYPE word_status;
    END IF;
END$$;

DROP TRIGGER IF EXISTS word_status_updated_at_trigger ON word_status;
DROP FUNCTION IF EXISTS update_updated_at();
