BEGIN;

-- Atualiza os produtos vinculados a um lead de forma atômica.
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
    v_item jsonb;
    v_product_id bigint;
    v_quantity numeric;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;

    IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
        RAISE EXCEPTION 'Informe uma lista válida de produtos.';
    END IF;

    -- Serializa alterações dos itens com mudanças de etapa do lead.
    SELECT stage
      INTO v_stage
      FROM public.leads
     WHERE id = p_lead_id
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lead não encontrado.';
    END IF;

    IF v_stage = 'Ganho' THEN
        RAISE EXCEPTION 'Não é permitido alterar os produtos de um lead ganho.';
    END IF;

    -- Valida todos os itens antes de alterar os vínculos existentes.
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

        IF NOT EXISTS (
            SELECT 1
              FROM public.inventory_products
             WHERE id = v_product_id
               AND is_active = true
        ) THEN
            RAISE EXCEPTION 'Produto inexistente ou inativo: %.', v_product_id;
        END IF;
    END LOOP;

    -- Não aceita o mesmo produto mais de uma vez na lista.
    IF EXISTS (
        SELECT 1
          FROM jsonb_array_elements(p_items) AS item(value)
         GROUP BY (value->>'product_id')::bigint
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Cada produto deve aparecer apenas uma vez.';
    END IF;

    -- A transação reverte a exclusão caso alguma inserção falhe.
    DELETE FROM public.lead_products
     WHERE lead_id = p_lead_id;

    FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.lead_products (
            lead_id, product_id, quantity
        )
        VALUES (
            p_lead_id,
            (v_item->>'product_id')::bigint,
            (v_item->>'quantity')::numeric
        );
    END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.set_lead_products(bigint, jsonb)
    FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.set_lead_products(bigint, jsonb)
    TO authenticated;

COMMIT;
