import { useMemo } from 'react'
import type { Lead } from '../leads/types'

export function useSalesMetrics(leads: Lead[]) {
  return useMemo(() => {
    const openLeads = leads.filter((lead) => lead.stage !== 'Ganho')
    const wonLeads = leads.filter((lead) => lead.stage === 'Ganho')

    const sumField = (
      items: Lead[],
      field: 'setup_value' | 'mrr_value',
    ) => items.reduce((total, lead) => total + Number(lead[field]), 0)

    return {
      pipelineSetup: sumField(openLeads, 'setup_value'),
      pipelineMrr: sumField(openLeads, 'mrr_value'),
      wonSetup: sumField(wonLeads, 'setup_value'),
      wonMrr: sumField(wonLeads, 'mrr_value'),
    }
  }, [leads])
}
