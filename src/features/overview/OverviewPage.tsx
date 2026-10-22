import MetricCard from '../../components/MetricCard'
import { currency, stages, stageStyles } from '../leads/constants'
import type { Lead } from '../leads/types'
import { useSalesMetrics } from './useSalesMetrics'

type OverviewPageProps = {
  leads: Lead[]
  contactsCount: number
  companiesCount: number
  loading: boolean
  onOpenLeads: () => void
}

export default function OverviewPage({
  leads,
  contactsCount,
  companiesCount,
  loading,
  onOpenLeads,
}: OverviewPageProps) {
  const openLeads = leads.filter((lead) => lead.stage !== 'Ganho')
  const wonLeads = leads.filter((lead) => lead.stage === 'Ganho')
  const { pipelineSetup, pipelineMrr, wonSetup, wonMrr } =
    useSalesMetrics(leads)

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 p-5 sm:p-8">
      <section>
        <p className="text-sm text-slate-500">
          Acompanhe os principais indicadores comerciais da AKS - Tech.
        </p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">
          Resumo comercial
        </h2>
      </section>

      {loading ? (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Carregando indicadores...
        </p>
      ) : (
        <section
          aria-label="Indicadores comerciais"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          <MetricCard
            label="Total de leads"
            value={String(leads.length)}
            detail="Oportunidades cadastradas"
          />
          <MetricCard
            label="Leads em aberto"
            value={String(openLeads.length)}
            detail="Oportunidades ainda não ganhas"
          />
          <MetricCard
            label="Negócios ganhos"
            value={String(wonLeads.length)}
            detail="Oportunidades convertidas"
          />
          <MetricCard
            label="Contatos"
            value={String(contactsCount)}
            detail="Contatos cadastrados"
          />
          <MetricCard
            label="Empresas"
            value={String(companiesCount)}
            detail="Empresas cadastradas"
          />
          <MetricCard
            label="SETUP potencial"
            value={currency(pipelineSetup)}
            detail="Implantação dos negócios em aberto"
          />
          <MetricCard
            label="MRR potencial"
            value={currency(pipelineMrr)}
            detail="Receita mensal em aberto"
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
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold text-slate-900">Pipeline de vendas</h2>
            <p className="mt-1 text-sm text-slate-500">
              Distribuição das oportunidades por etapa.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenLeads}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Acessar leads
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {stages.map((stage) => {
            const items = leads.filter((lead) => lead.stage === stage)

            return (
              <div
                key={stage}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${stageStyles[stage]}`}
                >
                  {stage}
                </span>
                <p className="mt-4 text-2xl font-bold text-slate-900">
                  {items.length}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {items.length === 1 ? 'oportunidade' : 'oportunidades'}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      <footer className="pb-2 text-center text-xs text-slate-400">
        LeadFlow CRM · AKS - Tech
      </footer>
    </div>
  )
}
