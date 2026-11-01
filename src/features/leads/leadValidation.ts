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

export function parseBrazilianNumber(raw: string): number {
  const trimmed = raw.trim()
  if (!trimmed) return Number.NaN

  if (trimmed.includes(',')) {
    const validWithThousands = /^[+-]?\d{1,3}(\.\d{3})+,\d+$/.test(trimmed)
    const validSimpleComma = /^[+-]?\d+,\d+$/.test(trimmed)

    if (!validWithThousands && !validSimpleComma) {
      return Number.NaN
    }

    return Number(trimmed.replace(/\./g, '').replace(',', '.'))
  }

  if (/^[+-]?\d{1,3}(\.\d{3}){2,}$/.test(trimmed)) {
    return Number(trimmed.replace(/\./g, ''))
  }

  if (!/^[+-]?\d+(\.\d+)?$/.test(trimmed)) {
    return Number.NaN
  }

  return Number(trimmed)
}

export function validateLeadForm(
  form: LeadForm,
  productItems: LeadProductItem[],
): LeadValidationResult {
  const setupValue = parseBrazilianNumber(form.setup_value)
  const mrrValue = parseBrazilianNumber(form.mrr_value)

  if (!form.name.trim()) {
    return { valid: false, error: 'Informe o nome do lead.' }
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
    const quantity = parseBrazilianNumber(item.quantity)

    if (
      !Number.isInteger(item.product_id) ||
      item.product_id <= 0 ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      Math.abs(Math.round(quantity * 1000) - quantity * 1000) > 1e-6
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
    products.push({
      product_id: item.product_id,
      quantity: Math.round(quantity * 1000) / 1000,
    })
  }

  return {
    valid: true,
    setupValue,
    mrrValue,
    products,
  }
}
