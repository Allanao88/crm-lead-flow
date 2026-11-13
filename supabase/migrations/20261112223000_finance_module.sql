BEGIN;

-- ============================================================================
-- 1. Tabela public.user_roles (perfis de usuário)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('admin')),
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_roles_select_own ON public.user_roles;
CREATE POLICY user_roles_select_own
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

REVOKE ALL ON TABLE public.user_roles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.user_roles TO authenticated;

-- ============================================================================
-- 2. Função public.is_admin() (validação de privilégio de administrador)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
          FROM public.user_roles
         WHERE user_id = auth.uid()
           AND role = 'admin'
    );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============================================================================
-- 3. Tabela public.finance_suppliers (fornecedores de custos recorrentes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.finance_suppliers (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name text NOT NULL CHECK (btrim(name) <> ''),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS finance_suppliers_name_lower_idx
    ON public.finance_suppliers (lower(btrim(name)));

ALTER TABLE public.finance_suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS finance_suppliers_select_admin ON public.finance_suppliers;
CREATE POLICY finance_suppliers_select_admin
    ON public.finance_suppliers
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS finance_suppliers_insert_admin ON public.finance_suppliers;
CREATE POLICY finance_suppliers_insert_admin
    ON public.finance_suppliers
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin() AND btrim(name) <> '');

DROP POLICY IF EXISTS finance_suppliers_update_admin ON public.finance_suppliers;
CREATE POLICY finance_suppliers_update_admin
    ON public.finance_suppliers
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin() AND btrim(name) <> '');

DROP POLICY IF EXISTS finance_suppliers_delete_admin ON public.finance_suppliers;
CREATE POLICY finance_suppliers_delete_admin
    ON public.finance_suppliers
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

REVOKE ALL ON TABLE public.finance_suppliers FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.finance_suppliers TO authenticated;

-- ============================================================================
-- 4. Tabela public.lead_costs (custos mensais vinculados ao cliente/lead)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.lead_costs (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    lead_id bigint NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    supplier_id bigint NOT NULL REFERENCES public.finance_suppliers(id) ON DELETE RESTRICT,
    amount_monthly numeric(12,2) NOT NULL CHECK (amount_monthly >= 0),
    note text,
    created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_costs_lead_id_idx
    ON public.lead_costs (lead_id);

CREATE INDEX IF NOT EXISTS lead_costs_supplier_id_idx
    ON public.lead_costs (supplier_id);

DROP TRIGGER IF EXISTS lead_costs_set_updated_at ON public.lead_costs;
CREATE TRIGGER lead_costs_set_updated_at
BEFORE UPDATE ON public.lead_costs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.lead_costs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lead_costs_select_admin ON public.lead_costs;
CREATE POLICY lead_costs_select_admin
    ON public.lead_costs
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS lead_costs_insert_admin ON public.lead_costs;
CREATE POLICY lead_costs_insert_admin
    ON public.lead_costs
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS lead_costs_update_admin ON public.lead_costs;
CREATE POLICY lead_costs_update_admin
    ON public.lead_costs
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS lead_costs_delete_admin ON public.lead_costs;
CREATE POLICY lead_costs_delete_admin
    ON public.lead_costs
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

REVOKE ALL ON TABLE public.lead_costs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.lead_costs TO authenticated;

-- ============================================================================
-- 5. RPC public.finance_client_margins() (detalhamento por cliente Ganho)
-- ============================================================================
DROP FUNCTION IF EXISTS public.finance_client_margins();

CREATE OR REPLACE FUNCTION public.finance_client_margins()
RETURNS TABLE (
    lead_id bigint,
    lead_name text,
    company text,
    mrr_value numeric,
    total_costs numeric,
    net_margin numeric,
    cost_percent numeric,
    cost_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso restrito a administradores.';
    END IF;

    RETURN QUERY
    WITH costs_by_lead AS (
        SELECT lc.lead_id AS c_lead_id,
               COALESCE(sum(lc.amount_monthly), 0)::numeric(12,2) AS c_total_costs,
               count(*)::bigint AS c_cost_count
          FROM public.lead_costs lc
         GROUP BY lc.lead_id
    )
    SELECT l.id AS lead_id,
           l.name AS lead_name,
           l.company,
           COALESCE(l.mrr_value, 0)::numeric(12,2) AS mrr_value,
           COALESCE(c.c_total_costs, 0)::numeric(12,2) AS total_costs,
           (COALESCE(l.mrr_value, 0) - COALESCE(c.c_total_costs, 0))::numeric(12,2) AS net_margin,
           CASE
               WHEN COALESCE(l.mrr_value, 0) > 0 THEN
                   ROUND((COALESCE(c.c_total_costs, 0) / l.mrr_value) * 100, 2)::numeric
               ELSE
                   NULL::numeric
           END AS cost_percent,
           COALESCE(c.c_cost_count, 0)::bigint AS cost_count
      FROM public.leads l
      LEFT JOIN costs_by_lead c ON c.c_lead_id = l.id
     WHERE l.stage = 'Ganho'
       AND l.archived_at IS NULL
     ORDER BY l.name ASC, l.id ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.finance_client_margins() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finance_client_margins() TO authenticated;

-- ============================================================================
-- 6. RPC public.finance_totals() (métricas consolidadas do módulo financeiro)
-- ============================================================================
DROP FUNCTION IF EXISTS public.finance_totals();

CREATE OR REPLACE FUNCTION public.finance_totals()
RETURNS TABLE (
    total_mrr numeric,
    total_costs numeric,
    total_margin numeric,
    cost_percent numeric,
    clients_count bigint,
    clients_without_costs bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso restrito a administradores.';
    END IF;

    RETURN QUERY
    WITH active_clients AS (
        SELECT l.id,
               COALESCE(l.mrr_value, 0)::numeric(12,2) AS mrr
          FROM public.leads l
         WHERE l.stage = 'Ganho'
           AND l.archived_at IS NULL
    ),
    client_costs AS (
        SELECT lc.lead_id,
               COALESCE(sum(lc.amount_monthly), 0)::numeric(12,2) AS sum_costs
          FROM public.lead_costs lc
         INNER JOIN active_clients ac ON ac.id = lc.lead_id
         GROUP BY lc.lead_id
    ),
    aggregated AS (
        SELECT
            COALESCE(sum(ac.mrr), 0)::numeric(12,2) AS agg_mrr,
            COALESCE(sum(cc.sum_costs), 0)::numeric(12,2) AS agg_costs,
            count(ac.id)::bigint AS agg_clients,
            count(ac.id) FILTER (WHERE cc.lead_id IS NULL)::bigint AS agg_without_costs
          FROM active_clients ac
          LEFT JOIN client_costs cc ON cc.lead_id = ac.id
    )
    SELECT
        agg_mrr AS total_mrr,
        agg_costs AS total_costs,
        (agg_mrr - agg_costs)::numeric(12,2) AS total_margin,
        CASE
            WHEN agg_mrr > 0 THEN
                ROUND((agg_costs / agg_mrr) * 100, 2)::numeric
            ELSE
                NULL::numeric
        END AS cost_percent,
        agg_clients AS clients_count,
        agg_without_costs AS clients_without_costs
      FROM aggregated;
END;
$$;

REVOKE ALL ON FUNCTION public.finance_totals() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finance_totals() TO authenticated;

COMMIT;
