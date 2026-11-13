import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useFinance } from './useFinance'

const {
  mockRpc,
  mockFrom,
  setRpcError,
} = vi.hoisted(() => {
  let rpcErrorMessage: string | null = null

  const mockClients = [
    {
      lead_id: 1,
      lead_name: 'Cliente Alpha',
      company: 'Alpha Corp',
      mrr_value: 2000,
      total_costs: 500,
      net_margin: 1500,
      cost_percent: 25,
      cost_count: 1,
    },
  ]

  const mockTotals = [
    {
      total_mrr: 2000,
      total_costs: 500,
      total_margin: 1500,
      cost_percent: 25,
      clients_count: 1,
      clients_without_costs: 0,
    },
  ]

  const mockSuppliers = [{ id: 10, name: 'AWS' }]

  const mockCosts = [
    {
      id: 100,
      lead_id: 1,
      supplier_id: 10,
      amount_monthly: 500,
      note: 'Servidor',
      created_at: '2026-11-01',
      updated_at: '2026-11-01',
      supplier: { id: 10, name: 'AWS' },
    },
  ]

  const rpc = vi.fn(async (fnName: string) => {
    if (rpcErrorMessage) {
      return { data: null, error: { message: rpcErrorMessage } }
    }
    if (fnName === 'finance_client_margins') {
      return { data: mockClients, error: null }
    }
    if (fnName === 'finance_totals') {
      return { data: mockTotals, error: null }
    }
    return { data: null, error: null }
  })

  const from = vi.fn((table: string) => {
    if (table === 'finance_suppliers') {
      return {
        select: vi.fn(() => ({
          order: vi.fn(async () => ({ data: mockSuppliers, error: null })),
          ilike: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: mockSuppliers[0], error: null })),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: { id: 20, name: 'Google Cloud' },
              error: null,
            })),
          })),
        })),
      }
    }

    if (table === 'lead_costs') {
      return {
        select: vi.fn(() => ({
          order: vi.fn(async () => ({ data: mockCosts, error: null })),
        })),
        insert: vi.fn(async () => ({ data: null, error: null })),
        update: vi.fn(() => ({
          eq: vi.fn(async () => ({ data: null, error: null })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(async () => ({ data: null, error: null })),
        })),
      }
    }

    throw new Error(`Unexpected table: ${table}`)
  })

  return {
    mockRpc: rpc,
    mockFrom: from,
    setRpcError: (msg: string | null) => {
      rpcErrorMessage = msg
    },
  }
})

vi.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: mockRpc,
    from: mockFrom,
  },
}))

describe('useFinance', () => {
  const onError = vi.fn()
  const onNotice = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    setRpcError(null)
  })

  it('resets state when userId is null', () => {
    const { result } = renderHook(() => useFinance(null, onError, onNotice))

    expect(result.current.clients).toEqual([])
    expect(result.current.totals).toBeNull()
    expect(result.current.suppliers).toEqual([])
    expect(result.current.costs).toEqual([])
    expect(result.current.loading).toBe(false)
  })

  it('loads client margins, totals, suppliers and costs for authenticated user', async () => {
    const { result } = renderHook(() =>
      useFinance('user-1', onError, onNotice),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.clients).toHaveLength(1)
    })

    expect(result.current.clients[0].lead_name).toBe('Cliente Alpha')
    expect(result.current.totals).toEqual({
      total_mrr: 2000,
      total_costs: 500,
      total_margin: 1500,
      cost_percent: 25,
      clients_count: 1,
      clients_without_costs: 0,
    })
    expect(result.current.suppliers).toHaveLength(1)
    expect(result.current.costs).toHaveLength(1)
    expect(onError).not.toHaveBeenCalled()
  })

  it('displays error in pt-BR when load fails due to admin restriction', async () => {
    setRpcError('Acesso restrito a administradores.')

    const { result } = renderHook(() =>
      useFinance('user-non-admin', onError, onNotice),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(onError).toHaveBeenCalledWith('Acesso restrito a administradores.')
  })

  it('adds cost using an existing supplier', async () => {
    const { result } = renderHook(() =>
      useFinance('user-1', onError, onNotice),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const success = await result.current.addCost(1, {
      supplierName: 'AWS',
      amountMonthly: 120,
      note: 'Storage extra',
    })

    expect(success).toBe(true)
    expect(onNotice).toHaveBeenCalledWith('Custo adicionado com sucesso.')
  })

  it('adds cost creating a new supplier if not found', async () => {
    const { result } = renderHook(() =>
      useFinance('user-1', onError, onNotice),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const success = await result.current.addCost(1, {
      supplierName: 'Google Cloud',
      amountMonthly: 80,
      note: 'BigQuery',
    })

    expect(success).toBe(true)
    expect(onNotice).toHaveBeenCalledWith('Custo adicionado com sucesso.')
  })

  it('updates an existing cost', async () => {
    const { result } = renderHook(() =>
      useFinance('user-1', onError, onNotice),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const success = await result.current.updateCost(100, {
      supplierName: 'AWS',
      amountMonthly: 550,
      note: 'Ajuste de plano',
    })

    expect(success).toBe(true)
    expect(onNotice).toHaveBeenCalledWith('Custo atualizado com sucesso.')
  })

  it('deletes an existing cost', async () => {
    const { result } = renderHook(() =>
      useFinance('user-1', onError, onNotice),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const success = await result.current.deleteCost(100)

    expect(success).toBe(true)
    expect(onNotice).toHaveBeenCalledWith('Custo excluído com sucesso.')
  })
})
