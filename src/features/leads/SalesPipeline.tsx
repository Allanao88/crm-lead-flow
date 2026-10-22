import { currency, stageStyles, stages } from './constants'
import type { Lead } from './types'

type SalesPipelineProps = {
  leads: Lead[]
  onSelectStage: (stage: string) => void
}

export default function SalesPipeline({
  leads,
  onSelectStage,
}: SalesPipelineProps) {
  return (
    <section id="pipeline" className="crm-panel p-5 sm:p-6">
      <h2 className="font-bold text-slate-900">Pipeline de vendas</h2>
      <p className="mt-1 text-sm text-slate-500">
        Selecione uma etapa para filtrar os leads.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
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

          return (
            <button
              key={stage}
              onClick={() => onSelectStage(stage)}
              className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-left hover:border-[var(--color-brand)]"
            >
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${stageStyles[stage]}`}
              >
                {stage}
              </span>
              <p className="mt-4 text-2xl font-bold text-slate-900">
                {items.length}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                SETUP: {currency(setupTotal)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                MRR: {currency(mrrTotal)}/mês
              </p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
