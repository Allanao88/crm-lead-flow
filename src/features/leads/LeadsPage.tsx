import type { FormEvent } from 'react'
import FeedbackMessages from '../../components/FeedbackMessages'
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
  notice: string
  onSearchChange: (value: string) => void
  onStageFilterChange: (value: string) => void
  onFormChange: (form: LeadForm) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancelForm: () => void
  onQuantityChange: (productId: number, quantity: string) => void
  onEditLead: (lead: Lead) => void
  onStageChange: (lead: Lead, stage: Stage) => void | Promise<void>
  onClearFilters: () => void
  onPageChange: (page: number) => void
  onLogout: () => void
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
  notice,
  onSearchChange,
  onStageFilterChange,
  onFormChange,
  onSubmit,
  onCancelForm,
  onQuantityChange,
  onEditLead,
  onStageChange,
  onClearFilters,
  onPageChange,
  onLogout,
  onSelectStage,
}: LeadsPageProps) {
  return (
    <div className="mx-auto max-w-[1440px] space-y-6 p-5 sm:p-8">
      <FeedbackMessages
        error={error}
        notice={notice}
        className="mb-0"
      />

      {showForm && (
        <LeadFormPanel
          form={form}
          editingLeadId={editingLeadId}
          leads={leads}
          products={products}
          productItems={productItems}
          saving={saving}
          productsLoading={productsLoading}
          productsError={productsError}
          onFormChange={onFormChange}
          onSubmit={onSubmit}
          onCancel={onCancelForm}
          onQuantityChange={onQuantityChange}
        />
      )}

      <SalesMetricsPanel leads={leads} />
      <SalesPipeline leads={leads} onSelectStage={onSelectStage} />
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
        onLogout={onLogout}
        onEditLead={onEditLead}
        onStageChange={onStageChange}
      />
      <footer className="pb-2 text-center text-xs text-slate-400">
        LeadFlow CRM · AKS - Tech
      </footer>
    </div>
  )
}
