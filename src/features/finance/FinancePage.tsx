import { useState, type FormEvent } from 'react'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import FormField from '../../components/FormField'
import GlassDialog from '../../components/GlassDialog'
import MetricCard from '../../components/MetricCard'
import { validateCostForm } from './costValidation'
import type { CostForm, LeadCost } from './types'
import { useFinance } from './useFinance'

type FinancePageProps = {
  isAdmin: boolean
  userId: string | null
  onBackToOverview: () => void
  onError: (message: string) => void
  onNotice: (message: string) => void
}

const currency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(value)

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—'
  }
  return `${value.toFixed(1).replace('.', ',')}%`
}

export default function FinancePage({
  isAdmin,
  userId,
  onBackToOverview,
  onError,
  onNotice,
}: FinancePageProps) {
  const [expandedLeadIds, setExpandedLeadIds] = useState<Record<number, boolean>>({})

  // Cost modal state
  const [costModalOpen, setCostModalOpen] = useState(false)
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null)
  const [editingCostId, setEditingCostId] = useState<number | null>(null)
  const [costForm, setCostForm] = useState<CostForm>({
    supplierName: '',
    amount: '',
    note: '',
  })
  const [formError, setFormError] = useState<string | null>(null)

  // Delete dialog state
  const [costToDelete, setCostToDelete] = useState<LeadCost | null>(null)

  const {
    clients,
    totals,
    suppliers,
    costs,
    loading,
    saving,
    addCost,
    updateCost,
    deleteCost,
  } = useFinance(isAdmin ? userId : null, onError, onNotice)

  if (!isAdmin) {
    return (
      <div className="crm-main-flow space-y-6">
        <div className="glass mx-auto max-w-md rounded-[var(--radius-lg)] p-8 text-center shadow-lg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--badge-warning-bg)] text-[var(--color-warning)]">
            <svg
              aria-hidden="true"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="mt-4 text-[length:var(--text-lg)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)]">
            Acesso restrito
          </h2>
          <p className="mt-2 text-[length:var(--text-sm)] text-[var(--color-text-secondary)]">
            Esta área é restrita a administradores.
          </p>
          <div className="mt-6 flex justify-center">
            <Button variant="primary" onClick={onBackToOverview}>
              Voltar à Visão Geral
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const selectedClient = clients.find((c) => c.lead_id === selectedLeadId)

  function toggleLeadExpanded(leadId: number) {
    setExpandedLeadIds((prev) => ({
      ...prev,
      [leadId]: !prev[leadId],
    }))
  }

  function handleOpenAddCost(leadId: number) {
    setSelectedLeadId(leadId)
    setEditingCostId(null)
    setCostForm({ supplierName: '', amount: '', note: '' })
    setFormError(null)
    setCostModalOpen(true)
  }

  function handleOpenEditCost(leadId: number, cost: LeadCost) {
    setSelectedLeadId(leadId)
    setEditingCostId(cost.id)
    setCostForm({
      supplierName: cost.supplier?.name ?? '',
      amount: cost.amount_monthly.toFixed(2).replace('.', ','),
      note: cost.note ?? '',
    })
    setFormError(null)
    setCostModalOpen(true)
  }

  async function handleCostFormSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)

    const validation = validateCostForm(costForm)
    if (!validation.isValid) {
      setFormError(validation.error)
      return
    }

    if (editingCostId) {
      const ok = await updateCost(editingCostId, validation.data)
      if (ok) {
        setCostModalOpen(false)
      }
    } else if (selectedLeadId) {
      const ok = await addCost(selectedLeadId, validation.data)
      if (ok) {
        setCostModalOpen(false)
        // Ensure client is expanded so user sees the new cost
        setExpandedLeadIds((prev) => ({ ...prev, [selectedLeadId]: true }))
      }
    }
  }

  async function handleConfirmDelete() {
    if (!costToDelete) return
    const ok = await deleteCost(costToDelete.id)
    if (ok) {
      setCostToDelete(null)
    }
  }

  return (
    <div className="crm-main-flow space-y-6">
      {/* Top summary metric cards */}
      <section aria-label="Métricas financeiras gerais">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="MRR Total"
            value={currency(totals?.total_mrr ?? 0)}
            detail={`${totals?.clients_count ?? 0} cliente(s) ativo(s)`}
          />
          <MetricCard
            label="Custos Totais"
            value={currency(totals?.total_costs ?? 0)}
            detail="Soma dos custos mensais recorrentes"
          />
          <MetricCard
            label="Margem Líquida"
            value={currency(totals?.total_margin ?? 0)}
            detail={
              totals && totals.total_mrr > 0
                ? `Margem geral: ${formatPercent((totals.total_margin / totals.total_mrr) * 100)}`
                : 'MRR − Custos mensais'
            }
          />
          <MetricCard
            label="% de Custo Geral"
            value={formatPercent(totals?.cost_percent)}
            detail="Custos mensais ÷ MRR"
          />
        </div>
      </section>

      {/* Warning banner if clients without costs exist */}
      {totals && totals.clients_without_costs > 0 && (
        <aside
          role="status"
          aria-live="polite"
          className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--badge-warning-border)] bg-[var(--badge-warning-bg)] p-4 text-[length:var(--text-sm)] text-[var(--badge-warning-text)] shadow-sm"
        >
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-[var(--color-warning)]"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="font-[var(--font-weight-medium)]">
            {totals.clients_without_costs === 1
              ? '1 cliente ativo ainda não tem custos cadastrados.'
              : `${totals.clients_without_costs} clientes ativos ainda não têm custos cadastrados.`}
          </span>
        </aside>
      )}

      {/* Main clients section */}
      <section aria-label="Margens e custos por cliente" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[length:var(--text-lg)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)]">
              Margens por Cliente
            </h2>
            <p className="text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
              Apenas leads na etapa &quot;Ganho&quot; e não arquivados entram no cálculo.
            </p>
          </div>
        </div>

        {loading && clients.length === 0 ? (
          <div className="glass flex min-h-48 items-center justify-center rounded-[var(--radius-lg)] p-8">
            <p className="text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
              Carregando dados financeiros...
            </p>
          </div>
        ) : clients.length === 0 ? (
          <div className="glass rounded-[var(--radius-lg)] p-8 text-center">
            <p className="text-[length:var(--text-md)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)]">
              Nenhum cliente ativo em etapa &quot;Ganho&quot;
            </p>
            <p className="mt-1 text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
              Para cadastrar custos e visualizar métricas financeiras, mova leads para a etapa Ganho.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {clients.map((client) => {
              const isExpanded = Boolean(expandedLeadIds[client.lead_id])
              const clientCosts = costs.filter((c) => c.lead_id === client.lead_id)

              const isPositive = client.net_margin > 0
              const isNegative = client.net_margin < 0

              return (
                <article
                  key={client.lead_id}
                  className="glass overflow-hidden rounded-[var(--radius-lg)] border border-[var(--glass-border)] transition-shadow hover:shadow-md"
                >
                  {/* Header / Clickable row */}
                  <button
                    type="button"
                    onClick={() => toggleLeadExpanded(client.lead_id)}
                    aria-expanded={isExpanded}
                    aria-controls={`client-costs-${client.lead_id}`}
                    className="flex w-full flex-col gap-3 p-4 text-left transition-colors hover:bg-[var(--glass-bg-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] sm:flex-row sm:items-center sm:justify-between sm:p-5"
                  >
                    {/* Left: Client name and company */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[length:var(--text-base)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)]">
                          {client.lead_name}
                        </span>
                        {client.company && (
                          <span className="text-[length:var(--text-xs)] font-[var(--font-weight-medium)] text-[var(--color-text-secondary)]">
                            • {client.company}
                          </span>
                        )}
                        {client.cost_count === 0 && (
                          <span className="crm-badge crm-badge--warning">
                            Sem custos cadastrados
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[length:var(--text-2xs)] text-[var(--color-text-muted)]">
                        {client.cost_count === 1
                          ? '1 custo cadastrado'
                          : `${client.cost_count} custos cadastrados`}
                      </p>
                    </div>

                    {/* Right: Metrics + Chevron */}
                    <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end sm:gap-6">
                      <div className="text-left sm:text-right">
                        <span className="block text-[length:var(--text-2xs)] font-[var(--font-weight-semibold)] uppercase tracking-wider text-[var(--color-text-muted)]">
                          MRR
                        </span>
                        <span className="text-[length:var(--text-sm)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)] tabular-nums">
                          {currency(client.mrr_value)}
                        </span>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="block text-[length:var(--text-2xs)] font-[var(--font-weight-semibold)] uppercase tracking-wider text-[var(--color-text-muted)]">
                          Custos
                        </span>
                        <span className="text-[length:var(--text-sm)] font-[var(--font-weight-bold)] text-[var(--color-text-secondary)] tabular-nums">
                          {currency(client.total_costs)}
                        </span>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="block text-[length:var(--text-2xs)] font-[var(--font-weight-semibold)] uppercase tracking-wider text-[var(--color-text-muted)]">
                          Margem
                        </span>
                        <span
                          className={`text-[length:var(--text-sm)] font-[var(--font-weight-bold)] tabular-nums ${
                            isPositive
                              ? 'text-[var(--color-success)]'
                              : isNegative
                                ? 'text-[var(--color-danger)]'
                                : 'text-[var(--color-text-primary)]'
                          }`}
                        >
                          {currency(client.net_margin)}
                        </span>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="block text-[length:var(--text-2xs)] font-[var(--font-weight-semibold)] uppercase tracking-wider text-[var(--color-text-muted)]">
                          % Custo
                        </span>
                        <span className="text-[length:var(--text-sm)] font-[var(--font-weight-semibold)] text-[var(--color-text-secondary)] tabular-nums">
                          {formatPercent(client.cost_percent)}
                        </span>
                      </div>

                      {/* Chevron */}
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-[var(--color-brand)]' : ''
                        }`}
                      >
                        <svg
                          aria-hidden="true"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    </div>
                  </button>

                  {/* Expanded detail section */}
                  {isExpanded && (
                    <div
                      id={`client-costs-${client.lead_id}`}
                      className="border-t border-[var(--glass-border)] bg-[var(--glass-bg-subtle)]/40 p-4 sm:p-5"
                    >
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-[length:var(--text-sm)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)]">
                          Custos mensais de {client.lead_name}
                        </h3>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenAddCost(client.lead_id)}
                        >
                          + Adicionar custo
                        </Button>
                      </div>

                      {clientCosts.length === 0 ? (
                        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--glass-border)] p-6 text-center">
                          <p className="text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
                            Nenhum custo cadastrado para este cliente.
                          </p>
                          <div className="mt-3">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpenAddCost(client.lead_id)}
                            >
                              Cadastrar primeiro custo
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--glass-border)]">
                          <table className="crm-table w-full text-left text-[length:var(--text-sm)]">
                            <thead className="bg-[var(--glass-bg-subtle)] text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] uppercase tracking-wider text-[var(--color-text-muted)]">
                              <tr>
                                <th scope="col" className="p-3">
                                  Fornecedor
                                </th>
                                <th scope="col" className="p-3">
                                  Valor (R$/mês)
                                </th>
                                <th scope="col" className="p-3">
                                  Observação
                                </th>
                                <th scope="col" className="p-3 text-right">
                                  Ações
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--glass-border)]">
                              {clientCosts.map((cost) => (
                                <tr key={cost.id} className="hover:bg-[var(--glass-bg-subtle)]/60">
                                  <td className="p-3 font-[var(--font-weight-semibold)] text-[var(--color-text-primary)]">
                                    {cost.supplier?.name || 'Fornecedor'}
                                  </td>
                                  <td className="p-3 font-[var(--font-weight-bold)] text-[var(--color-text-primary)] tabular-nums">
                                    {currency(cost.amount_monthly)}
                                  </td>
                                  <td className="max-w-xs break-words p-3 text-[length:var(--text-xs)] text-[var(--color-text-secondary)]">
                                    {cost.note || '—'}
                                  </td>
                                  <td className="p-3 text-right">
                                    <div className="inline-flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleOpenEditCost(client.lead_id, cost)}
                                        aria-label={`Editar custo de ${cost.supplier?.name || 'fornecedor'}`}
                                      >
                                        Editar
                                      </Button>
                                      <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => setCostToDelete(cost)}
                                        aria-label={`Excluir custo de ${cost.supplier?.name || 'fornecedor'}`}
                                      >
                                        Excluir
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* Cost modal (add or edit) */}
      <GlassDialog
        open={costModalOpen}
        variant="modal"
        busy={saving}
        title={editingCostId ? 'Editar custo mensal' : 'Adicionar custo mensal'}
        description={
          selectedClient
            ? `Cliente: ${selectedClient.lead_name}`
            : 'Preencha os dados do custo mensal recorrente.'
        }
        onClose={() => setCostModalOpen(false)}
      >
        <form noValidate onSubmit={handleCostFormSubmit} className="space-y-4">
          {formError && (
            <div
              role="alert"
              className="rounded-[var(--radius-md)] border border-[var(--badge-danger-border)] bg-[var(--badge-danger-bg)] p-3 text-[length:var(--text-sm)] text-[var(--badge-danger-text)]"
            >
              {formError}
            </div>
          )}

          <FormField label="Fornecedor *">
            {(fieldProps) => (
              <>
                <input
                  {...fieldProps}
                  type="text"
                  list="finance-suppliers-datalist"
                  required
                  maxLength={100}
                  placeholder="Ex.: Supabase, Vercel, AWS"
                  value={costForm.supplierName}
                  onChange={(e) =>
                    setCostForm((prev) => ({
                      ...prev,
                      supplierName: e.target.value,
                    }))
                  }
                />
                <datalist id="finance-suppliers-datalist">
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.name} />
                  ))}
                </datalist>
              </>
            )}
          </FormField>

          <FormField
            label="Valor mensal (R$) *"
            hint="Aceita vírgula ou ponto (ex: 150,00)"
          >
            {(fieldProps) => (
              <input
                {...fieldProps}
                type="text"
                inputMode="decimal"
                required
                placeholder="0,00"
                value={costForm.amount}
                onChange={(e) =>
                  setCostForm((prev) => ({ ...prev, amount: e.target.value }))
                }
              />
            )}
          </FormField>

          <FormField
            label="Observação (opcional)"
            hint="Máximo de 200 caracteres. Útil para detalhes de rateio."
          >
            {(fieldProps) => (
              <textarea
                {...fieldProps}
                rows={2}
                maxLength={200}
                placeholder="Ex.: Supabase Pro rateado em 3 clientes"
                value={costForm.note}
                onChange={(e) =>
                  setCostForm((prev) => ({ ...prev, note: e.target.value }))
                }
              />
            )}
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCostModalOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Salvando...' : editingCostId ? 'Salvar alterações' : 'Adicionar custo'}
            </Button>
          </div>
        </form>
      </GlassDialog>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={Boolean(costToDelete)}
        title="Excluir custo"
        message={
          costToDelete
            ? `Tem certeza que deseja excluir o custo mensal de ${currency(
                costToDelete.amount_monthly,
              )} (${costToDelete.supplier?.name || 'fornecedor'})?`
            : ''
        }
        confirmLabel="Excluir custo"
        confirmVariant="danger"
        busy={saving}
        onConfirm={handleConfirmDelete}
        onCancel={() => setCostToDelete(null)}
      />
    </div>
  )
}
