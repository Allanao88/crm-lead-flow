import MetricCard from '../../components/MetricCard'
import { MetricCardSkeleton } from '../../components/Skeleton'
import { currency } from '../leads/constants'
import type { LeadStageSummary } from '../leads/types'
import SummaryErrorState from './SummaryErrorState'
import { useSalesMetrics } from './useSalesMetrics'

type SalesMetricsPanelProps = {
  summary: LeadStageSummary
  loading?: boolean
  error?: string
  onRetry?: () => void
}

export default function SalesMetricsPanel({
  summary,
  loading = false,
  error = '',
  onRetry = () => {},
}: SalesMetricsPanelProps) {
  const {
    totalLeads,
    negotiationCount,
    pipelineSetup,
    pipelineMrr,
    wonSetup,
    wonMrr,
  } = useSalesMetrics(summary)

  return (
    <>
      <section>
        <p className="text-[length:var(--text-sm)] text-[var(--color-text-secondary)]">
          Acompanhe os indicadores comerciais de todas as oportunidades.
        </p>
        <h2 className="crm-page-title mt-1">
          Resumo comercial
        </h2>
      </section>

      {loading ? (
        <section
          role="status"
          aria-live="polite"
          aria-label="Carregando indicadores comerciais"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          <span className="sr-only">Carregando indicadores...</span>
          {Array.from({ length: 6 }).map((_, index) => (
            <MetricCardSkeleton key={index} />
          ))}
        </section>
      ) : error ? (
        <SummaryErrorState message={error} onRetry={onRetry} />
      ) : (
        <section
          aria-label="Indicadores comerciais"
          className="crm-stagger-cards grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          <MetricCard
            label="Total de leads"
            value={String(totalLeads)}
            detail="Oportunidades cadastradas"
          />
          <MetricCard
            label="SETUP potencial"
            value={currency(pipelineSetup)}
            detail="Implantação dos negócios em aberto"
          />
          <MetricCard
            label="MRR potencial"
            value={currency(pipelineMrr)}
            detail="Recorrência mensal dos negócios em aberto"
          />
          <MetricCard
            label="SETUP ganho"
            value={currency(wonSetup)}
            detail="Implantação dos negócios ganhos"
          />
          <MetricCard
            label="MRR contratado"
            value={currency(wonMrr)}
            detail="Receita mensal dos negócios ganhos"
          />
          <MetricCard
            label="Em negociação"
            value={String(negotiationCount)}
            detail="Oportunidades em fase final"
          />
        </section>
      )}
    </>
  )
}
