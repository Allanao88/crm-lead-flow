-- ============================================================================
-- SCRIPT DE VERIFICAÇÃO / VALIDAÇÃO — MÓDULO FINANCEIRO
-- Este arquivo contém consultas de conferência para executar manualmente no
-- Supabase SQL Editor após aplicar a migration.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. COMO TORNAR UM USUÁRIO ADMINISTRADOR (Rodar como postgres / service_role)
-- ----------------------------------------------------------------------------
-- Substitua '<USER_UUID>' pelo id do usuário cadastrado em auth.users
/*
INSERT INTO public.user_roles (user_id, role)
VALUES ('<USER_UUID>', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
*/

-- ----------------------------------------------------------------------------
-- 2. VERIFICAÇÃO DE ESTRUTURA E PRIVILÉGIOS (Como postgres)
-- ----------------------------------------------------------------------------
-- Verifica existência das novas tabelas
SELECT table_name, rowsecurity
  FROM information_schema.tables
  JOIN pg_tables ON pg_tables.tablename = information_schema.tables.table_name
 WHERE table_schema = 'public'
   AND table_name IN ('user_roles', 'finance_suppliers', 'lead_costs');

-- Verifica se anon não possui nenhum privilégio nas tabelas
SELECT grantee, table_name, privilege_type
  FROM information_schema.role_table_grants
 WHERE table_schema = 'public'
   AND table_name IN ('user_roles', 'finance_suppliers', 'lead_costs')
   AND grantee = 'anon';
-- Deve retornar 0 linhas!

-- ----------------------------------------------------------------------------
-- 3. TESTE COMO USUÁRIO COMUM NÃO-ADMINISTRADOR
-- ----------------------------------------------------------------------------
/*
-- Simula sessão de usuário não-admin
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "00000000-0000-0000-0000-000000000002", "role": "authenticated"}';

-- a) is_admin() deve retornar false
SELECT public.is_admin(); -- Esperado: false

-- b) Consulta a finance_suppliers e lead_costs deve retornar 0 linhas (bloqueado por RLS)
SELECT * FROM public.finance_suppliers; -- Esperado: 0 linhas
SELECT * FROM public.lead_costs;        -- Esperado: 0 linhas

-- c) Tentativa de inserir fornecedor ou custo deve falhar por RLS
INSERT INTO public.finance_suppliers (name) VALUES ('Fornecedor Teste');
-- Esperado: ERROR: new row violates row-level security policy for table "finance_suppliers"

-- d) RPCs devem disparar exceção em pt-BR
SELECT * FROM public.finance_client_margins();
-- Esperado: ERROR: Acesso restrito a administradores.

SELECT * FROM public.finance_totals();
-- Esperado: ERROR: Acesso restrito a administradores.

-- e) Tentativa de se auto-promover em user_roles deve ser negada
INSERT INTO public.user_roles (user_id, role)
VALUES ('00000000-0000-0000-0000-000000000002', 'admin');
-- Esperado: ERROR: permission denied for table user_roles
*/

-- ----------------------------------------------------------------------------
-- 4. TESTE COMO ADMINISTRADOR
-- ----------------------------------------------------------------------------
/*
-- Simula sessão de usuário administrador previamente inserido em user_roles
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "00000000-0000-0000-0000-000000000001", "role": "authenticated"}';

-- a) is_admin() deve retornar true
SELECT public.is_admin(); -- Esperado: true

-- b) Deve permitir listar e criar fornecedor
INSERT INTO public.finance_suppliers (name)
VALUES ('Supabase Inc')
RETURNING *;

-- c) Consulta das RPCs com cálculo automático
SELECT * FROM public.finance_totals();
-- Retorna totais agregados de leads Ganho

SELECT * FROM public.finance_client_margins();
-- Retorna cada cliente Ganho com MRR, custos somados, margem e % de custo
*/
