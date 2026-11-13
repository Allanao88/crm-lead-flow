import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import FormField from '../../components/FormField'
import { TableRowsSkeleton } from '../../components/Skeleton'
import type { Lead, Stage } from './types'
import { currency, stages, stageStyles } from './constants'
import { brand } from '../../config/brand'

type LeadsTableProps = {
  leads: Lead[]
  totalCount: number
  page: number
  totalPages: number
  loading: boolean
  saving?: boolean
  search: string
  stageFilter: string
  showArchived: boolean
  onSearchChange: (value: string) => void
  onStageFilterChange: (value: string) => void
  onShowArchivedChange: (value: boolean) => void
  onClearFilters: () => void
  onPageChange: (page: number) => void
  onCreateLead: () => void
  onEditLead: (lead: Lead) => void
  onStageChange: (lead: Lead, stage: Stage) => void | Promise<void>
  onArchiveLead: (lead: Lead) => void
  onRestoreLead: (lead: Lead) => void
}

function buildPageItems(
  page: number,
  totalPages: number,
): Array<number | 'ellipsis-start' | 'ellipsis-end'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const items: Array<number | 'ellipsis-start' | 'ellipsis-end'> = [1]

  if (page > 3) {
    items.push('ellipsis-start')
  }

  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)

  for (let current = start; current <= end; current += 1) {
    items.push(current)
  }

  if (page < totalPages - 2) {
    items.push('ellipsis-end')
  }

  items.push(totalPages)
  return items
}

export default function LeadsTable({
  leads,
  totalCount,
  page,
  totalPages,
  loading,
  saving = false,
  search,
  stageFilter,
  showArchived,
  onSearchChange,
  onStageFilterChange,
  onShowArchivedChange,
  onClearFilters,
  onPageChange,
  onCreateLead,
  onEditLead,
  onStageChange,
  onArchiveLead,
  onRestoreLead,
}: LeadsTableProps) {
  const hasActiveFilters =
    Boolean(search.trim()) || stageFilter !== 'Todas' || showArchived
  const pageItems = buildPageItems(page, totalPages)

  return (
    <section id="leads" className="crm-panel">
      <div className="space-y-4 border-b border-[var(--glass-border)] p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="crm-section-title">Todos os leads</h2>
            <p className="mt-1 text-[length:var(--text-sm)] text-[var(--color-text-secondary)]">
              Consulte e acompanhe as oportunidades de {brand.clientName}.
            </p>
          </div>
          <span className="text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] text-[var(--color-text-muted)] tabular-nums">
            {totalCount} resultado(s)
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
                placeholder="Nome, empresa ou e-mail"
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

          <label className="glass-subtle inline-flex min-h-[42px] cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--glass-border)] px-3 py-2 text-[length:var(--text-xs)] font-[var(--font-weight-medium)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(event) => onShowArchivedChange(event.target.checked)}
              className="crm-checkbox h-4 w-4 rounded accent-[var(--color-brand)]"
            />
            <span>Mostrar arquivados</span>
          </label>

          <Button
            variant="secondary"
            onClick={onClearFilters}
            disabled={!search && stageFilter === 'Todas' && !showArchived}
          >
            Limpar filtros
          </Button>
        </div>
      </div>

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
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="crm-stagger-rows">
            {loading ? (
              <TableRowsSkeleton columns={7} rows={6} />
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-0">
                  {!hasActiveFilters ? (
                    <EmptyState
                      icon="leads"
                      title="Nenhum lead cadastrado"
                      description="Adicione sua primeira oportunidade comercial para acompanhar propostas, valores de implantação e receita recorrente."
                      actionLabel="+ Novo lead"
                      onAction={onCreateLead}
                    />
                  ) : (
                    <EmptyState
                      icon="search"
                      title="Nenhum lead encontrado"
                      description="Nenhuma oportunidade corresponde aos filtros selecionados."
                      actionLabel="Limpar filtros"
                      actionVariant="secondary"
                      onAction={onClearFilters}
                    />
                  )}
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const isArchived = Boolean(lead.archived_at)

                return (
                  <tr key={lead.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        {isArchived ? (
                          <span
                            className="font-[var(--font-weight-semibold)] text-[var(--color-text-primary)]"
                            title={lead.name}
                          >
                            {lead.name}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onEditLead(lead)}
                            disabled={saving}
                            className="min-h-6 text-left font-[var(--font-weight-semibold)] text-[var(--color-text-primary)] hover:text-[var(--color-brand)] hover:underline"
                            title="Editar lead"
                          >
                            {lead.name}
                          </button>
                        )}
                        {isArchived && (
                          <span className="crm-badge crm-badge--neutral">
                            Arquivado
                          </span>
                        )}
                      </div>
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
                      {isArchived ? (
                        <span className={stageStyles[lead.stage]}>
                          {lead.stage}
                        </span>
                      ) : (
                        <select
                          aria-label={`Etapa de ${lead.name}`}
                          value={lead.stage}
                          disabled={saving}
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
                      )}
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
                    <td className="text-right">
                      {isArchived ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={saving}
                          title={`Restaurar ${lead.name}`}
                          onClick={() => onRestoreLead(lead)}
                        >
                          Restaurar
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={saving}
                          title={`Arquivar ${lead.name}`}
                          onClick={() => onArchiveLead(lead)}
                        >
                          Arquivar
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <nav
        aria-label="Paginação de leads"
        className="flex flex-col items-center justify-between gap-3 border-t border-[var(--glass-border)] px-5 py-4 text-[length:var(--text-xs)] text-[var(--color-text-secondary)] sm:flex-row sm:px-6"
      >
        <span className="tabular-nums">
          Exibindo {leads.length} de {totalCount} leads · Página {page} de {totalPages}
        </span>

        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={loading || page <= 1}
          >
            Anterior
          </Button>

          <div className="hidden items-center gap-1 sm:flex">
            {pageItems.map((item) =>
              typeof item === 'number' ? (
                <button
                  key={item}
                  type="button"
                  disabled={loading}
                  onClick={() => onPageChange(item)}
                  aria-label={`Ir para página ${item}`}
                  aria-current={item === page ? 'page' : undefined}
                  className={`crm-page-pill tabular-nums ${
                    item === page ? 'crm-page-pill--active' : ''
                  }`}
                >
                  {item}
                </button>
              ) : (
                <span
                  key={item}
                  aria-hidden="true"
                  className="px-1 text-[var(--color-text-muted)]"
                >
                  …
                </span>
              ),
            )}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={loading || page >= totalPages}
          >
            Próxima
          </Button>
        </div>
      </nav>
    </section>
  )
}
