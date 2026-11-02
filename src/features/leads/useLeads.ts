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
export const LEADS_SEARCH_DEBOUNCE_MS = 300

const leadFields =
  'id, name, email, phone, company, stage, setup_value, mrr_value, created_at, updated_at'

export function escapeIlikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&')
}

export function buildLeadsSearchOrFilter(rawSearch: string): string | null {
  const trimmed = rawSearch.trim()
  if (!trimmed) return null

  const pattern = `%${escapeIlikePattern(trimmed)}%`
  const quoted = `"${pattern.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`

  return `name.ilike.${quoted},company.ilike.${quoted},email.ilike.${quoted}`
}

type QueryState = {
  userId: string | null
  search: string
  debouncedSearch: string
  stageFilter: string
  page: number
  reloadKey: number
}

function createInitialQueryState(userId: string | null): QueryState {
  return {
    userId,
    search: '',
    debouncedSearch: '',
    stageFilter: 'Todas',
    page: 1,
    reloadKey: 0,
  }
}

type UseLeadsResult = {
  leads: Lead[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  setPage: (page: number) => void
  search: string
  setSearch: (value: string) => void
  stageFilter: string
  setStageFilter: Dispatch<SetStateAction<string>>
  resetFilters: () => void
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
  onChanged?: () => void | Promise<void>,
): UseLeadsResult {
  const userId = session?.user.id ?? null

  const [leadState, setLeadState] = useState<{
    userId: string | null
    items: Lead[]
    totalCount: number
  }>({ userId: null, items: [], totalCount: 0 })

  const [queryState, setQueryState] = useState<QueryState>(() =>
    createInitialQueryState(null),
  )

  const isSameUser = queryState.userId === userId
  const search = isSameUser ? queryState.search : ''
  const debouncedSearch = isSameUser ? queryState.debouncedSearch : ''
  const stageFilter = isSameUser ? queryState.stageFilter : 'Todas'
  const page = isSameUser ? queryState.page : 1
  const reloadKey = isSameUser ? queryState.reloadKey : 0

  const leads = leadState.userId === userId ? leadState.items : []
  const totalCount = leadState.userId === userId ? leadState.totalCount : 0
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

  const setSearch = useCallback(
    (nextSearch: string) => {
      setQueryState((current) => {
        const base =
          current.userId === userId
            ? current
            : createInitialQueryState(userId)

        return {
          ...base,
          search: nextSearch,
        }
      })
    },
    [userId],
  )

  const setStageFilter: Dispatch<SetStateAction<string>> = useCallback(
    (action) => {
      setQueryState((current) => {
        const base =
          current.userId === userId
            ? current
            : createInitialQueryState(userId)
        const nextStage =
          typeof action === 'function' ? action(base.stageFilter) : action

        if (nextStage === base.stageFilter) return base

        return {
          ...base,
          stageFilter: nextStage,
          page: 1,
        }
      })
    },
    [userId],
  )

  const resetFilters = useCallback(() => {
    setQueryState((current) => {
      const base =
        current.userId === userId
          ? current
          : createInitialQueryState(userId)

      return {
        ...base,
        search: '',
        debouncedSearch: '',
        stageFilter: 'Todas',
        page: 1,
      }
    })
  }, [userId])

  const setPage = useCallback(
    (nextPage: number) => {
      const clamped = Math.min(
        Math.max(1, Math.trunc(nextPage)),
        Math.max(1, Math.ceil(totalCount / LEADS_PAGE_SIZE)),
      )
      setQueryState((current) => {
        const base =
          current.userId === userId
            ? current
            : createInitialQueryState(userId)

        return {
          ...base,
          page: clamped,
        }
      })
    },
    [userId, totalCount],
  )

  useEffect(() => {
    if (!userId) return

    const normalizedSearch = search.trim()
    if (normalizedSearch === debouncedSearch) return

    const timeoutId = setTimeout(() => {
      setQueryState((current) => {
        if (current.userId !== userId) return current
        const nextDebounced = current.search.trim()
        if (nextDebounced === current.debouncedSearch) return current

        return {
          ...current,
          debouncedSearch: nextDebounced,
          page: 1,
        }
      })
    }, LEADS_SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timeoutId)
  }, [userId, search, debouncedSearch])

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
        let query = supabase
          .from('leads')
          .select(leadFields, { count: 'exact' })

        if (stageFilter !== 'Todas') {
          query = query.eq('stage', stageFilter)
        }

        const searchOrFilter = buildLeadsSearchOrFilter(debouncedSearch)
        if (searchOrFilter) {
          query = query.or(searchOrFilter)
        }

        const { data, error, count } = await query
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .range(from, to)

        if (!active) return

        if (error) {
          setError(`Não foi possível carregar os leads: ${error.message}`)
        } else {
          const items = (data ?? []) as Lead[]
          const exactCount = count ?? items.length
          const maxPage = Math.max(1, Math.ceil(exactCount / LEADS_PAGE_SIZE))

          if (items.length === 0 && exactCount > 0 && page > maxPage) {
            setQueryState((current) =>
              current.userId === userId
                ? { ...current, page: maxPage }
                : current,
            )
            return
          }

          setLeadState({
            userId,
            items,
            totalCount: exactCount,
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
  }, [userId, page, debouncedSearch, stageFilter, reloadKey, setError])

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
        setNotice('Lead cadastrado com sucesso.')
      }

      setQueryState((current) => {
        const base =
          current.userId === userId
            ? current
            : createInitialQueryState(userId)

        return {
          ...base,
          search: '',
          debouncedSearch: '',
          stageFilter: 'Todas',
          page: editingLeadId !== null ? base.page : 1,
          reloadKey: base.reloadKey + 1,
        }
      })

      void onChanged?.()
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
        setQueryState((current) => {
          const base =
            current.userId === userId
              ? current
              : createInitialQueryState(userId)

          return {
            ...base,
            reloadKey: base.reloadKey + 1,
          }
        })
        void onChanged?.()
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
    search,
    setSearch,
    stageFilter,
    setStageFilter,
    resetFilters,
    loading: userId ? loading : false,
    saving,
    saveLead,
    handleStageChange,
  }
}
