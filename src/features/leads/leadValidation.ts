import type { LeadForm } from './types'
import type { LeadProductItem } from './useLeadProducts'

export type NormalizedLeadProduct = {
  product_id: number
  quantity: number
}

export type LeadValidationResult =
  | {
      valid: true
      setupValue: number
      mrrValue: number
      products: NormalizedLeadProduct[]
    }
  | {
      valid: false
      error: string
    }

export function validateLeadForm(
  form: LeadForm,
  productItems: LeadProductItem[],
): LeadValidationResult {
  const setupValue = Number(form.setup_value.replace(',', '.'))
  const mrrValue = Number(form.mrr_value.replace(',', '.'))

  if (!form.name.trim()) {
    return { valid: false, error: 'Informe o nome do contato.' }
  }

  if (
    !form.setup_value.trim() ||
    !Number.isFinite(setupValue) ||
    setupValue < 0
  ) {
    return {
      valid: false,
      error: 'Informe um valor de SETUP válido, igual ou maior que zero.',
    }
  }

  if (
    !form.mrr_value.trim() ||
    !Number.isFinite(mrrValue) ||
    mrrValue < 0
  ) {
    return {
      valid: false,
      error: 'Informe um valor de MRR válido, igual ou maior que zero.',
    }
  }

  const products: NormalizedLeadProduct[] = []
  const seenProductIds = new Set<number>()

  for (const item of productItems) {
    const quantity = Number(item.quantity.replace(',', '.'))

    if (
      !Number.isInteger(item.product_id) ||
      item.product_id <= 0 ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      Math.round(quantity * 1000) !== quantity * 1000
    ) {
      return {
        valid: false,
        error: 'Informe quantidades positivas com até três casas decimais.',
      }
    }

    if (seenProductIds.has(item.product_id)) {
      return {
        valid: false,
        error: 'Há um produto duplicado na seleção.',
      }
    }

    seenProductIds.add(item.product_id)
    products.push({ product_id: item.product_id, quantity })
  }

  return {
    valid: true,
    setupValue,
    mrrValue,
    products,
  }
}
