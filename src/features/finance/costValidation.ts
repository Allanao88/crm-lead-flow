export type ValidatedCostData = {
  supplierName: string
  amountMonthly: number
  note: string | null
}

export type CostValidationResult =
  | {
      isValid: true
      data: ValidatedCostData
    }
  | {
      isValid: false
      error: string
      fieldErrors: {
        supplierName?: string
        amount?: string
        note?: string
      }
    }

export function parseCostAmount(raw: string | number): {
  value?: number
  error?: string
} {
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) {
      return { error: 'Informe um valor numérico válido.' }
    }
    if (raw <= 0) {
      return { error: 'O valor deve ser maior que zero.' }
    }
    const fixed = Number(raw.toFixed(2))
    const diff = Math.abs(raw - fixed)
    if (diff > 0.00001) {
      return { error: 'O valor pode ter no máximo 2 casas decimais.' }
    }
    return { value: fixed }
  }

  const trimmed = String(raw ?? '').trim()
  if (!trimmed) {
    return { error: 'O valor é obrigatório.' }
  }

  if (trimmed.startsWith('-')) {
    return { error: 'O valor deve ser maior que zero.' }
  }

  // Comma as decimal separator: e.g. "1234,56" or "1.234,56"
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',')
    if (parts.length !== 2) {
      return { error: 'Informe um valor numérico válido.' }
    }

    const [integerPart, decimalPart] = parts
    if (!/^\d+(\.\d{3})*$/.test(integerPart) && !/^\d+$/.test(integerPart)) {
      return { error: 'Informe um valor numérico válido.' }
    }

    if (!/^\d+$/.test(decimalPart)) {
      return { error: 'Informe um valor numérico válido.' }
    }

    if (decimalPart.length > 2) {
      return { error: 'O valor pode ter no máximo 2 casas decimais.' }
    }

    const normalized = `${integerPart.replace(/\./g, '')}.${decimalPart}`
    const num = Number(normalized)
    if (!Number.isFinite(num)) {
      return { error: 'Informe um valor numérico válido.' }
    }
    if (num <= 0) {
      return { error: 'O valor deve ser maior que zero.' }
    }
    return { value: num }
  }

  // Multiple dots without comma (thousands separator only): e.g. "1.234.567"
  if (/^\d{1,3}(\.\d{3}){2,}$/.test(trimmed)) {
    const num = Number(trimmed.replace(/\./g, ''))
    if (num <= 0) {
      return { error: 'O valor deve ser maior que zero.' }
    }
    return { value: num }
  }

  // Single dot: e.g. "1234.56" or integer "1234"
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const parts = trimmed.split('.')
    if (parts.length === 2 && parts[1].length > 2) {
      return { error: 'O valor pode ter no máximo 2 casas decimais.' }
    }
    const num = Number(trimmed)
    if (!Number.isFinite(num)) {
      return { error: 'Informe um valor numérico válido.' }
    }
    if (num <= 0) {
      return { error: 'O valor deve ser maior que zero.' }
    }
    return { value: num }
  }

  return { error: 'Informe um valor numérico válido.' }
}

export function validateCostForm(input: {
  supplierName: string
  amount: string | number
  note?: string | null
}): CostValidationResult {
  const supplierTrimmed = (input.supplierName ?? '').trim()
  const noteTrimmed = (input.note ?? '').trim()

  const fieldErrors: {
    supplierName?: string
    amount?: string
    note?: string
  } = {}

  if (!supplierTrimmed) {
    fieldErrors.supplierName = 'O fornecedor é obrigatório.'
  } else if (supplierTrimmed.length > 100) {
    fieldErrors.supplierName = 'O nome do fornecedor deve ter no máximo 100 caracteres.'
  }

  const amountParsed = parseCostAmount(input.amount)
  if (amountParsed.error || amountParsed.value === undefined) {
    fieldErrors.amount = amountParsed.error || 'O valor é obrigatório.'
  }

  if (noteTrimmed.length > 200) {
    fieldErrors.note = 'A observação deve ter no máximo 200 caracteres.'
  }

  if (Object.keys(fieldErrors).length > 0) {
    const firstErrorMessage =
      fieldErrors.supplierName || fieldErrors.amount || fieldErrors.note || 'Dados inválidos.'
    return {
      isValid: false,
      error: firstErrorMessage,
      fieldErrors,
    }
  }

  return {
    isValid: true,
    data: {
      supplierName: supplierTrimmed,
      amountMonthly: amountParsed.value!,
      note: noteTrimmed || null,
    },
  }
}
