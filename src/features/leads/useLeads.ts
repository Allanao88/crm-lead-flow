import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import type { Lead, LeadForm, Stage } from './types'

type UseLeadsResult = {
  leads: Lead[]
  loading: boolean
  saving: boolean
  saveLead: (form: LeadForm, editingLeadId: number | null) => Promise<boolean>
  handleStageChange: (lead: Lead, stage: Stage) => Promise<void>
}

export function useLeads(
  session: Session | null,
  setError: Dispatch<SetStateAction<string>>,
  setNotice: Dispatch<SetStateAction<string>>,
): UseLeadsResult {
  const [leadState, setLeadState] = useState<{
    userId: string | null
    items: Lead[]
  }>({ userId: null, items: [] })
  const leads = leadState.userId === (session?.user.id ?? null)
    ? leadState.items
    : []
  const setLeads: Dispatch<SetStateAction<Lead[]>> = useCallback((action) => {
    const userId = session?.user.id ?? null

    setLeadState((current) => {
      const currentItems = current.userId === userId ? current.items : []
      const items = typeof action === 'function'
        ? action(currentItems)
        : action

      return { userId, items }
    })
  }, [session?.user.id])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!session) return

    let active = true

    async function loadLeads() {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('leads')
        .select(
          'id, name, email, phone, company, stage, value, created_at, updated_at',
        )
        .order('created_at', { ascending: false })

      if (!active) return

      if (error) {
        setError(`Não foi possível carregar os leads: ${error.message}`)
      } else {
        setLeads((data ?? []) as Lead[])
      }

      setLoading(false)
    }

    void loadLeads()

    return () => {
      active = false
    }
  }, [session, setError, setLeads])

  async function saveLead(
    form: LeadForm,
    editingLeadId: number | null,
  ): Promise<boolean> {
    setError('')
    setNotice('')

    const amount = Number(form.value.replace(',', '.'))

    if (!form.name.trim()) {
      setError('Informe o nome do contato.')
      return false
    }

    if (!Number.isFinite(amount) || amount < 0) {
      setError('Informe um valor válido, igual ou maior que zero.')
      return false
    }

    setSaving(true)

    try {
      const leadData = {
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        company: form.company.trim() || null,
        stage: form.stage,
        value: amount,
      }

      const query = editingLeadId !== null
        ? supabase.from('leads').update(leadData).eq('id', editingLeadId)
        : supabase.from('leads').insert(leadData)

      const { data, error } = await query
        .select(
          'id, name, email, phone, company, stage, value, created_at, updated_at',
        )
        .single()

      if (error) {
        setError(
          editingLeadId !== null
            ? `Não foi possível atualizar o lead: ${error.message}`
            : `Não foi possível cadastrar o lead: ${error.message}`,
        )
        return false
      }

      if (editingLeadId !== null) {
        setLeads((current) =>
          current.map((lead) =>
            lead.id === editingLeadId ? (data as Lead) : lead,
          ),
        )
        setNotice('Lead atualizado com sucesso.')
      } else {
        setLeads((current) => [data as Lead, ...current])
        setNotice('Lead cadastrado com sucesso.')
      }

      return true
    } finally {
      setSaving(false)
    }
  }

  async function handleStageChange(lead: Lead, stage: Stage) {
    if (lead.stage === stage) return

    setError('')
    setNotice('')

    const previousStage = lead.stage

    setLeads((current) =>
      current.map((item) =>
        item.id === lead.id ? { ...item, stage } : item,
      ),
    )

    const { error } = await supabase
      .from('leads')
      .update({ stage })
      .eq('id', lead.id)

    if (error) {
      setLeads((current) =>
        current.map((item) =>
          item.id === lead.id
            ? { ...item, stage: previousStage }
            : item,
        ),
      )
      setError(`Não foi possível atualizar a etapa: ${error.message}`)
    } else {
      setNotice('Etapa do lead atualizada.')
    }
  }

  return {
    leads,
    loading: session ? loading : false,
    saving,
    saveLead,
    handleStageChange,
  }
}
