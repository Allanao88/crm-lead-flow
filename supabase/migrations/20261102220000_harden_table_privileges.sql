BEGIN;

-- anon não deve ter nenhum privilégio nas tabelas do app.
REVOKE ALL ON TABLE public.companies           FROM anon;
REVOKE ALL ON TABLE public.inventory_movements FROM anon;
REVOKE ALL ON TABLE public.inventory_products  FROM anon;
REVOKE ALL ON TABLE public.lead_products       FROM anon;

-- authenticated: remove só o que o app não usa e que ignora o RLS (TRUNCATE).
-- Os grants por coluna de UPDATE/INSERT continuam intactos.
REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLE public.companies           FROM authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLE public.inventory_movements FROM authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLE public.inventory_products  FROM authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLE public.lead_products       FROM authenticated;

-- View de saldos: somente leitura.
REVOKE ALL ON TABLE public.inventory_stock_balances FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.inventory_stock_balances TO authenticated;

-- Funções de trigger não precisam ser executáveis por anon/PUBLIC.
REVOKE EXECUTE ON FUNCTION public.guard_lead_products_for_won_lead()   FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.prevent_inventory_movement_mutation() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_updated_at()                      FROM PUBLIC, anon;

COMMIT;
