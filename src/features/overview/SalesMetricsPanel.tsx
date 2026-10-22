import MetricCard from '../../components/MetricCard'
import { currency } from '../leads/constants'
import type { Lead } from '../leads/types'
import { useSalesMetrics } from './useSalesMetrics'

type SalesMetricsPanelProps = {
  leads: Lead[]
}

export default function SalesMetricsPanel({ leads }: SalesMetricsPanelProps) {
  const { pipelineSetup, pipelineMrr, wonSetup, wonMrr } =
    useSalesMetrics(leads)

  const negotiationCount = leads.filter(
    (lead) => lead.stage === 'Negociação',
  ).length

  return (
    <>
      <section>
        <p className="text-sm text-slate-500">
          Dados carregados do banco compartilhado.
        </p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">
          Resumo comercial
        </h2>
      </section>

      <section
        aria-label="Indicadores comerciais"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        <MetricCard
          label="Total de leads"
          value={String(leads.length)}
          detail="Contatos cadastrados"
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
    </>
  )
}
