import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../../lib/supabase'
import { useFinance } from './useFinance'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}))

describe('useFinance', () => {
  const onError = vi.fn()
  const onNotice = vi.fn()

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

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(supabase.rpc).mockImplementation((fnName: string) => {
      if (fnName === 'finance_client_margins') {
        return Promise.resolve({ data: mockClients, error: null } as any)
      }
      if (fnName === 'finance_totals') {
        return Promise.resolve({ data: mockTotals, error: null } as any)
      }
      return Promise.resolve({ data: null, error: null } as any)
    })

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'finance_suppliers') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi
              .fn()
              .mockResolvedValue({ data: mockSuppliers, error: null }),
            ilike: vi.fn().mockReturnValue({
              maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: mockSuppliers[0], error: null }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 20, name: 'Google Cloud' },
                error: null,
              }),
            }),
          }),
        } as any
      }

      if (table === 'lead_costs') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi
              .fn()
              .mockResolvedValue({ data: mockCosts, error: null }),
          }),
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        } as any
      }

      return {} as any
    })
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

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.clients).toHaveLength(1)
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
    vi.mocked(supabase.rpc).mockImplementation((fnName: string) => {
      if (fnName === 'finance_client_margins') {
        return Promise.resolve({
          data: null,
          error: { message: 'Acesso restrito a administradores.' },
        } as any)
      }
      return Promise.resolve({ data: null, error: null } as any)
    })

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
