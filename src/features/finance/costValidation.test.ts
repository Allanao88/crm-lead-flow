import { describe, expect, it } from 'vitest'
import { parseCostAmount, validateCostForm } from './costValidation'

describe('parseCostAmount', () => {
  it('accepts integer and decimal with comma', () => {
    expect(parseCostAmount('1234,56')).toEqual({ value: 1234.56 })
    expect(parseCostAmount('1.234,56')).toEqual({ value: 1234.56 })
    expect(parseCostAmount('1234,5')).toEqual({ value: 1234.5 })
    expect(parseCostAmount('100')).toEqual({ value: 100 })
  })

  it('accepts dot format as decimal', () => {
    expect(parseCostAmount('1234.56')).toEqual({ value: 1234.56 })
    expect(parseCostAmount('50.5')).toEqual({ value: 50.5 })
  })

  it('accepts number values', () => {
    expect(parseCostAmount(450.75)).toEqual({ value: 450.75 })
    expect(parseCostAmount(100)).toEqual({ value: 100 })
  })

  it('rejects values with more than 2 decimal places', () => {
    expect(parseCostAmount('10,555')).toEqual({
      error: 'O valor pode ter no máximo 2 casas decimais.',
    })
    expect(parseCostAmount('10.555')).toEqual({
      error: 'O valor pode ter no máximo 2 casas decimais.',
    })
    expect(parseCostAmount(10.555)).toEqual({
      error: 'O valor pode ter no máximo 2 casas decimais.',
    })
  })

  it('rejects zero or negative values', () => {
    expect(parseCostAmount('0')).toEqual({
      error: 'O valor deve ser maior que zero.',
    })
    expect(parseCostAmount('0,00')).toEqual({
      error: 'O valor deve ser maior que zero.',
    })
    expect(parseCostAmount('-50')).toEqual({
      error: 'O valor deve ser maior que zero.',
    })
    expect(parseCostAmount(-10)).toEqual({
      error: 'O valor deve ser maior que zero.',
    })
  })

  it('rejects empty and invalid text', () => {
    expect(parseCostAmount('')).toEqual({
      error: 'O valor é obrigatório.',
    })
    expect(parseCostAmount('   ')).toEqual({
      error: 'O valor é obrigatório.',
    })
    expect(parseCostAmount('abc')).toEqual({
      error: 'Informe um valor numérico válido.',
    })
    expect(parseCostAmount('12,34,56')).toEqual({
      error: 'Informe um valor numérico válido.',
    })
  })
})

describe('validateCostForm', () => {
  it('validates correct cost input', () => {
    const result = validateCostForm({
      supplierName: '  Supabase  ',
      amount: ' 150,00 ',
      note: '  Banco de dados  ',
    })

    expect(result.isValid).toBe(true)
    if (result.isValid) {
      expect(result.data).toEqual({
        supplierName: 'Supabase',
        amountMonthly: 150,
        note: 'Banco de dados',
      })
    }
  })

  it('sets note to null when empty', () => {
    const result = validateCostForm({
      supplierName: 'Vercel',
      amount: '20.00',
      note: '   ',
    })

    expect(result.isValid).toBe(true)
    if (result.isValid) {
      expect(result.data.note).toBeNull()
    }
  })

  it('rejects missing or whitespace supplier', () => {
    const result = validateCostForm({
      supplierName: '   ',
      amount: '100',
    })

    expect(result.isValid).toBe(false)
    if (!result.isValid) {
      expect(result.fieldErrors.supplierName).toBe('O fornecedor é obrigatório.')
    }
  })

  it('rejects supplier longer than 100 characters', () => {
    const result = validateCostForm({
      supplierName: 'a'.repeat(101),
      amount: '100',
    })

    expect(result.isValid).toBe(false)
    if (!result.isValid) {
      expect(result.fieldErrors.supplierName).toBe(
        'O nome do fornecedor deve ter no máximo 100 caracteres.',
      )
    }
  })

  it('rejects note longer than 200 characters', () => {
    const result = validateCostForm({
      supplierName: 'AWS',
      amount: '100',
      note: 'x'.repeat(201),
    })

    expect(result.isValid).toBe(false)
    if (!result.isValid) {
      expect(result.fieldErrors.note).toBe(
        'A observação deve ter no máximo 200 caracteres.',
      )
    }
  })
})
