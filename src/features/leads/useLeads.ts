import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import type { Lead, LeadForm, Stage } from './types'
import type { LeadProductItem } from './useLeadProducts'
import { validateLeadForm } from './leadValidation'

const leadFields =
  'id, name, email, phone, company, stage, setup_value, mrr_value, created_at, updated_at'

type UseLeadsResult = {
  leads: Lead[]
  loading: boolean
  saving: boolean
  saveLead: (form: LeadForm, editingLeadId: number | null, productItems: LeadProductItem[]) => Promise<boolean>
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

      try {
        const { data, error } = await supabase
          .from('leads')
          .select(leadFields)
          .order('created_at', { ascending: false })

        if (!active) return

        if (error) {
          setError(`Não foi possível carregar os leads: ${error.message}`)
        } else {
          setLeads((data ?? []) as Lead[])
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? `Não foi possível carregar os leads: ${err.message}`
              : 'Não foi possível carregar os leads.',
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadLeads()

    return () => {
      active = false
    }
  }, [session, setError, setLeads])

  async function saveLead(
    form: LeadForm,
    editingLeadId: number | null,
    productItems: LeadProductItem[],
  ): Promise<boolean> {
    setError('')
    setNotice('')

    const validation = validateLeadForm(form, productItems)

    if (!validation.valid) {
      setError(validation.error)
      return false
    }

    const {
      setupValue,
      mrrValue,
      products: normalizedProducts,
    } = validation

    setSaving(true)

    try {
      const leadData = {
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        company: form.company.trim() || null,
        setup_value: setupValue,
        mrr_value: mrrValue,
      }

      if (editingLeadId !== null) {
        const { data: updatedLead, error: updateError } = await supabase
          .from('leads')
          .update(leadData)
          .eq('id', editingLeadId)
          .select(leadFields)
          .single()

        if (updateError) {
          setError(`Não foi possível atualizar o lead: ${updateError.message}`)
          return false
        }

        if (updatedLead.stage !== 'Ganho') {
          const { error: productsError } = await supabase.rpc(
            'set_lead_products',
            {
              p_lead_id: editingLeadId,
              p_items: normalizedProducts,
            },
          )

          if (productsError) {
            setError(
              `Dados comerciais salvos, mas não foi possível salvar os produtos: ${productsError.message}`,
            )
            return false
          }
        }

        if (updatedLead.stage !== form.stage) {
          const { error: stageError } = await supabase.rpc(
            'set_lead_stage_with_inventory',
            {
              p_lead_id: editingLeadId,
              p_stage: form.stage,
            },
          )

          if (stageError) {
            setError(
              `Os dados comerciais foram salvos, mas não foi possível alterar a etapa: ${stageError.message}`,
            )
            return false
          }
        }

        const { data: finalLead, error: reloadError } = await supabase
          .from('leads')
          .select(leadFields)
          .eq('id', editingLeadId)
          .single()

        if (reloadError) {
          setError(
            `Lead salvo, mas não foi possível atualizar a tela: ${reloadError.message}`,
          )
          return false
        }

        setLeads((current) =>
          current.map((lead) =>
            lead.id === editingLeadId ? (finalLead as Lead) : lead,
          ),
        )
        setNotice('Lead atualizado com sucesso.')
      } else {
        const { data, error } = await supabase
          .from('leads')
          .insert({ ...leadData, stage: 'Novo lead' })
          .select(leadFields)
          .single()

        if (error) {
          setError(`Não foi possível cadastrar o lead: ${error.message}`)
          return false
        }

        let savedLead = data as Lead

        const { error: productsError } = await supabase.rpc(
          'set_lead_products',
          {
            p_lead_id: savedLead.id,
            p_items: normalizedProducts,
          },
        )

        if (productsError) {
          setLeads((current) => [savedLead, ...current])
          setError(
            `Lead cadastrado, mas não foi possível salvar os produtos: ${productsError.message}`,
          )
          return false
        }

        if (form.stage !== 'Novo lead') {
          const { error: stageError } = await supabase.rpc(
            'set_lead_stage_with_inventory',
            {
              p_lead_id: savedLead.id,
              p_stage: form.stage,
            },
          )

          if (stageError) {
            setLeads((current) => [savedLead, ...current])
            setError(
              `Lead cadastrado em "Novo lead", mas não foi possível alterar a etapa: ${stageError.message}`,
            )
            return false
          }

          const { data: finalLead, error: reloadError } = await supabase
            .from('leads')
            .select(leadFields)
            .eq('id', savedLead.id)
            .single()

          if (reloadError) {
            setLeads((current) => [savedLead, ...current])
            setError(
              `Lead cadastrado, mas não foi possível atualizar a tela: ${reloadError.message}`,
            )
            return false
          }

          savedLead = finalLead as Lead
        }

        setLeads((current) => [savedLead, ...current])
        setNotice('Lead cadastrado com sucesso.')
      }

      return true
    } catch (err) {
      setError(
        err instanceof Error
          ? `Não foi possível salvar o lead: ${err.message}`
          : 'Não foi possível salvar o lead.',
      )
      return false
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

    try {
      const { error } = await supabase.rpc(
        'set_lead_stage_with_inventory',
        {
          p_lead_id: lead.id,
          p_stage: stage,
        },
      )

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
    } catch (err) {
      setLeads((current) =>
        current.map((item) =>
          item.id === lead.id
            ? { ...item, stage: previousStage }
            : item,
        ),
      )
      setError(
        err instanceof Error
          ? `Não foi possível atualizar a etapa: ${err.message}`
          : 'Não foi possível atualizar a etapa.',
      )
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
