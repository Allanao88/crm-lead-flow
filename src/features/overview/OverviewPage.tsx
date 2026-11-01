import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import MetricCard from '../../components/MetricCard'
import { MetricCardSkeleton, Skeleton } from '../../components/Skeleton'
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
    <div className="crm-page">
      <section>
        <p className="text-[length:var(--text-sm)] text-[var(--color-text-secondary)]">
          Acompanhe os principais indicadores comerciais da AKS - Tech.
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
          {Array.from({ length: 9 }).map((_, index) => (
            <MetricCardSkeleton key={index} />
          ))}
        </section>
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

      <section className="crm-panel p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="crm-section-title">Pipeline de vendas</h2>
            <p className="mt-1 text-[length:var(--text-sm)] text-[var(--color-text-secondary)]">
              Distribuição das oportunidades por etapa.
            </p>
          </div>
          {leads.length > 0 && (
            <Button variant="primary" onClick={onOpenLeads}>
              Acessar leads
            </Button>
          )}
        </div>

        {!loading && leads.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon="leads"
              title="Nenhuma oportunidade no pipeline"
              description="Cadastre seu primeiro lead para visualizar a distribuição das etapas comerciais."
              actionLabel="Ir para leads"
              onAction={onOpenLeads}
            />
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {stages.map((stage) => {
              const items = leads.filter((lead) => lead.stage === stage)

              return (
                <div
                  key={stage}
                  className="glass-subtle rounded-[var(--radius-md)] p-4"
                >
                  <span className={stageStyles[stage]}>
                    {stage}
                  </span>
                  {loading ? (
                    <>
                      <Skeleton className="mt-4 h-7 w-12" />
                      <Skeleton className="mt-2 h-3.5 w-24" />
                    </>
                  ) : (
                    <>
                      <p className="mt-4 text-2xl font-[var(--font-weight-bold)] tracking-[var(--tracking-tight)] text-[var(--color-text-primary)] tabular-nums">
                        {items.length}
                      </p>
                      <p className="mt-1 text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
                        {items.length === 1 ? 'oportunidade' : 'oportunidades'}
                      </p>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      <footer className="pb-2 text-center text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
        LeadFlow CRM · AKS - Tech
      </footer>
    </div>
  )
}
