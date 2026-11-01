BEGIN;

DROP POLICY IF EXISTS leads_update_authenticated ON public.leads;
CREATE POLICY leads_update_authenticated
    ON public.leads
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

ALTER VIEW public.inventory_stock_balances
    SET (security_invoker = true);

REVOKE ALL ON public.inventory_stock_balances FROM anon;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_set_updated_at ON public.leads;
CREATE TRIGGER leads_set_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS contacts_set_updated_at ON public.contacts;
CREATE TRIGGER contacts_set_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS companies_set_updated_at ON public.companies;
CREATE TRIGGER companies_set_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

UPDATE private.authorized_emails
   SET email = lower(btrim(email));

ALTER TABLE private.authorized_emails
    DROP CONSTRAINT IF EXISTS authorized_emails_email_normalized_check;

ALTER TABLE private.authorized_emails
    ADD CONSTRAINT authorized_emails_email_normalized_check
    CHECK (email = lower(btrim(email)));

COMMIT;

