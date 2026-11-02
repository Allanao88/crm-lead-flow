BEGIN;

DROP FUNCTION IF EXISTS public.lead_stage_summary();

CREATE OR REPLACE FUNCTION public.lead_stage_summary()
RETURNS TABLE (
    stage text,
    lead_count bigint,
    setup_total numeric,
    mrr_total numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
    SELECT l.stage,
           count(*)::bigint AS lead_count,
           COALESCE(sum(l.setup_value), 0)::numeric AS setup_total,
           COALESCE(sum(l.mrr_value), 0)::numeric AS mrr_total
      FROM public.leads AS l
     GROUP BY l.stage;
$$;

REVOKE ALL ON FUNCTION public.lead_stage_summary() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.lead_stage_summary() TO authenticated;

COMMIT;

