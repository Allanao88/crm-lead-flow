BEGIN;

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO postgres;

CREATE TABLE private.authorized_emails (
    email text PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by text
);

REVOKE ALL ON TABLE private.authorized_emails
    FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.check_authorized_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    normalized_email text;
BEGIN
    normalized_email := lower(trim(NEW.email));

    IF normalized_email IS NULL OR normalized_email = '' THEN
        RAISE EXCEPTION 'Email is required for registration'
            USING ERRCODE = '23514';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM private.authorized_emails AS ae
        WHERE ae.email = normalized_email
    ) THEN
        RAISE EXCEPTION 'Registration is not authorized'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.check_authorized_email()
    FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_authorized_email ON auth.users;

CREATE TRIGGER enforce_authorized_email
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION private.check_authorized_email();

COMMIT;
