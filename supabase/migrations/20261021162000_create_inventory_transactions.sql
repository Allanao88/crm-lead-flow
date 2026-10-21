BEGIN;

-- A escrita no livro-razão só poderá ocorrer pelas funções controladas.
REVOKE INSERT, UPDATE, DELETE
    ON public.inventory_movements
    FROM PUBLIC, anon, authenticated;

-- Registra entradas e saídas manuais com bloqueio do produto.
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
    v_average_cost numeric(14,4);
    v_balance numeric(14,3);
    v_new_average numeric(14,4);
    v_unit_cost numeric(14,4);
    v_movement_id bigint;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
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

    SELECT average_cost
      INTO v_average_cost
      FROM public.inventory_products
     WHERE id = p_product_id
       AND is_active = true
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Produto não encontrado ou inativo.';
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
           SET average_cost = v_new_average,
               updated_at = now()
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

-- Estorna uma entrada ou saída original, no máximo uma vez.
CREATE OR REPLACE FUNCTION public.inventory_reverse_movement(
    p_movement_id bigint,
    p_reason text
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_original public.inventory_movements%ROWTYPE;
    v_average_cost numeric(14,4);
    v_balance numeric(14,3);
    v_new_balance numeric(14,3);
    v_new_average numeric(14,4);
    v_reverse_type text;
    v_delta numeric(14,3);
    v_movement_id bigint;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;

    IF NULLIF(btrim(p_reason), '') IS NULL THEN
        RAISE EXCEPTION 'Informe o motivo do estorno.';
    END IF;

    SELECT *
      INTO v_original
      FROM public.inventory_movements
     WHERE id = p_movement_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Movimentação original não encontrada.';
    END IF;

    IF v_original.movement_type NOT IN ('entry', 'exit') THEN
        RAISE EXCEPTION 'Somente movimentações originais podem ser estornadas.';
    END IF;

    -- A mesma linha de produto serializa estornos e demais movimentações.
    SELECT average_cost
      INTO v_average_cost
      FROM public.inventory_products
     WHERE id = v_original.product_id
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Produto não encontrado.';
    END IF;

    -- Revalida a existência do estorno depois de obter o bloqueio.
    IF EXISTS (
        SELECT 1
          FROM public.inventory_movements
         WHERE reference_movement_id = p_movement_id
    ) THEN
        RAISE EXCEPTION 'Esta movimentação já foi estornada.';
    END IF;

    SELECT COALESCE(SUM(quantity_delta), 0)
      INTO v_balance
      FROM public.inventory_movements
     WHERE product_id = v_original.product_id;

    v_delta := -v_original.quantity_delta;

    IF v_original.movement_type = 'entry' THEN
        v_reverse_type := 'reversal_exit';
        v_new_balance := v_balance + v_delta;

        IF v_new_balance < 0 THEN
            RAISE EXCEPTION
                'Não é possível estornar a entrada: o estoque atual não comporta o estorno.';
        END IF;

        IF v_new_balance = 0 THEN
            v_new_average := 0;
        ELSE
            v_new_average := round(
                ((v_balance * v_average_cost) -
                 (v_original.quantity_delta * v_original.unit_cost)) /
                v_new_balance,
                4
            );

            IF v_new_average < 0 THEN
                RAISE EXCEPTION
                    'Estorno incompatível com o custo médio atual. Revise as movimentações posteriores.';
            END IF;
        END IF;

        UPDATE public.inventory_products
           SET average_cost = v_new_average,
               updated_at = now()
         WHERE id = v_original.product_id;
    ELSE
        v_reverse_type := 'reversal_entry';

        v_new_average := CASE
            WHEN v_balance = 0 THEN v_original.unit_cost
            ELSE round(
                ((v_balance * v_average_cost) +
                 (abs(v_delta) * v_original.unit_cost)) /
                (v_balance + abs(v_delta)),
                4
            )
        END;

        UPDATE public.inventory_products
           SET average_cost = v_new_average,
               updated_at = now()
         WHERE id = v_original.product_id;
    END IF;

    INSERT INTO public.inventory_movements (
        product_id, lead_id, movement_type, quantity_delta,
        unit_cost, total_cost, reason, reference_movement_id, created_by
    )
    VALUES (
        v_original.product_id, v_original.lead_id, v_reverse_type, v_delta,
        v_original.unit_cost, v_original.total_cost, btrim(p_reason),
        v_original.id, auth.uid()
    )
    RETURNING id INTO v_movement_id;

    RETURN v_movement_id;
END;
$$;

-- Atualiza etapa e baixa os produtos do lead na mesma transação.
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
    v_item record;
    v_balance numeric(14,3);
    v_average_cost numeric(14,4);
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;

    IF p_stage NOT IN (
        'Novo lead', 'Qualificação', 'Proposta', 'Negociação', 'Ganho'
    ) THEN
        RAISE EXCEPTION 'Etapa de lead inválida.';
    END IF;

    SELECT stage
      INTO v_current_stage
      FROM public.leads
     WHERE id = p_lead_id
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lead não encontrado.';
    END IF;

    IF v_current_stage = p_stage THEN
        RETURN;
    END IF;

    IF p_stage = 'Ganho' THEN
        -- Um lead reaberto não pode gerar uma segunda baixa automática.
        IF EXISTS (
            SELECT 1
              FROM public.inventory_movements
             WHERE lead_id = p_lead_id
               AND movement_type = 'exit'
        ) THEN
            RAISE EXCEPTION
                'Este lead já possui baixas de estoque. Revise as movimentações antes de marcá-lo como ganho novamente.';
        END IF;

        -- Bloqueia todos os produtos em ordem determinística para reduzir deadlocks.
        PERFORM p.id
          FROM public.inventory_products AS p
          JOIN public.lead_products AS lp ON lp.product_id = p.id
         WHERE lp.lead_id = p_lead_id
         ORDER BY p.id
         FOR UPDATE OF p;

        -- Valida todos os saldos antes de registrar qualquer saída.
        FOR v_item IN
            SELECT lp.product_id, lp.quantity, p.name
              FROM public.lead_products AS lp
              JOIN public.inventory_products AS p ON p.id = lp.product_id
             WHERE lp.lead_id = p_lead_id
             ORDER BY lp.product_id
        LOOP
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

        -- A inserção de todas as saídas é revertida se qualquer etapa falhar.
        FOR v_item IN
            SELECT lp.product_id, lp.quantity, p.name, p.average_cost
              FROM public.lead_products AS lp
              JOIN public.inventory_products AS p ON p.id = lp.product_id
             WHERE lp.lead_id = p_lead_id
             ORDER BY lp.product_id
        LOOP
            v_average_cost := v_item.average_cost;

            INSERT INTO public.inventory_movements (
                product_id, lead_id, movement_type, quantity_delta,
                unit_cost, total_cost, reason, created_by
            )
            VALUES (
                v_item.product_id, p_lead_id, 'exit', -v_item.quantity,
                v_average_cost,
                round(v_item.quantity * v_average_cost, 4),
                'Baixa automática por lead ganho',
                auth.uid()
            );
        END LOOP;
    END IF;

    UPDATE public.leads
       SET stage = p_stage,
           updated_at = now()
     WHERE id = p_lead_id;
END;
$$;

-- Impede alterações diretas de etapa pelo cliente.
-- A função SECURITY DEFINER continua podendo atualizar a etapa.
REVOKE UPDATE ON public.leads FROM PUBLIC, anon, authenticated;
GRANT UPDATE (
    name, email, phone, company, value, setup_value, mrr_value, updated_at
) ON public.leads TO authenticated;

-- O custo médio só pode ser alterado pelas funções de movimentação.
REVOKE UPDATE ON public.inventory_products FROM PUBLIC, anon, authenticated;
GRANT UPDATE (
    name, sku, description, unit, is_active, updated_at
) ON public.inventory_products TO authenticated;

-- Bloqueia a criação direta de leads já ganhos.
CREATE OR REPLACE FUNCTION public.prevent_direct_won_lead_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.stage = 'Ganho' THEN
        RAISE EXCEPTION
            'Crie o lead em uma etapa inicial e use a função de mudança de etapa.';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_direct_won_lead_insert
BEFORE INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.prevent_direct_won_lead_insert();

REVOKE ALL ON FUNCTION public.prevent_direct_won_lead_insert()
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.inventory_register_movement(
    bigint, numeric, text, numeric, text
) FROM PUBLIC, anon;

REVOKE ALL ON FUNCTION public.inventory_reverse_movement(
    bigint, text
) FROM PUBLIC, anon;

REVOKE ALL ON FUNCTION public.set_lead_stage_with_inventory(
    bigint, text
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.inventory_register_movement(
    bigint, numeric, text, numeric, text
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.inventory_reverse_movement(
    bigint, text
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.set_lead_stage_with_inventory(
    bigint, text
) TO authenticated;

COMMIT;
