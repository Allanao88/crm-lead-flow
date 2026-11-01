import { currency, stageStyles, stages } from './constants'
import type { Lead, Stage } from './types'

type SalesPipelineProps = {
  leads: Lead[]
  activeStage?: string
  movedTransition?: {
    from: Stage
    to: Stage
  } | null
  onSelectStage: (stage: string) => void
}

export default function SalesPipeline({
  leads,
  activeStage = 'Todas',
  movedTransition = null,
  onSelectStage,
}: SalesPipelineProps) {
  return (
    <section id="pipeline" className="crm-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="crm-section-title">Pipeline de vendas</h2>
          <p className="mt-1 text-[length:var(--text-sm)] text-[var(--color-text-secondary)]">
            Selecione uma etapa para filtrar os leads.
          </p>
        </div>
        {movedTransition && (
          <span
            aria-hidden="true"
            className="crm-badge crm-badge--success text-[length:var(--text-2xs)]"
          >
            {movedTransition.from} → {movedTransition.to}
          </span>
        )}
      </div>

      <div className="crm-stagger-cards mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stages.map((stage) => {
          const items = leads.filter((lead) => lead.stage === stage)
          const setupTotal = items.reduce(
            (sum, lead) => sum + Number(lead.setup_value),
            0,
          )
          const mrrTotal = items.reduce(
            (sum, lead) => sum + Number(lead.mrr_value),
            0,
          )
          const isSelected = activeStage === stage
          const isMovedIn = movedTransition?.to === stage
          const isMovedOut = movedTransition?.from === stage

          return (
            <button
              key={stage}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectStage(stage)}
              className={`glass-subtle glass-interactive rounded-[var(--radius-md)] p-4 text-left ${
                isSelected ? 'crm-pipeline-card--selected' : ''
              } ${isMovedIn ? 'crm-pipeline-card--moved-in' : ''} ${
                isMovedOut ? 'crm-pipeline-card--moved-out' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={stageStyles[stage]}>
                  {stage}
                </span>
                {isMovedIn && (
                  <span
                    aria-hidden="true"
                    className="text-[length:var(--text-xs)] font-[var(--font-weight-bold)] text-[var(--color-brand)] tabular-nums"
                  >
                    +1
                  </span>
                )}
              </div>
              <p className="mt-4 text-2xl font-[var(--font-weight-bold)] tracking-[var(--tracking-tight)] text-[var(--color-text-primary)] tabular-nums">
                {items.length}
              </p>
              <p className="mt-2 text-[length:var(--text-xs)] text-[var(--color-text-secondary)] tabular-nums">
                SETUP: {currency(setupTotal)}
              </p>
              <p className="mt-1 text-[length:var(--text-xs)] text-[var(--color-text-muted)] tabular-nums">
                MRR: {currency(mrrTotal)}/mês
              </p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
