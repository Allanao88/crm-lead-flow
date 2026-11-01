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

export const LEADS_PAGE_SIZE = 50

const leadFields =
  'id, name, email, phone, company, stage, setup_value, mrr_value, created_at, updated_at'

type UseLeadsResult = {
  leads: Lead[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  setPage: (page: number) => void
  loading: boolean
  saving: boolean
  saveLead: (
    form: LeadForm,
    editingLeadId: number | null,
    productItems: LeadProductItem[],
  ) => Promise<boolean>
  handleStageChange: (lead: Lead, stage: Stage) => Promise<void>
}

export function useLeads(
  session: Session | null,
  setError: Dispatch<SetStateAction<string>>,
  setNotice: Dispatch<SetStateAction<string>>,
): UseLeadsResult {
  const userId = session?.user.id ?? null

  const [leadState, setLeadState] = useState<{
    userId: string | null
    items: Lead[]
    totalCount: number
  }>({ userId: null, items: [], totalCount: 0 })

  const [pageState, setPageState] = useState<{
    userId: string | null
    page: number
  }>({ userId: null, page: 1 })

  const leads = leadState.userId === userId ? leadState.items : []
  const totalCount = leadState.userId === userId ? leadState.totalCount : 0
  const page = pageState.userId === userId ? pageState.page : 1
  const totalPages = Math.max(1, Math.ceil(totalCount / LEADS_PAGE_SIZE))

  const setLeads: Dispatch<SetStateAction<Lead[]>> = useCallback(
    (action) => {
      setLeadState((current) => {
        const currentItems = current.userId === userId ? current.items : []
        const currentTotal = current.userId === userId ? current.totalCount : 0
        const items =
          typeof action === 'function' ? action(currentItems) : action

        return { userId, items, totalCount: currentTotal }
      })
    },
    [userId],
  )

  const setPage = useCallback(
    (nextPage: number) => {
      const clamped = Math.min(
        Math.max(1, Math.trunc(nextPage)),
        Math.max(1, Math.ceil(totalCount / LEADS_PAGE_SIZE)),
      )
      setPageState({ userId, page: clamped })
    },
    [userId, totalCount],
  )

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!userId) return

    let active = true
    const from = (page - 1) * LEADS_PAGE_SIZE
    const to = from + LEADS_PAGE_SIZE - 1

    async function loadLeads() {
      setLoading(true)
      setError('')

      try {
        const { data, error, count } = await supabase
          .from('leads')
          .select(leadFields, { count: 'exact' })
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .range(from, to)

        if (!active) return

        if (error) {
          setError(`Não foi possível carregar os leads: ${error.message}`)
        } else {
          const items = (data ?? []) as Lead[]
          setLeadState({
            userId,
            items,
            totalCount: count ?? items.length,
          })
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
  }, [userId, page, setError])

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
      const { data, error } = await supabase.rpc('save_lead', {
        p_lead_id: editingLeadId,
        p_name: form.name.trim(),
        p_email: form.email.trim() || null,
        p_phone: form.phone.trim() || null,
        p_company: form.company.trim() || null,
        p_stage: form.stage,
        p_setup_value: setupValue,
        p_mrr_value: mrrValue,
        p_items: normalizedProducts,
      })

      if (error || !data) {
        setError(
          editingLeadId !== null
            ? `Não foi possível atualizar o lead: ${error?.message ?? 'resposta vazia.'}`
            : `Não foi possível cadastrar o lead: ${error?.message ?? 'resposta vazia.'}`,
        )
        return false
      }

      const savedLead = data as Lead

      if (editingLeadId !== null) {
        setLeads((current) =>
          current.map((lead) =>
            lead.id === editingLeadId ? savedLead : lead,
          ),
        )
        setNotice('Lead atualizado com sucesso.')
      } else {
        setLeadState((current) => {
          const currentItems = current.userId === userId ? current.items : []
          const currentTotal =
            current.userId === userId ? current.totalCount : 0

          return {
            userId,
            items:
              page === 1
                ? [savedLead, ...currentItems].slice(0, LEADS_PAGE_SIZE)
                : currentItems,
            totalCount: currentTotal + 1,
          }
        })

        if (page !== 1) {
          setPageState({ userId, page: 1 })
        }

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
    totalCount,
    page,
    pageSize: LEADS_PAGE_SIZE,
    totalPages,
    setPage,
    loading: userId ? loading : false,
    saving,
    saveLead,
    handleStageChange,
  }
}
