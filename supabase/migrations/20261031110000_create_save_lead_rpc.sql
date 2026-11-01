BEGIN;

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

        UPDATE public.leads
           SET name = btrim(p_name),
               email = NULLIF(btrim(COALESCE(p_email, '')), ''),
               phone = NULLIF(btrim(COALESCE(p_phone, '')), ''),
               company = NULLIF(btrim(COALESCE(p_company, '')), ''),
               setup_value = p_setup_value,
               mrr_value = p_mrr_value,
               updated_at = now()
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
