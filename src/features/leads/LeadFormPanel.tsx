import type { FormEvent } from 'react'
import type { InventoryProduct } from '../inventory/types'
import LeadProductsEditor from './LeadProductsEditor'
import { stages } from './constants'
import type { Lead, LeadForm, Stage } from './types'
import type { LeadProductItem } from './useLeadProducts'

type LeadFormPanelProps = {
  form: LeadForm
  editingLeadId: number | null
  leads: Lead[]
  products: InventoryProduct[]
  productItems: LeadProductItem[]
  saving: boolean
  productsLoading: boolean
  productsError: string
  onFormChange: (form: LeadForm) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  onQuantityChange: (productId: number, quantity: string) => void
}

export default function LeadFormPanel({
  form,
  editingLeadId,
  leads,
  products,
  productItems,
  saving,
  productsLoading,
  productsError,
  onFormChange,
  onSubmit,
  onCancel,
  onQuantityChange,
}: LeadFormPanelProps) {
  const wonLead = editingLeadId !== null &&
    leads.some((lead) => lead.id === editingLeadId && lead.stage === 'Ganho')

  return (
    <section className="crm-panel p-5 sm:p-6">
      <h2 className="text-lg font-bold text-slate-900">
        {editingLeadId !== null ? 'Editar lead' : 'Cadastrar lead'}
      </h2>

      <form onSubmit={onSubmit} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="crm-field-label">
          Nome *
          <input required value={form.name} onChange={(event) => onFormChange({ ...form, name: event.target.value })} className="crm-field mt-1.5" />
        </label>

        <label className="crm-field-label">
          E-mail
          <input type="email" value={form.email} onChange={(event) => onFormChange({ ...form, email: event.target.value })} className="crm-field mt-1.5" />
        </label>

        <label className="crm-field-label">
          Telefone
          <input value={form.phone} onChange={(event) => onFormChange({ ...form, phone: event.target.value })} className="crm-field mt-1.5" />
        </label>

        <label className="crm-field-label">
          Empresa
          <input value={form.company} onChange={(event) => onFormChange({ ...form, company: event.target.value })} className="crm-field mt-1.5" />
        </label>

        <label className="crm-field-label">
          Etapa
          <select value={form.stage} onChange={(event) => onFormChange({ ...form, stage: event.target.value as Stage })} className="crm-field mt-1.5">
            {stages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
          </select>
        </label>

        <label className="crm-field-label">
          SETUP — desenvolvimento (R$)
          <input type="number" min="0" step="0.01" inputMode="decimal" value={form.setup_value} onChange={(event) => onFormChange({ ...form, setup_value: event.target.value })} className="crm-field mt-1.5" />
        </label>

        <label className="crm-field-label">
          MRR — mensalidade (R$/mês)
          <input type="number" min="0" step="0.01" inputMode="decimal" value={form.mrr_value} onChange={(event) => onFormChange({ ...form, mrr_value: event.target.value })} className="crm-field mt-1.5" />
        </label>

        <LeadProductsEditor
          products={products}
          items={productItems}
          loading={productsLoading}
          loadError={productsError}
          disabled={saving || productsLoading || wonLead}
          onQuantityChange={onQuantityChange}
        />

        {wonLead && (
          <p className="text-sm text-amber-700 sm:col-span-2 lg:col-span-3">
            Este lead já foi ganho. Os produtos vinculados ficam bloqueados
            para preservar o histórico de estoque.
          </p>
        )}

        <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-3">
          <button type="submit" disabled={saving} className="crm-primary-button disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? 'Salvando...' : editingLeadId !== null ? 'Salvar alterações' : 'Cadastrar lead'}
          </button>

          <button type="button" disabled={saving} onClick={onCancel} className="crm-secondary-button disabled:cursor-not-allowed disabled:opacity-60">
            Cancelar
          </button>
        </div>
      </form>
    </section>
  )
}

