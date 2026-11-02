import { describe, expect, it } from 'vitest'
import { emptyForm } from './constants'
import { parseBrazilianNumber, validateLeadForm } from './leadValidation'

describe('parseBrazilianNumber', () => {
  it('converte formato brasileiro com milhar e centavos ("1.234,56")', () => {
    expect(parseBrazilianNumber('1.234,56')).toBe(1234.56)
  })

  it('converte decimal simples com vírgula ("1234,5")', () => {
    expect(parseBrazilianNumber('1234,5')).toBe(1234.5)
  })

  it('retorna NaN para entradas alfabéticas ou malformadas ("abc")', () => {
    expect(Number.isNaN(parseBrazilianNumber('abc'))).toBe(true)
    expect(Number.isNaN(parseBrazilianNumber(''))).toBe(true)
    expect(Number.isNaN(parseBrazilianNumber('12,34,56'))).toBe(true)
  })

  it('converte números negativos preservando o sinal', () => {
    expect(parseBrazilianNumber('-10')).toBe(-10)
    expect(parseBrazilianNumber('-1.234,56')).toBe(-1234.56)
  })
})

describe('validateLeadForm', () => {
  it('aceita valores válidos nos formatos "1.234,56" e "1234,5"', () => {
    const result = validateLeadForm(
      {
        ...emptyForm,
        name: 'Maria Silva',
        setup_value: '1.234,56',
        mrr_value: '1234,5',
      },
      [{ product_id: 1, quantity: '2,5' }],
    )

    expect(result).toEqual({
      valid: true,
      setupValue: 1234.56,
      mrrValue: 1234.5,
      products: [{ product_id: 1, quantity: 2.5 }],
    })
  })

  it('rejeita texto inválido ("abc") em SETUP e MRR', () => {
    const invalidSetup = validateLeadForm(
      {
        ...emptyForm,
        name: 'Maria Silva',
        setup_value: 'abc',
        mrr_value: '100',
      },
      [],
    )
    expect(invalidSetup).toEqual({
      valid: false,
      error: 'Informe um valor de SETUP válido, igual ou maior que zero.',
    })

    const invalidMrr = validateLeadForm(
      {
        ...emptyForm,
        name: 'Maria Silva',
        setup_value: '100',
        mrr_value: 'abc',
      },
      [],
    )
    expect(invalidMrr).toEqual({
      valid: false,
      error: 'Informe um valor de MRR válido, igual ou maior que zero.',
    })
  })

  it('rejeita valores negativos em SETUP, MRR e quantidade de produtos', () => {
    const negativeSetup = validateLeadForm(
      {
        ...emptyForm,
        name: 'Maria Silva',
        setup_value: '-1.234,56',
        mrr_value: '0',
      },
      [],
    )
    expect(negativeSetup).toEqual({
      valid: false,
      error: 'Informe um valor de SETUP válido, igual ou maior que zero.',
    })

    const negativeMrr = validateLeadForm(
      {
        ...emptyForm,
        name: 'Maria Silva',
        setup_value: '0',
        mrr_value: '-50,5',
      },
      [],
    )
    expect(negativeMrr).toEqual({
      valid: false,
      error: 'Informe um valor de MRR válido, igual ou maior que zero.',
    })

    const negativeQuantity = validateLeadForm(
      {
        ...emptyForm,
        name: 'Maria Silva',
        setup_value: '100',
        mrr_value: '50',
      },
      [{ product_id: 1, quantity: '-2' }],
    )
    expect(negativeQuantity).toEqual({
      valid: false,
      error: 'Informe quantidades positivas com até três casas decimais.',
    })
  })
})
