import MetricCard from '../../components/MetricCard'
import { MetricCardSkeleton } from '../../components/Skeleton'
import { currency } from '../leads/constants'
import type { Lead } from '../leads/types'
import { useSalesMetrics } from './useSalesMetrics'

type SalesMetricsPanelProps = {
  leads: Lead[]
  loading?: boolean
}

export default function SalesMetricsPanel({
  leads,
  loading = false,
}: SalesMetricsPanelProps) {
  const { pipelineSetup, pipelineMrr, wonSetup, wonMrr } =
    useSalesMetrics(leads)

  const negotiationCount = leads.filter(
    (lead) => lead.stage === 'Negociação',
  ).length

  return (
    <>
      <section>
        <p className="text-[length:var(--text-sm)] text-[var(--color-text-secondary)]">
          Indicadores calculados sobre a página atual de oportunidades.
        </p>
        <h2 className="crm-page-title mt-1">
          Resumo comercial
        </h2>
      </section>

      {loading && leads.length === 0 ? (
        <section
          aria-label="Carregando indicadores comerciais"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <MetricCardSkeleton key={index} />
          ))}
        </section>
      ) : (
        <section
          aria-label="Indicadores comerciais"
          className="crm-stagger-cards grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          <MetricCard
            label="Leads nesta página"
            value={String(leads.length)}
            detail="Contatos listados abaixo"
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
