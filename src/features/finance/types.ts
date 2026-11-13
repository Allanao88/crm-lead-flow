export type FinanceClientMargin = {
  lead_id: number
  lead_name: string
  company: string | null
  mrr_value: number
  total_costs: number
  net_margin: number
  cost_percent: number | null
  cost_count: number
}

export type FinanceTotals = {
  total_mrr: number
  total_costs: number
  total_margin: number
  cost_percent: number | null
  clients_count: number
  clients_without_costs: number
}

export type FinanceSupplier = {
  id: number
  name: string
  created_at?: string
}

export type LeadCost = {
  id: number
  lead_id: number
  supplier_id: number
  amount_monthly: number
  note: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
  supplier?: {
    id: number
    name: string
  } | null
}

export type CostForm = {
  supplierName: string
  amount: string
  note: string
}

export const emptyCostForm: CostForm = {
  supplierName: '',
  amount: '',
  note: '',
}
