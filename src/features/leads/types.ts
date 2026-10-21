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
  value: number
  created_at: string
  updated_at: string
}

export type LeadForm = {
  name: string
  email: string
  phone: string
  company: string
  stage: Stage
  value: string
}
