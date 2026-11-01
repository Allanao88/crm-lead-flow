import type { Stage, LeadForm } from './types'

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
  setup_value: '0',
  mrr_value: '0',
}

export const currency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(value)

export const stageStyles: Record<Stage, string> = {
  'Novo lead': 'crm-badge crm-badge--neutral',
  Qualificação: 'crm-badge crm-badge--info',
  Proposta: 'crm-badge crm-badge--violet',
  Negociação: 'crm-badge crm-badge--warning',
  Ganho: 'crm-badge crm-badge--success',
}
