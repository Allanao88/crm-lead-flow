import { useMemo } from 'react'
import { stages } from '../leads/constants'
import type { LeadStageSummary } from '../leads/types'

export function calculateSalesMetrics(summary: LeadStageSummary) {
  let totalLeads = 0
  let openLeadsCount = 0
  let pipelineSetup = 0
  let pipelineMrr = 0

  for (const stage of stages) {
    const item = summary[stage]
    totalLeads += item.leadCount

    if (stage !== 'Ganho') {
      openLeadsCount += item.leadCount
      pipelineSetup += item.setupTotal
      pipelineMrr += item.mrrTotal
    }
  }

  const won = summary.Ganho

  return {
    totalLeads,
    openLeadsCount,
    wonLeadsCount: won.leadCount,
    negotiationCount: summary['Negociação'].leadCount,
    pipelineSetup,
    pipelineMrr,
    wonSetup: won.setupTotal,
    wonMrr: won.mrrTotal,
  }
}

export function useSalesMetrics(summary: LeadStageSummary) {
  return useMemo(() => calculateSalesMetrics(summary), [summary])
}
