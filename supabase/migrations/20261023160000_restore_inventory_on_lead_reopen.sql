BEGIN;

-- Permite novos ciclos de ganho após a devolução dos itens.
-- A função abaixo serializa as mudanças de etapa por lead.
DROP INDEX IF EXISTS public.inventory_movements_one_lead_exit_idx;

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

    -- Ao sair de Ganho, devolve somente as baixas automáticas
    -- que ainda não tenham sido estornadas.
    IF v_current_stage = 'Ganho' AND p_stage <> 'Ganho' THEN

        -- Bloqueia os produtos em ordem determinística.
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
               SET average_cost = v_new_average,
                   updated_at = now()
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
        -- Bloqueia produtos vinculados em ordem determinística.
        PERFORM p.id
          FROM public.inventory_products AS p
          JOIN public.lead_products AS lp
            ON lp.product_id = p.id
         WHERE lp.lead_id = p_lead_id
         ORDER BY p.id
         FOR UPDATE OF p;

        -- Valida os saldos e o estado dos produtos antes das baixas.
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

        -- Não permite uma segunda baixa enquanto houver uma saída
        -- automática anterior ainda sem devolução.
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
       SET stage = p_stage,
           updated_at = now()
     WHERE id = p_lead_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_lead_stage_with_inventory(
    bigint, text
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.set_lead_stage_with_inventory(
    bigint, text
) TO authenticated;

COMMIT;
