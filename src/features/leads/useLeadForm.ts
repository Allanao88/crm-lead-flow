import { useState, type FormEvent } from 'react'
import { emptyForm } from './constants'
import type { Lead, LeadForm } from './types'
import type { LeadProductItem } from './useLeadProducts'

type UseLeadFormParams = {
  saveLead: (
    form: LeadForm,
    editingLeadId: number | null,
    productItems: LeadProductItem[],
  ) => Promise<boolean>
  setError: (message: string) => void
  setNotice: (message: string) => void
  resetFilters: () => void
}

export function useLeadForm({
  saveLead,
  setError,
  setNotice,
  resetFilters,
}: UseLeadFormParams) {
  const [form, setForm] = useState<LeadForm>(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [editingLeadId, setEditingLeadId] = useState<number | null>(null)

  function resetForm() {
    setForm(emptyForm)
    setEditingLeadId(null)
    setShowForm(false)
  }

  function startNewLead() {
    setForm(emptyForm)
    setEditingLeadId(null)
    setShowForm(true)
  }

  async function handleCreateLead(
    event: FormEvent<HTMLFormElement>,
    productItems: LeadProductItem[],
    productsLoading: boolean,
    productsError: string,
  ): Promise<boolean> {
    event.preventDefault()

    if (productsLoading) {
      setError('Aguarde o carregamento dos produtos vinculados.')
      return false
    }

    if (productsError) {
      setError(productsError)
      return false
    }

    const saved = await saveLead(form, editingLeadId, productItems)
    if (!saved) return false

    resetForm()
    resetFilters()
    return true
  }

  function handleEditLead(lead: Lead) {
    setEditingLeadId(lead.id)
    setForm({
      name: lead.name,
      email: lead.email ?? '',
      phone: lead.phone ?? '',
      company: lead.company ?? '',
      stage: lead.stage,
      setup_value: String(lead.setup_value),
      mrr_value: String(lead.mrr_value),
    })
    setShowForm(true)
    setError('')
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelForm() {
    resetForm()
    setError('')
    setNotice('')
  }

  return {
    form,
    setForm,
    showForm,
    setShowForm,
    editingLeadId,
    resetForm,
    startNewLead,
    cancelForm,
    handleCreateLead,
    handleEditLead,
  }
}
