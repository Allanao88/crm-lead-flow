import { describe, expect, it } from 'vitest'
import { calculateSalesMetrics } from '../overview/useSalesMetrics'
import { buildLeadStageSummary } from './useLeadSummary'

describe('buildLeadStageSummary e calculateSalesMetrics', () => {
  it('preenche zeros nas etapas vazias quando a RPC retorna apenas etapas com leads', () => {
    const summary = buildLeadStageSummary([
      {
        stage: 'Novo lead',
        lead_count: '45',
        setup_total: '15000.50',
        mrr_total: '3200.00',
      },
      {
        stage: 'Ganho',
        lead_count: 15,
        setup_total: 8000,
        mrr_total: 2500.75,
      },
    ])

    expect(summary).toEqual({
      'Novo lead': { leadCount: 45, setupTotal: 15000.5, mrrTotal: 3200 },
      Qualificação: { leadCount: 0, setupTotal: 0, mrrTotal: 0 },
      Proposta: { leadCount: 0, setupTotal: 0, mrrTotal: 0 },
      Negociação: { leadCount: 0, setupTotal: 0, mrrTotal: 0 },
      Ganho: { leadCount: 15, setupTotal: 8000, mrrTotal: 2500.75 },
    })
  })

  it('soma o total global de leads e separa indicadores em aberto de negócios ganhos', () => {
    const summary = buildLeadStageSummary([
      { stage: 'Novo lead', lead_count: 50, setup_total: 10000, mrr_total: 2000 },
      { stage: 'Proposta', lead_count: 35, setup_total: 25000, mrr_total: 4500 },
      { stage: 'Negociação', lead_count: 20, setup_total: 15000, mrr_total: 3000 },
      { stage: 'Ganho', lead_count: 15, setup_total: 12000, mrr_total: 2800 },
    ])

    const metrics = calculateSalesMetrics(summary)

    expect(summary.Qualificação).toEqual({
      leadCount: 0,
      setupTotal: 0,
      mrrTotal: 0,
    })
    expect(metrics.totalLeads).toBe(120)
    expect(metrics.openLeadsCount).toBe(105)
    expect(metrics.wonLeadsCount).toBe(15)
    expect(metrics.negotiationCount).toBe(20)
    expect(metrics.pipelineSetup).toBe(50000)
    expect(metrics.pipelineMrr).toBe(9500)
    expect(metrics.wonSetup).toBe(12000)
    expect(metrics.wonMrr).toBe(2800)
  })
})
