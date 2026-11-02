BEGIN;

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contacts_select_authenticated ON public.contacts;
CREATE POLICY contacts_select_authenticated
    ON public.contacts
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS contacts_insert_authenticated ON public.contacts;
CREATE POLICY contacts_insert_authenticated
    ON public.contacts
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS contacts_update_authenticated ON public.contacts;
CREATE POLICY contacts_update_authenticated
    ON public.contacts
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS contacts_delete_authenticated ON public.contacts;
CREATE POLICY contacts_delete_authenticated
    ON public.contacts
    FOR DELETE
    TO authenticated
    USING (true);

REVOKE ALL ON TABLE public.contacts FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.contacts TO authenticated;

DO $$
DECLARE
    v_seq text := pg_get_serial_sequence('public.contacts', 'id');
BEGIN
    IF v_seq IS NOT NULL THEN
        EXECUTE format('REVOKE ALL ON SEQUENCE %s FROM PUBLIC, anon', v_seq);
        EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %s TO authenticated', v_seq);
    END IF;
END;
$$;

COMMIT;
