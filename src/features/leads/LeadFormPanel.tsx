import { useState, type FormEvent } from 'react'
import Button from '../../components/Button'
import FormField from '../../components/FormField'
import GlassDialog from '../../components/GlassDialog'
import type { InventoryProduct } from '../inventory/types'
import LeadProductsEditor from './LeadProductsEditor'
import { stages } from './constants'
import { parseBrazilianNumber } from './leadValidation'
import type { Lead, LeadForm, Stage } from './types'
import type { LeadProductItem } from './useLeadProducts'

type LeadFormPanelProps = {
  open: boolean
  form: LeadForm
  editingLeadId: number | null
  leads: Lead[]
  products: InventoryProduct[]
  productItems: LeadProductItem[]
  saving: boolean
  productsLoading: boolean
  productsError: string
  error?: string
  onFormChange: (form: LeadForm) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  onQuantityChange: (productId: number, quantity: string) => void
}

type TouchedFields = {
  name?: boolean
  setup_value?: boolean
  mrr_value?: boolean
}

export default function LeadFormPanel({
  open,
  form,
  editingLeadId,
  leads,
  products,
  productItems,
  saving,
  productsLoading,
  productsError,
  error = '',
  onFormChange,
  onSubmit,
  onCancel,
  onQuantityChange,
}: LeadFormPanelProps) {
  const [touched, setTouched] = useState<TouchedFields>({})

  const wonLead =
    editingLeadId !== null &&
    leads.some((lead) => lead.id === editingLeadId && lead.stage === 'Ganho')

  const setupParsed = parseBrazilianNumber(form.setup_value)
  const mrrParsed = parseBrazilianNumber(form.mrr_value)

  const nameError =
    touched.name && !form.name.trim() ? 'Informe o nome do lead.' : undefined
  const setupError =
    touched.setup_value &&
    (!form.setup_value.trim() || !Number.isFinite(setupParsed) || setupParsed < 0)
      ? 'Informe um valor válido (ex.: 1.250,00).'
      : undefined
  const mrrError =
    touched.mrr_value &&
    (!form.mrr_value.trim() || !Number.isFinite(mrrParsed) || mrrParsed < 0)
      ? 'Informe um valor válido (ex.: 450,00).'
      : undefined

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    setTouched({ name: true, setup_value: true, mrr_value: true })
    onSubmit(event)
  }

  return (
    <GlassDialog
      open={open}
      variant="drawer"
      busy={saving}
      title={editingLeadId !== null ? 'Editar lead' : 'Cadastrar lead'}
      description="Preencha os dados comerciais e produtos vinculados da oportunidade."
      onClose={onCancel}
    >
      <form
        noValidate
        onSubmit={handleFormSubmit}
        className="grid gap-4 sm:grid-cols-2"
      >
        {error && (
          <div role="alert" className="crm-callout crm-callout--danger sm:col-span-2">
            {error}
          </div>
        )}

        <FormField label="Nome *" error={nameError} className="sm:col-span-2">
          {(fieldProps) => (
            <input
              {...fieldProps}
              data-autofocus
              required
              value={form.name}
              onBlur={() => setTouched((cur) => ({ ...cur, name: true }))}
              onChange={(event) =>
                onFormChange({ ...form, name: event.target.value })
              }
              placeholder="Nome completo do contato"
            />
          )}
        </FormField>

        <FormField label="E-mail">
          {(fieldProps) => (
            <input
              {...fieldProps}
              type="email"
              value={form.email}
              onChange={(event) =>
                onFormChange({ ...form, email: event.target.value })
              }
              placeholder="contato@empresa.com.br"
            />
          )}
        </FormField>

        <FormField label="Telefone">
          {(fieldProps) => (
            <input
              {...fieldProps}
              type="tel"
              value={form.phone}
              onChange={(event) =>
                onFormChange({ ...form, phone: event.target.value })
              }
              placeholder="(11) 99999-9999"
            />
          )}
        </FormField>

        <FormField label="Empresa">
          {(fieldProps) => (
            <input
              {...fieldProps}
              value={form.company}
              onChange={(event) =>
                onFormChange({ ...form, company: event.target.value })
              }
              placeholder="Razão social ou nome fantasia"
            />
          )}
        </FormField>

        <FormField label="Etapa">
          {(fieldProps) => (
            <select
              {...fieldProps}
              value={form.stage}
              onChange={(event) =>
                onFormChange({ ...form, stage: event.target.value as Stage })
              }
            >
              {stages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          )}
        </FormField>

        <FormField
          label="SETUP — desenvolvimento (R$)"
          error={setupError}
          hint="Aceita formato pt-BR (ex.: 1.250,00)"
        >
          {(fieldProps) => (
            <input
              {...fieldProps}
              type="text"
              inputMode="decimal"
              value={form.setup_value}
              onBlur={() => setTouched((cur) => ({ ...cur, setup_value: true }))}
              onChange={(event) =>
                onFormChange({ ...form, setup_value: event.target.value })
              }
            />
          )}
        </FormField>

        <FormField
          label="MRR — mensalidade (R$/mês)"
          error={mrrError}
          hint="Aceita formato pt-BR (ex.: 450,00)"
        >
          {(fieldProps) => (
            <input
              {...fieldProps}
              type="text"
              inputMode="decimal"
              value={form.mrr_value}
              onBlur={() => setTouched((cur) => ({ ...cur, mrr_value: true }))}
              onChange={(event) =>
                onFormChange({ ...form, mrr_value: event.target.value })
              }
            />
          )}
        </FormField>

        <LeadProductsEditor
          products={products}
          items={productItems}
          loading={productsLoading}
          loadError={productsError}
          disabled={saving || productsLoading || wonLead}
          onQuantityChange={onQuantityChange}
        />

        {wonLead && (
          <p className="crm-callout crm-callout--warning sm:col-span-2">
            Este lead já foi ganho. Os produtos vinculados ficam bloqueados
            para preservar o histórico de estoque.
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--glass-border)] pt-4 sm:col-span-2">
          <Button variant="secondary" disabled={saving} onClick={onCancel}>
            Cancelar
          </Button>

          <Button type="submit" variant="primary" loading={saving}>
            {editingLeadId !== null ? 'Salvar alterações' : 'Cadastrar lead'}
          </Button>
        </div>
      </form>
    </GlassDialog>
  )
}
