export type Stage =
  | 'Novo lead'
  | 'Qualificação'
  | 'Proposta'
  | 'Negociação'
  | 'Ganho'

export type Lead = {
  id: number
  name: string
  company: string | null
  email: string | null
  phone: string | null
  stage: Stage
  setup_value: number
  mrr_value: number
  archived_at: string | null
  created_at: string
  updated_at: string
}

export type LeadForm = {
  name: string
  email: string
  phone: string
  company: string
  stage: Stage
  setup_value: string
  mrr_value: string
}

export type LeadStageSummaryRow = {
  stage: string
  lead_count: number | string
  setup_total: number | string
  mrr_total: number | string
}

export type StageSummary = {
  leadCount: number
  setupTotal: number
  mrrTotal: number
}

export type LeadStageSummary = Record<Stage, StageSummary>
