import Button from '../../components/Button'
import FormField from '../../components/FormField'
import type { Lead, Stage } from './types'
import { currency, stages, stageStyles } from './constants'

type LeadsTableProps = {
  leads: Lead[]
  filteredLeads: Lead[]
  totalCount: number
  page: number
  totalPages: number
  loading: boolean
  search: string
  stageFilter: string
  onSearchChange: (value: string) => void
  onStageFilterChange: (value: string) => void
  onClearFilters: () => void
  onPageChange: (page: number) => void
  onEditLead: (lead: Lead) => void
  onStageChange: (lead: Lead, stage: Stage) => void | Promise<void>
}

export default function LeadsTable({
  leads,
  filteredLeads,
  totalCount,
  page,
  totalPages,
  loading,
  search,
  stageFilter,
  onSearchChange,
  onStageFilterChange,
  onClearFilters,
  onPageChange,
  onEditLead,
  onStageChange,
}: LeadsTableProps) {
  return (
    <section id="leads" className="crm-panel">
      <div className="space-y-4 border-b border-[var(--glass-border)] p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="crm-section-title">Todos os leads</h2>
            <p className="mt-1 text-[length:var(--text-sm)] text-[var(--color-text-secondary)]">
              Consulte e acompanhe os contatos comerciais da AKS - Tech.
            </p>
          </div>
          <span className="text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] text-[var(--color-text-muted)] tabular-nums">
            {filteredLeads.length} resultado(s)
          </span>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <FormField label="Buscar leads" className="flex-1">
            {(fieldProps) => (
              <input
                {...fieldProps}
                type="search"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Nome, empresa, e-mail ou telefone"
              />
            )}
          </FormField>

          <FormField label="Filtrar por etapa" className="lg:w-56">
            {(fieldProps) => (
              <select
                {...fieldProps}
                value={stageFilter}
                onChange={(event) => onStageFilterChange(event.target.value)}
              >
                <option value="Todas">Todas as etapas</option>
                {stages.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            )}
          </FormField>

          <Button
            variant="secondary"
            onClick={onClearFilters}
            disabled={!search && stageFilter === 'Todas'}
          >
            Limpar filtros
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="p-8 text-center text-[length:var(--text-sm)] text-[var(--color-text-secondary)]">
          Carregando leads...
        </p>
      ) : (
        <div className="crm-table-container">
          <table className="crm-table min-w-[980px]">
            <thead>
              <tr>
                <th>Contato</th>
                <th>Empresa</th>
                <th>Etapa</th>
                <th className="text-right">SETUP</th>
                <th className="text-right">MRR/mês</th>
                <th className="text-right">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <button
                      type="button"
                      onClick={() => onEditLead(lead)}
                      className="min-h-6 text-left font-[var(--font-weight-semibold)] text-[var(--color-text-primary)] hover:text-[var(--color-brand)] hover:underline"
                      title="Editar lead"
                    >
                      {lead.name}
                    </button>
                    <p className="mt-1 text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
                      {lead.email || lead.phone || 'Sem contato informado'}
                    </p>
                  </td>
                  <td>
                    <span className="text-[var(--color-text-primary)]">
                      {lead.company || '—'}
                    </span>
                  </td>
                  <td>
                    <select
                      aria-label={`Etapa de ${lead.name}`}
                      value={lead.stage}
                      onChange={(event) =>
                        void onStageChange(lead, event.target.value as Stage)
                      }
                      className={`crm-stage-select ${stageStyles[lead.stage]}`}
                    >
                      {stages.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="text-right tabular-nums">
                    <span className="font-[var(--font-weight-semibold)] text-[var(--color-text-primary)]">
                      {currency(Number(lead.setup_value))}
                    </span>
                  </td>
                  <td className="text-right tabular-nums">
                    <span className="font-[var(--font-weight-semibold)] text-[var(--color-positive-text)]">
                      {currency(Number(lead.mrr_value))}
                    </span>
                  </td>
                  <td className="text-right tabular-nums">
                    {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}

              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
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

      <div className="flex flex-col items-center justify-between gap-3 border-t border-[var(--glass-border)] px-5 py-4 text-[length:var(--text-xs)] text-[var(--color-text-secondary)] sm:flex-row sm:px-6">
        <span className="tabular-nums">
          Exibindo {filteredLeads.length} de {totalCount} leads · Página {page} de {totalPages}
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={loading || page <= 1}
          >
            Anterior
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={loading || page >= totalPages}
          >
            Próxima
          </Button>
        </div>
      </div>
    </section>
  )
}
