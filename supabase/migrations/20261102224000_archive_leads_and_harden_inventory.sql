BEGIN;

-- 1. Arquivamento lógico (soft delete) em leads e índice parcial para listagem padrão.
ALTER TABLE public.leads
    ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS leads_active_created_at_id_idx
    ON public.leads (created_at DESC, id DESC)
    WHERE archived_at IS NULL;

-- 2. Endurecimento de privilégios em leads e inventory_products (sem privilégios para anon e sem DELETE).
REVOKE ALL ON TABLE public.leads FROM PUBLIC, anon;
REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.leads FROM authenticated;

REVOKE ALL ON TABLE public.inventory_products FROM PUBLIC, anon;
REVOKE DELETE ON TABLE public.inventory_products FROM authenticated;

-- 3. Trigger de atualização automática de updated_at em inventory_products.
DROP TRIGGER IF EXISTS set_updated_at ON public.inventory_products;
DROP TRIGGER IF EXISTS inventory_products_set_updated_at ON public.inventory_products;
CREATE TRIGGER inventory_products_set_updated_at
BEFORE UPDATE ON public.inventory_products
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 4. Resumo comercial por etapa ignorando leads arquivados.
DROP FUNCTION IF EXISTS public.lead_stage_summary();

CREATE FUNCTION public.lead_stage_summary()
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
     WHERE l.archived_at IS NULL
     GROUP BY l.stage;
$$;

REVOKE ALL ON FUNCTION public.lead_stage_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lead_stage_summary() TO authenticated;

-- 5. RPC para arquivar e restaurar leads com tratamento idempotente e bloqueio em "Ganho".
CREATE OR REPLACE FUNCTION public.set_lead_archived(
    p_lead_id bigint,
    p_archived boolean
)
RETURNS public.leads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_lead public.leads%ROWTYPE;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;

    IF p_lead_id IS NULL THEN
        RAISE EXCEPTION 'Informe o lead.';
    END IF;

    IF p_archived IS NULL THEN
        RAISE EXCEPTION 'Informe a operação de arquivamento.';
    END IF;

    SELECT *
      INTO v_lead
      FROM public.leads
     WHERE id = p_lead_id
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lead não encontrado.';
    END IF;

    IF p_archived THEN
        IF v_lead.archived_at IS NOT NULL THEN
            RETURN v_lead;
        END IF;

        IF v_lead.stage = 'Ganho' THEN
            IF EXISTS (
                SELECT 1
                  FROM public.inventory_movements
                 WHERE lead_id = p_lead_id
            ) THEN
                RAISE EXCEPTION
                    'Não é possível arquivar um lead na etapa "Ganho" com movimentações de estoque. Reabra o lead para outra etapa antes de arquivar.';
            END IF;

            RAISE EXCEPTION
                'Não é possível arquivar um lead na etapa "Ganho". Reabra o lead para outra etapa antes de arquivar.';
        END IF;

        UPDATE public.leads
           SET archived_at = now()
         WHERE id = p_lead_id
        RETURNING * INTO v_lead;
    ELSE
        IF v_lead.archived_at IS NULL THEN
            RETURN v_lead;
        END IF;

        UPDATE public.leads
           SET archived_at = NULL
         WHERE id = p_lead_id
        RETURNING * INTO v_lead;
    END IF;

    RETURN v_lead;
END;
$$;

REVOKE ALL ON FUNCTION public.set_lead_archived(bigint, boolean)
    FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.set_lead_archived(bigint, boolean)
    TO authenticated;

-- 6. Movimentações manuais recusam produtos inativos com mensagem explícita em pt-BR.
CREATE OR REPLACE FUNCTION public.inventory_register_movement(
    p_product_id bigint,
    p_quantity numeric,
    p_movement_type text,
    p_unit_cost numeric DEFAULT NULL,
    p_reason text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_product_name text;
    v_is_active boolean;
    v_average_cost numeric(14,4);
    v_balance numeric(14,3);
    v_new_average numeric(14,4);
    v_unit_cost numeric(14,4);
    v_movement_id bigint;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;

    IF p_product_id IS NULL THEN
        RAISE EXCEPTION 'Informe o produto.';
    END IF;

    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        RAISE EXCEPTION 'A quantidade deve ser maior que zero.';
    END IF;

    IF p_quantity <> round(p_quantity, 3) THEN
        RAISE EXCEPTION 'A quantidade aceita no máximo três casas decimais.';
    END IF;

    IF p_movement_type NOT IN ('entry', 'exit') THEN
        RAISE EXCEPTION 'Tipo inválido. Use entry ou exit.';
    END IF;

    IF p_movement_type = 'entry'
       AND (p_unit_cost IS NULL OR p_unit_cost < 0) THEN
        RAISE EXCEPTION 'Informe um custo unitário válido para a entrada.';
    END IF;

    IF p_movement_type = 'entry'
       AND p_unit_cost <> round(p_unit_cost, 4) THEN
        RAISE EXCEPTION 'O custo unitário aceita no máximo quatro casas decimais.';
    END IF;

    SELECT name, is_active, average_cost
      INTO v_product_name, v_is_active, v_average_cost
      FROM public.inventory_products
     WHERE id = p_product_id
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Produto não encontrado.';
    END IF;

    IF NOT v_is_active THEN
        RAISE EXCEPTION
            'O produto "%" está inativo e não aceita novas movimentações.',
            v_product_name;
    END IF;

    SELECT COALESCE(SUM(quantity_delta), 0)
      INTO v_balance
      FROM public.inventory_movements
     WHERE product_id = p_product_id;

    IF p_movement_type = 'entry' THEN
        v_unit_cost := round(p_unit_cost, 4);

        v_new_average := CASE
            WHEN v_balance = 0 THEN v_unit_cost
            ELSE round(
                ((v_balance * v_average_cost) +
                 (p_quantity * v_unit_cost)) /
                (v_balance + p_quantity),
                4
            )
        END;

        UPDATE public.inventory_products
           SET average_cost = v_new_average
         WHERE id = p_product_id;

        INSERT INTO public.inventory_movements (
            product_id, movement_type, quantity_delta,
            unit_cost, total_cost, reason, created_by
        )
        VALUES (
            p_product_id, 'entry', p_quantity,
            v_unit_cost, round(p_quantity * v_unit_cost, 4),
            COALESCE(NULLIF(btrim(p_reason), ''), 'Entrada manual'),
            auth.uid()
        )
        RETURNING id INTO v_movement_id;
    ELSE
        IF p_quantity > v_balance THEN
            RAISE EXCEPTION
                'Estoque insuficiente. Disponível: %, solicitado: %.',
                v_balance, p_quantity;
        END IF;

        v_unit_cost := v_average_cost;

        INSERT INTO public.inventory_movements (
            product_id, movement_type, quantity_delta,
            unit_cost, total_cost, reason, created_by
        )
        VALUES (
            p_product_id, 'exit', -p_quantity,
            v_unit_cost, round(p_quantity * v_unit_cost, 4),
            COALESCE(NULLIF(btrim(p_reason), ''), 'Saída manual'),
            auth.uid()
        )
        RETURNING id INTO v_movement_id;
    END IF;

    RETURN v_movement_id;
END;
$$;

REVOKE ALL ON FUNCTION public.inventory_register_movement(
    bigint, numeric, text, numeric, text
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.inventory_register_movement(
    bigint, numeric, text, numeric, text
) TO authenticated;

-- 7. Vínculo de produtos ao lead: recusa leads arquivados e novos produtos inativos,
-- preservando vínculos preexistentes quando o produto foi desativado depois.
CREATE OR REPLACE FUNCTION public.set_lead_products(
    p_lead_id bigint,
    p_items jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_stage text;
    v_archived_at timestamptz;
    v_item jsonb;
    v_product_id bigint;
    v_quantity numeric;
    v_product_name text;
    v_is_active boolean;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;

    IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
        RAISE EXCEPTION 'Informe uma lista válida de produtos.';
    END IF;

    SELECT stage, archived_at
      INTO v_stage, v_archived_at
      FROM public.leads
     WHERE id = p_lead_id
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lead não encontrado.';
    END IF;

    IF v_archived_at IS NOT NULL THEN
        RAISE EXCEPTION
            'Não é permitido alterar os produtos de um lead arquivado. Restaure o lead antes de salvar alterações.';
    END IF;

    IF v_stage = 'Ganho' THEN
        RAISE EXCEPTION 'Não é permitido alterar os produtos de um lead ganho.';
    END IF;

    FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
    LOOP
        IF jsonb_typeof(v_item) <> 'object'
           OR NOT (v_item ? 'product_id')
           OR NOT (v_item ? 'quantity') THEN
            RAISE EXCEPTION 'Cada item precisa informar produto e quantidade.';
        END IF;

        IF jsonb_typeof(v_item->'product_id') <> 'number'
           OR jsonb_typeof(v_item->'quantity') <> 'number' THEN
            RAISE EXCEPTION 'Produto e quantidade devem ser numéricos.';
        END IF;

        v_product_id := (v_item->>'product_id')::bigint;
        v_quantity := (v_item->>'quantity')::numeric;

        IF v_product_id <= 0
           OR v_quantity <= 0
           OR v_quantity <> round(v_quantity, 3) THEN
            RAISE EXCEPTION 'Produto ou quantidade inválidos.';
        END IF;

        SELECT name, is_active
          INTO v_product_name, v_is_active
          FROM public.inventory_products
         WHERE id = v_product_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Produto não encontrado (ID %).', v_product_id;
        END IF;

        IF NOT v_is_active
           AND NOT EXISTS (
               SELECT 1
                 FROM public.lead_products AS lp
                WHERE lp.lead_id = p_lead_id
                  AND lp.product_id = v_product_id
           ) THEN
            RAISE EXCEPTION
                'O produto "%" está inativo e não pode ser vinculado ao lead.',
                v_product_name;
        END IF;
    END LOOP;

    IF EXISTS (
        SELECT 1
          FROM jsonb_array_elements(p_items) AS item(value)
         GROUP BY (value->>'product_id')::bigint
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Cada produto deve aparecer apenas uma vez.';
    END IF;

    DELETE FROM public.lead_products AS lp
     WHERE lp.lead_id = p_lead_id
       AND NOT EXISTS (
           SELECT 1
             FROM jsonb_array_elements(p_items) AS item(value)
            WHERE (item.value->>'product_id')::bigint = lp.product_id
       );

    FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.lead_products (
            lead_id, product_id, quantity
        )
        VALUES (
            p_lead_id,
            (v_item->>'product_id')::bigint,
            round((v_item->>'quantity')::numeric, 3)
        )
        ON CONFLICT (lead_id, product_id) DO UPDATE
           SET quantity = EXCLUDED.quantity,
               updated_at = now()
         WHERE public.lead_products.quantity IS DISTINCT FROM EXCLUDED.quantity;
    END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.set_lead_products(bigint, jsonb)
    FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.set_lead_products(bigint, jsonb)
    TO authenticated;

-- 8. Mudança de etapa bloqueada para leads arquivados.
CREATE OR REPLACE FUNCTION public.set_lead_stage_with_inventory(
    p_lead_id bigint,
    p_stage text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_current_stage text;
    v_archived_at timestamptz;
    v_item record;
    v_balance numeric(14,3);
    v_new_balance numeric(14,3);
    v_new_average numeric(14,4);
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;

    IF p_stage IS NULL OR p_stage NOT IN (
        'Novo lead', 'Qualificação', 'Proposta', 'Negociação', 'Ganho'
    ) THEN
        RAISE EXCEPTION 'Etapa de lead inválida.';
    END IF;

    SELECT stage, archived_at
      INTO v_current_stage, v_archived_at
      FROM public.leads
     WHERE id = p_lead_id
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lead não encontrado.';
    END IF;

    IF v_archived_at IS NOT NULL THEN
        RAISE EXCEPTION
            'Não é permitido alterar a etapa de um lead arquivado. Restaure o lead antes de continuar.';
    END IF;

    IF v_current_stage = p_stage THEN
        RETURN;
    END IF;

    IF v_current_stage = 'Ganho' AND p_stage <> 'Ganho' THEN
        PERFORM p.id
          FROM public.inventory_products AS p
          JOIN public.inventory_movements AS m
            ON m.product_id = p.id
         WHERE m.lead_id = p_lead_id
           AND m.movement_type = 'exit'
           AND m.reason = 'Baixa automática por lead ganho'
           AND NOT EXISTS (
               SELECT 1
                 FROM public.inventory_movements AS r
                WHERE r.reference_movement_id = m.id
           )
         ORDER BY p.id
         FOR UPDATE OF p;

        FOR v_item IN
            SELECT m.id AS movement_id,
                   m.product_id,
                   abs(m.quantity_delta) AS quantity,
                   m.unit_cost,
                   m.total_cost,
                   p.average_cost
              FROM public.inventory_movements AS m
              JOIN public.inventory_products AS p
                ON p.id = m.product_id
             WHERE m.lead_id = p_lead_id
               AND m.movement_type = 'exit'
               AND m.reason = 'Baixa automática por lead ganho'
               AND NOT EXISTS (
                   SELECT 1
                     FROM public.inventory_movements AS r
                    WHERE r.reference_movement_id = m.id
               )
             ORDER BY m.product_id, m.id
        LOOP
            SELECT COALESCE(SUM(quantity_delta), 0)
              INTO v_balance
              FROM public.inventory_movements
             WHERE product_id = v_item.product_id;

            v_new_balance := v_balance + v_item.quantity;

            IF v_new_balance <= 0 THEN
                RAISE EXCEPTION
                    'Não é possível devolver o produto: saldo resultante inválido.';
            END IF;

            v_new_average := CASE
                WHEN v_balance = 0 THEN v_item.unit_cost
                ELSE round(
                    (
                        (v_balance * v_item.average_cost) +
                        (v_item.quantity * v_item.unit_cost)
                    ) / v_new_balance,
                    4
                )
            END;

            UPDATE public.inventory_products
               SET average_cost = v_new_average
             WHERE id = v_item.product_id;

            INSERT INTO public.inventory_movements (
                product_id,
                lead_id,
                movement_type,
                quantity_delta,
                unit_cost,
                total_cost,
                reason,
                reference_movement_id,
                created_by
            )
            VALUES (
                v_item.product_id,
                p_lead_id,
                'reversal_entry',
                v_item.quantity,
                v_item.unit_cost,
                v_item.total_cost,
                'Devolução automática por reabertura do lead',
                v_item.movement_id,
                auth.uid()
            );
        END LOOP;
    END IF;

    IF p_stage = 'Ganho' THEN
        PERFORM p.id
          FROM public.inventory_products AS p
          JOIN public.lead_products AS lp
            ON lp.product_id = p.id
         WHERE lp.lead_id = p_lead_id
         ORDER BY p.id
         FOR UPDATE OF p;

        FOR v_item IN
            SELECT lp.product_id,
                   lp.quantity,
                   p.name,
                   p.is_active
              FROM public.lead_products AS lp
              JOIN public.inventory_products AS p
                ON p.id = lp.product_id
             WHERE lp.lead_id = p_lead_id
             ORDER BY lp.product_id
        LOOP
            IF NOT v_item.is_active THEN
                RAISE EXCEPTION
                    'O produto "%" está inativo e não pode ser baixado.',
                    v_item.name;
            END IF;

            SELECT COALESCE(SUM(quantity_delta), 0)
              INTO v_balance
              FROM public.inventory_movements
             WHERE product_id = v_item.product_id;

            IF v_balance < v_item.quantity THEN
                RAISE EXCEPTION
                    'Estoque insuficiente para "%". Disponível: %, solicitado: %.',
                    v_item.name, v_balance, v_item.quantity;
            END IF;
        END LOOP;

        IF EXISTS (
            SELECT 1
              FROM public.inventory_movements AS m
             WHERE m.lead_id = p_lead_id
               AND m.movement_type = 'exit'
               AND m.reason = 'Baixa automática por lead ganho'
               AND NOT EXISTS (
                   SELECT 1
                     FROM public.inventory_movements AS r
                    WHERE r.reference_movement_id = m.id
               )
        ) THEN
            RAISE EXCEPTION
                'Este lead ainda possui baixas automáticas sem devolução.';
        END IF;

        FOR v_item IN
            SELECT lp.product_id,
                   lp.quantity,
                   p.name,
                   p.average_cost
              FROM public.lead_products AS lp
              JOIN public.inventory_products AS p
                ON p.id = lp.product_id
             WHERE lp.lead_id = p_lead_id
             ORDER BY lp.product_id
        LOOP
            INSERT INTO public.inventory_movements (
                product_id,
                lead_id,
                movement_type,
                quantity_delta,
                unit_cost,
                total_cost,
                reason,
                created_by
            )
            VALUES (
                v_item.product_id,
                p_lead_id,
                'exit',
                -v_item.quantity,
                v_item.average_cost,
                round(v_item.quantity * v_item.average_cost, 4),
                'Baixa automática por lead ganho',
                auth.uid()
            );
        END LOOP;
    END IF;

    UPDATE public.leads
       SET stage = p_stage
     WHERE id = p_lead_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_lead_stage_with_inventory(
    bigint, text
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.set_lead_stage_with_inventory(
    bigint, text
) TO authenticated;

-- 9. save_lead recusa editar lead arquivado com mensagem clara.
CREATE OR REPLACE FUNCTION public.save_lead(
    p_lead_id bigint DEFAULT NULL,
    p_name text DEFAULT NULL,
    p_email text DEFAULT NULL,
    p_phone text DEFAULT NULL,
    p_company text DEFAULT NULL,
    p_stage text DEFAULT 'Novo lead',
    p_setup_value numeric DEFAULT 0,
    p_mrr_value numeric DEFAULT 0,
    p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS public.leads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_lead public.leads%ROWTYPE;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;

    IF p_name IS NULL OR length(btrim(p_name)) = 0 THEN
        RAISE EXCEPTION 'Informe o nome do lead.';
    END IF;

    IF p_setup_value IS NULL OR p_setup_value < 0 THEN
        RAISE EXCEPTION
            'Informe um valor de SETUP válido, igual ou maior que zero.';
    END IF;

    IF p_mrr_value IS NULL OR p_mrr_value < 0 THEN
        RAISE EXCEPTION
            'Informe um valor de MRR válido, igual ou maior que zero.';
    END IF;

    IF p_stage IS NULL OR p_stage NOT IN (
        'Novo lead', 'Qualificação', 'Proposta', 'Negociação', 'Ganho'
    ) THEN
        RAISE EXCEPTION 'Etapa de lead inválida.';
    END IF;

    IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
        RAISE EXCEPTION 'Informe uma lista válida de produtos.';
    END IF;

    IF p_lead_id IS NULL THEN
        INSERT INTO public.leads (
            name,
            email,
            phone,
            company,
            stage,
            setup_value,
            mrr_value
        )
        VALUES (
            btrim(p_name),
            NULLIF(btrim(COALESCE(p_email, '')), ''),
            NULLIF(btrim(COALESCE(p_phone, '')), ''),
            NULLIF(btrim(COALESCE(p_company, '')), ''),
            'Novo lead',
            p_setup_value,
            p_mrr_value
        )
        RETURNING * INTO v_lead;

        PERFORM public.set_lead_products(v_lead.id, p_items);

        IF p_stage <> 'Novo lead' THEN
            PERFORM public.set_lead_stage_with_inventory(v_lead.id, p_stage);
        END IF;
    ELSE
        SELECT *
          INTO v_lead
          FROM public.leads
         WHERE id = p_lead_id
         FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Lead não encontrado.';
        END IF;

        IF v_lead.archived_at IS NOT NULL THEN
            RAISE EXCEPTION
                'Não é permitido editar um lead arquivado. Restaure o lead antes de salvar alterações.';
        END IF;

        UPDATE public.leads
           SET name = btrim(p_name),
               email = NULLIF(btrim(COALESCE(p_email, '')), ''),
               phone = NULLIF(btrim(COALESCE(p_phone, '')), ''),
               company = NULLIF(btrim(COALESCE(p_company, '')), ''),
               setup_value = p_setup_value,
               mrr_value = p_mrr_value
         WHERE id = p_lead_id;

        IF v_lead.stage <> 'Ganho' THEN
            PERFORM public.set_lead_products(p_lead_id, p_items);

            IF v_lead.stage <> p_stage THEN
                PERFORM public.set_lead_stage_with_inventory(p_lead_id, p_stage);
            END IF;
        ELSIF p_stage <> 'Ganho' THEN
            PERFORM public.set_lead_stage_with_inventory(p_lead_id, p_stage);
            PERFORM public.set_lead_products(p_lead_id, p_items);
        ELSE
            IF EXISTS (
                SELECT 1
                  FROM jsonb_array_elements(p_items) AS item(value)
                 WHERE jsonb_typeof(value) <> 'object'
                    OR jsonb_typeof(value->'product_id') <> 'number'
                    OR jsonb_typeof(value->'quantity') <> 'number'
            ) THEN
                RAISE EXCEPTION
                    'Não é permitido alterar os produtos de um lead ganho.';
            END IF;

            IF (
                SELECT count(*) FROM jsonb_array_elements(p_items)
            ) <> (
                SELECT count(*)
                  FROM public.lead_products
                 WHERE lead_id = p_lead_id
            ) OR EXISTS (
                SELECT (value->>'product_id')::bigint AS product_id,
                       round((value->>'quantity')::numeric, 3) AS quantity
                  FROM jsonb_array_elements(p_items) AS item(value)
                EXCEPT
                SELECT lp.product_id, lp.quantity
                  FROM public.lead_products AS lp
                 WHERE lp.lead_id = p_lead_id
            ) THEN
                RAISE EXCEPTION
                    'Não é permitido alterar os produtos de um lead ganho.';
            END IF;
        END IF;
    END IF;

    SELECT *
      INTO v_lead
      FROM public.leads
     WHERE id = COALESCE(p_lead_id, v_lead.id);

    RETURN v_lead;
END;
$$;

REVOKE ALL ON FUNCTION public.save_lead(
    bigint, text, text, text, text, text, numeric, numeric, jsonb
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.save_lead(
    bigint, text, text, text, text, text, numeric, numeric, jsonb
) TO authenticated;

COMMIT;
