import { useEffect, useRef, useState, type FormEvent } from 'react'
import LeadFormPanel from './LeadFormPanel'
import LeadsTable from './LeadsTable'
import SalesPipeline from './SalesPipeline'
import SalesMetricsPanel from '../overview/SalesMetricsPanel'
import type { InventoryProduct } from '../inventory/types'
import type { Lead, LeadForm, Stage } from './types'
import type { LeadProductItem } from './useLeadProducts'

type LeadsPageProps = {
  leads: Lead[]
  filteredLeads: Lead[]
  totalCount: number
  page: number
  totalPages: number
  loading: boolean
  saving: boolean
  search: string
  stageFilter: string
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
  onFormChange: (form: LeadForm) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCreateLead: () => void
  onCancelForm: () => void
  onQuantityChange: (productId: number, quantity: string) => void
  onEditLead: (lead: Lead) => void
  onStageChange: (lead: Lead, stage: Stage) => void | Promise<void>
  onClearFilters: () => void
  onPageChange: (page: number) => void
  onSelectStage: (stage: string) => void
}

export default function LeadsPage({
  leads,
  filteredLeads,
  totalCount,
  page,
  totalPages,
  loading,
  saving,
  search,
  stageFilter,
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
  onFormChange,
  onSubmit,
  onCreateLead,
  onCancelForm,
  onQuantityChange,
  onEditLead,
  onStageChange,
  onClearFilters,
  onPageChange,
  onSelectStage,
}: LeadsPageProps) {
  const [movedTransition, setMovedTransition] = useState<{
    from: Stage
    to: Stage
  } | null>(null)
  const movedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

      <SalesMetricsPanel leads={leads} loading={loading} />
      <SalesPipeline
        leads={leads}
        activeStage={stageFilter}
        movedTransition={movedTransition}
        onSelectStage={onSelectStage}
      />
      <LeadsTable
        leads={leads}
        filteredLeads={filteredLeads}
        totalCount={totalCount}
        page={page}
        totalPages={totalPages}
        loading={loading}
        search={search}
        stageFilter={stageFilter}
        onSearchChange={onSearchChange}
        onStageFilterChange={onStageFilterChange}
        onClearFilters={onClearFilters}
        onPageChange={onPageChange}
        onCreateLead={onCreateLead}
        onEditLead={onEditLead}
        onStageChange={handleStageMove}
      />
      <footer className="pb-2 text-center text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
        LeadFlow CRM · AKS - Tech
      </footer>
    </div>
  )
}
