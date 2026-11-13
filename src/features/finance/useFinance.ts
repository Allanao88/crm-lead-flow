import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type {
  FinanceClientMargin,
  FinanceSupplier,
  FinanceTotals,
  LeadCost,
} from './types'

export function getFinanceErrorMessage(error: unknown, fallback: string): string {
  if (!error) return fallback
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error)

  if (
    message.includes('Acesso restrito a administradores') ||
    message.includes('permission denied') ||
    message.includes('violates row-level security') ||
    message.includes('PGRST301')
  ) {
    return 'Acesso restrito a administradores.'
  }

  if (
    message.includes('violates foreign key constraint') ||
    message.includes('foreign key')
  ) {
    return 'Lead ou fornecedor inválido para o custo.'
  }

  return message || fallback
}

export function useFinance(
  userId: string | null,
  onError: (message: string) => void,
  onNotice: (message: string) => void,
) {
  const [financeState, setFinanceState] = useState<{
    userId: string | null
    clients: FinanceClientMargin[]
    totals: FinanceTotals | null
    suppliers: FinanceSupplier[]
    costs: LeadCost[]
  }>({
    userId: null,
    clients: [],
    totals: null,
    suppliers: [],
    costs: [],
  })

  const clients = financeState.userId === userId ? financeState.clients : []
  const totals = financeState.userId === userId ? financeState.totals : null
  const suppliers = financeState.userId === userId ? financeState.suppliers : []
  const costs = financeState.userId === userId ? financeState.costs : []

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const requestId = useRef(0)

  const loadFinance = useCallback(async () => {
    if (!userId) {
      setFinanceState({
        userId: null,
        clients: [],
        totals: null,
        suppliers: [],
        costs: [],
      })
      return
    }

    const currentRequestId = ++requestId.current
    setLoading(true)

    try {
      const [marginsRes, totalsRes, suppliersRes, costsRes] = await Promise.all([
        supabase.rpc('finance_client_margins'),
        supabase.rpc('finance_totals'),
        supabase
          .from('finance_suppliers')
          .select('id, name')
          .order('name', { ascending: true }),
        supabase
          .from('lead_costs')
          .select(
            'id, lead_id, supplier_id, amount_monthly, note, created_at, updated_at, supplier:finance_suppliers(id, name)',
          )
          .order('created_at', { ascending: true }),
      ])

      if (currentRequestId !== requestId.current) return

      if (marginsRes.error) throw marginsRes.error
      if (totalsRes.error) throw totalsRes.error
      if (suppliersRes.error) throw suppliersRes.error
      if (costsRes.error) throw costsRes.error

      const rawTotals = Array.isArray(totalsRes.data)
        ? totalsRes.data[0]
        : totalsRes.data

      const parsedTotals: FinanceTotals | null = rawTotals
        ? {
            total_mrr: Number(rawTotals.total_mrr) || 0,
            total_costs: Number(rawTotals.total_costs) || 0,
            total_margin: Number(rawTotals.total_margin) || 0,
            cost_percent:
              rawTotals.cost_percent !== null &&
              rawTotals.cost_percent !== undefined
                ? Number(rawTotals.cost_percent)
                : null,
            clients_count: Number(rawTotals.clients_count) || 0,
            clients_without_costs: Number(rawTotals.clients_without_costs) || 0,
          }
        : null

      const parsedClients: FinanceClientMargin[] = (
        (marginsRes.data as Record<string, unknown>[]) ?? []
      ).map((row) => ({
        lead_id: Number(row.lead_id),
        lead_name: String(row.lead_name ?? ''),
        company: row.company ? String(row.company) : null,
        mrr_value: Number(row.mrr_value) || 0,
        total_costs: Number(row.total_costs) || 0,
        net_margin: Number(row.net_margin) || 0,
        cost_percent:
          row.cost_percent !== null && row.cost_percent !== undefined
            ? Number(row.cost_percent)
            : null,
        cost_count: Number(row.cost_count) || 0,
      }))

      const parsedSuppliers: FinanceSupplier[] = (
        (suppliersRes.data as Record<string, unknown>[]) ?? []
      ).map((s) => ({
        id: Number(s.id),
        name: String(s.name),
      }))

      const parsedCosts: LeadCost[] = (
        (costsRes.data as Record<string, unknown>[]) ?? []
      ).map((c) => ({
        id: Number(c.id),
        lead_id: Number(c.lead_id),
        supplier_id: Number(c.supplier_id),
        amount_monthly: Number(c.amount_monthly) || 0,
        note: c.note ? String(c.note) : null,
        created_at: String(c.created_at ?? ''),
        updated_at: String(c.updated_at ?? ''),
        supplier: c.supplier
          ? {
              id: Number((c.supplier as { id: unknown }).id),
              name: String((c.supplier as { name: unknown }).name),
            }
          : null,
      }))

      setFinanceState({
        userId,
        clients: parsedClients,
        totals: parsedTotals,
        suppliers: parsedSuppliers,
        costs: parsedCosts,
      })
    } catch (err) {
      if (currentRequestId === requestId.current) {
        onError(
          getFinanceErrorMessage(err, 'Erro ao carregar dados financeiros.'),
        )
      }
    } finally {
      if (currentRequestId === requestId.current) {
        setLoading(false)
      }
    }
  }, [userId, onError])

  useEffect(() => {
    loadFinance()
  }, [loadFinance])

  const resolveSupplierId = async (
    supplierName: string,
  ): Promise<number | null> => {
    const trimmed = supplierName.trim()
    const lower = trimmed.toLowerCase()

    const found = suppliers.find(
      (s) => s.name.trim().toLowerCase() === lower,
    )
    if (found) {
      return found.id
    }

    const { data: inserted, error: insertError } = await supabase
      .from('finance_suppliers')
      .insert({ name: trimmed })
      .select('id, name')
      .single()

    if (!insertError && inserted) {
      return Number(inserted.id)
    }

    const { data: fetched } = await supabase
      .from('finance_suppliers')
      .select('id, name')
      .ilike('name', trimmed)
      .maybeSingle()

    if (fetched) {
      return Number(fetched.id)
    }

    throw insertError || new Error('Não foi possível cadastrar o fornecedor.')
  };

  const addCost = async (
    leadId: number,
    input: { supplierName: string; amountMonthly: number; note?: string | null },
  ): Promise<boolean> => {
    setSaving(true)
    try {
      const supplierId = await resolveSupplierId(input.supplierName)
      if (!supplierId) {
        throw new Error('Fornecedor inválido.')
      }

      const { error } = await supabase.from('lead_costs').insert({
        lead_id: leadId,
        supplier_id: supplierId,
        amount_monthly: input.amountMonthly,
        note: input.note ? input.note.trim() : null,
      })

      if (error) throw error

      onNotice('Custo adicionado com sucesso.')
      await loadFinance()
      return true
    } catch (err) {
      onError(getFinanceErrorMessage(err, 'Erro ao adicionar custo.'))
      return false
    } finally {
      setSaving(false)
    }
  }

  const updateCost = async (
    costId: number,
    input: { supplierName: string; amountMonthly: number; note?: string | null },
  ): Promise<boolean> => {
    setSaving(true)
    try {
      const supplierId = await resolveSupplierId(input.supplierName)
      if (!supplierId) {
        throw new Error('Fornecedor inválido.')
      }

      const { error } = await supabase
        .from('lead_costs')
        .update({
          supplier_id: supplierId,
          amount_monthly: input.amountMonthly,
          note: input.note ? input.note.trim() : null,
        })
        .eq('id', costId)

      if (error) throw error

      onNotice('Custo atualizado com sucesso.')
      await loadFinance()
      return true
    } catch (err) {
      onError(getFinanceErrorMessage(err, 'Erro ao atualizar custo.'))
      return false
    } finally {
      setSaving(false)
    }
  }

  const deleteCost = async (costId: number): Promise<boolean> => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('lead_costs')
        .delete()
        .eq('id', costId)

      if (error) throw error

      onNotice('Custo excluído com sucesso.')
      await loadFinance()
      return true
    } catch (err) {
      onError(getFinanceErrorMessage(err, 'Erro ao excluir custo.'))
      return false
    } finally {
      setSaving(false)
    }
  }

  return {
    clients,
    totals,
    suppliers,
    costs,
    loading,
    saving,
    reload: loadFinance,
    addCost,
    updateCost,
    deleteCost,
  }
}
