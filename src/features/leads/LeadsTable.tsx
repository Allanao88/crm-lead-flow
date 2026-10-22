import type { Lead, Stage } from './types'
import { currency, stages, stageStyles } from './constants'

type LeadsTableProps = {
  leads: Lead[]
  filteredLeads: Lead[]
  loading: boolean
  search: string
  stageFilter: string
  onSearchChange: (value: string) => void
  onStageFilterChange: (value: string) => void
  onClearFilters: () => void
  onLogout: () => void
  onEditLead: (lead: Lead) => void
  onStageChange: (lead: Lead, stage: Stage) => void | Promise<void>
}

export default function LeadsTable({
  leads,
  filteredLeads,
  loading,
  search,
  stageFilter,
  onSearchChange,
  onStageFilterChange,
  onClearFilters,
  onLogout,
  onEditLead,
  onStageChange,
}: LeadsTableProps) {
  return (
    <section id="leads" className="crm-panel">
      <div className="space-y-4 border-b border-slate-100 p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold text-slate-900">Todos os leads</h2>
            <p className="mt-1 text-sm text-slate-500">
              Consulte e acompanhe os contatos comerciais da AKS - Tech.
            </p>
          </div>
          <span className="text-sm text-slate-500">
            {filteredLeads.length} resultado(s)
          </span>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <label className="crm-field-label flex-1">
            Buscar leads
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Nome, empresa, e-mail ou telefone"
              className="crm-field mt-1.5 font-normal"
            />
          </label>

          <label className="crm-field-label lg:w-56">
            Filtrar por etapa
            <select
              value={stageFilter}
              onChange={(event) => onStageFilterChange(event.target.value)}
              className="crm-field mt-1.5 font-normal"
            >
              <option value="Todas">Todas as etapas</option>
              {stages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={onClearFilters}
            disabled={!search && stageFilter === 'Todas'}
            className="crm-secondary-button disabled:cursor-not-allowed disabled:opacity-40"
          >
            Limpar filtros
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm hover:bg-slate-50 lg:hidden"
          >
            Sair
          </button>
        </div>
      </div>

      {loading ? (
        <p className="p-8 text-center text-sm text-slate-500">
          Carregando leads...
        </p>
      ) : (
        <div className="crm-table-container">
          <table className="crm-table min-w-[1050px]">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4">Contato</th>
                <th className="px-5 py-4">Empresa</th>
                <th className="px-5 py-4">Etapa</th>
                <th className="px-5 py-4 text-right">SETUP</th>
                <th className="px-5 py-4 text-right">MRR/mês</th>
                <th className="px-5 py-4 text-right">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => onEditLead(lead)}
                      className="text-left font-semibold text-slate-800 hover:text-[var(--color-brand)] hover:underline"
                      title="Editar lead"
                    >
                      {lead.name}
                    </button>
                    <p className="mt-1 text-xs text-slate-500">
                      {lead.email || lead.phone || 'Sem contato informado'}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {lead.company || '—'}
                  </td>
                  <td className="px-5 py-4">
                    <select
                      aria-label={`Etapa de ${lead.name}`}
                      value={lead.stage}
                      onChange={(event) =>
                        void onStageChange(lead, event.target.value as Stage)
                      }
                      className={`rounded-full border-0 px-2.5 py-1.5 text-xs font-semibold ${stageStyles[lead.stage]}`}
                    >
                      {stages.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-right font-semibold">
                    {currency(Number(lead.setup_value))}
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-emerald-700">
                    {currency(Number(lead.mrr_value))}
                  </td>
                  <td className="px-5 py-4 text-right text-slate-500">
                    {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}

              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    {leads.length === 0
                      ? 'Nenhum lead cadastrado ainda.'
                      : 'Nenhum lead corresponde à busca.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
        Exibindo {filteredLeads.length} de {leads.length} leads
      </div>
    </section>
  )
}
