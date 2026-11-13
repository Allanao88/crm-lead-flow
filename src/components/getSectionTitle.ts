import type { CrmSection } from './Sidebar'

const sectionTitles: Record<CrmSection, string> = {
  overview: 'Visão geral',
  leads: 'Leads',
  contacts: 'Contatos',
  companies: 'Empresas',
  inventory: 'Gestão de estoque',
  finance: 'Financeiro',
}

export function getSectionTitle(section: CrmSection): string {
  return sectionTitles[section]
}
