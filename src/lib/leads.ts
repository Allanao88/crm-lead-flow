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

export const stages: Stage[] = [
  'Novo lead',
  'Qualificação',
  'Proposta',
  'Negociação',
  'Ganho',
]

export const emptyForm: LeadForm = {
  name: '',
  email: '',
  phone: '',
  company: '',
  stage: 'Novo lead',
  value: '0',
}

export const currency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(value)

export const stageStyles: Record<Stage, string> = {
  'Novo lead': 'bg-slate-100 text-slate-600',
  Qualificação: 'bg-blue-50 text-blue-700',
  Proposta: 'bg-violet-50 text-violet-700',
  Negociação: 'bg-amber-50 text-amber-700',
  Ganho: 'bg-emerald-50 text-emerald-700',
}
