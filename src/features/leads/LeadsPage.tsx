import { useEffect, useRef, useState, type FormEvent } from 'react'
import ConfirmDialog from '../../components/ConfirmDialog'
import Footer from '../../components/Footer'
import LeadFormPanel from './LeadFormPanel'
import LeadsTable from './LeadsTable'
import SalesPipeline from './SalesPipeline'
import SalesMetricsPanel from '../overview/SalesMetricsPanel'
import type { InventoryProduct } from '../inventory/types'
import type { Lead, LeadForm, LeadStageSummary, Stage } from './types'
import type { LeadProductItem } from './useLeadProducts'

type LeadsPageProps = {
  leads: Lead[]
  summary: LeadStageSummary
  summaryLoading: boolean
  summaryError: string
  totalCount: number
  page: number
  totalPages: number
  loading: boolean
  saving: boolean
  search: string
  stageFilter: string
  showArchived: boolean
  form: LeadForm
  showForm: boolean
  editingLeadId: number | null
  products: InventoryProduct[]
  productItems: LeadProductItem[]
  productsLoading: boolean
  productsError: string
  error: string
  onSearchChange: (value: string) => void
  onStageFilterChange: (value: string) => void
  onShowArchivedChange: (value: boolean) => void
  onFormChange: (form: LeadForm) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCreateLead: () => void
  onCancelForm: () => void
  onQuantityChange: (productId: number, quantity: string) => void
  onEditLead: (lead: Lead) => void
  onStageChange: (lead: Lead, stage: Stage) => void | Promise<void>
  onSetLeadArchived: (lead: Lead, archived: boolean) => Promise<boolean>
  onClearFilters: () => void
  onPageChange: (page: number) => void
  onSelectStage: (stage: string) => void
  onRetrySummary: () => void
}

export default function LeadsPage({
  leads,
  summary,
  summaryLoading,
  summaryError,
  totalCount,
  page,
  totalPages,
  loading,
  saving,
  search,
  stageFilter,
  showArchived,
  form,
  showForm,
  editingLeadId,
  products,
  productItems,
  productsLoading,
  productsError,
  error,
  onSearchChange,
  onStageFilterChange,
  onShowArchivedChange,
  onFormChange,
  onSubmit,
  onCreateLead,
  onCancelForm,
  onQuantityChange,
  onEditLead,
  onStageChange,
  onSetLeadArchived,
  onClearFilters,
  onPageChange,
  onSelectStage,
  onRetrySummary,
}: LeadsPageProps) {
  const [movedTransition, setMovedTransition] = useState<{
    from: Stage
    to: Stage
  } | null>(null)
  const movedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [leadToArchive, setLeadToArchive] = useState<Lead | null>(null)
  const [leadToRestore, setLeadToRestore] = useState<Lead | null>(null)

  useEffect(() => {
    return () => {
      if (movedTimerRef.current) {
        clearTimeout(movedTimerRef.current)
      }
    }
  }, [])

  function handleStageMove(lead: Lead, nextStage: Stage) {
    if (lead.stage === nextStage) return

    if (movedTimerRef.current) {
      clearTimeout(movedTimerRef.current)
    }

    setMovedTransition({ from: lead.stage, to: nextStage })
    movedTimerRef.current = setTimeout(() => {
      setMovedTransition(null)
    }, 240)

    void onStageChange(lead, nextStage)
  }

  return (
    <div className="crm-page">
      {showForm && (
        <LeadFormPanel
          open={showForm}
          key={editingLeadId ?? 'new'}
          form={form}
          editingLeadId={editingLeadId}
          leads={leads}
          products={products}
          productItems={productItems}
          saving={saving}
          productsLoading={productsLoading}
          productsError={productsError}
          error={error}
          onFormChange={onFormChange}
          onSubmit={onSubmit}
          onCancel={onCancelForm}
          onQuantityChange={onQuantityChange}
        />
      )}

      <SalesMetricsPanel
        summary={summary}
        loading={summaryLoading}
        error={summaryError}
        onRetry={onRetrySummary}
      />
      <SalesPipeline
        summary={summary}
        loading={summaryLoading}
        error={summaryError}
        activeStage={stageFilter}
        movedTransition={movedTransition}
        onSelectStage={onSelectStage}
      />
      <LeadsTable
        leads={leads}
        totalCount={totalCount}
        page={page}
        totalPages={totalPages}
        loading={loading}
        saving={saving}
        search={search}
        stageFilter={stageFilter}
        showArchived={showArchived}
        onSearchChange={onSearchChange}
        onStageFilterChange={onStageFilterChange}
        onShowArchivedChange={onShowArchivedChange}
        onClearFilters={onClearFilters}
        onPageChange={onPageChange}
        onCreateLead={onCreateLead}
        onEditLead={onEditLead}
        onStageChange={handleStageMove}
        onArchiveLead={(lead) => setLeadToArchive(lead)}
        onRestoreLead={(lead) => setLeadToRestore(lead)}
      />

      <ConfirmDialog
        open={leadToArchive !== null}
        title="Arquivar lead"
        message={
          leadToArchive
            ? `Deseja arquivar o lead "${leadToArchive.name}"? Ele deixará de ser contabilizado no funil e nos indicadores comerciais, mas poderá ser visualizado e restaurado a qualquer momento.`
            : ''
        }
        confirmLabel="Arquivar"
        confirmVariant="danger"
        busy={saving}
        onConfirm={async () => {
          if (!leadToArchive) return
          const ok = await onSetLeadArchived(leadToArchive, true)
          if (ok) setLeadToArchive(null)
        }}
        onCancel={() => {
          if (!saving) setLeadToArchive(null)
        }}
      />

      <ConfirmDialog
        open={leadToRestore !== null}
        title="Restaurar lead"
        message={
          leadToRestore
            ? `Deseja restaurar o lead "${leadToRestore.name}"? Ele voltará para a lista ativa e para os cálculos do pipeline comercial.`
            : ''
        }
        confirmLabel="Restaurar"
        confirmVariant="primary"
        busy={saving}
        onConfirm={async () => {
          if (!leadToRestore) return
          const ok = await onSetLeadArchived(leadToRestore, false)
          if (ok) setLeadToRestore(null)
        }}
        onCancel={() => {
          if (!saving) setLeadToRestore(null)
        }}
      />

      <Footer />
    </div>
  )
}
