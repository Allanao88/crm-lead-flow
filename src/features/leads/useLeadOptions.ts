import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

export const LEAD_OPTIONS_MAX_LIMIT = 1000

export type LeadOption = {
  id: number
  name: string
  company: string | null
}

type LeadOptionsState = {
  userId: string | null
  items: LeadOption[]
}

type UseLeadOptionsResult = {
  leadOptions: LeadOption[]
  loading: boolean
  reload: () => Promise<void>
  getLeadName: (id: number) => Promise<string | null>
}

export function useLeadOptions(
  session: Session | null,
  onError?: (message: string) => void,
  onNotice?: (message: string) => void,
): UseLeadOptionsResult {
  const userId = session?.user.id ?? null

  const [state, setState] = useState<LeadOptionsState>({
    userId: null,
    items: [],
  })
  const [loading, setLoading] = useState(false)
  const requestId = useRef(0)

  // Cache para leads arquivados ou buscados sob demanda
  const extraLeadsCache = useRef<Map<number, string | null>>(new Map())

  const leadOptions = state.userId === userId ? state.items : []

  const loadLeadOptions = useCallback(async () => {
    if (!userId) {
      return
    }

    const currentRequestId = ++requestId.current
    setLoading(true)

    try {
      const { data, error, count } = await supabase
        .from('leads')
        .select('id, name, company', { count: 'exact' })
        .is('archived_at', null)
        .order('name', { ascending: true })
        .limit(LEAD_OPTIONS_MAX_LIMIT)

      if (currentRequestId !== requestId.current) return

      if (error) {
        onError?.(`Não foi possível carregar as opções de leads: ${error.message}`)
        return
      }

      const items = (data ?? []) as LeadOption[]

      if (count !== null && count > LEAD_OPTIONS_MAX_LIMIT) {
        onNotice?.(
          `A listagem de leads para vínculo atingiu o limite de segurança de ${LEAD_OPTIONS_MAX_LIMIT} registros. Alguns leads podem não aparecer no seletor.`,
        )
      }

      setState({
        userId,
        items,
      })

      // Popula o cache com os leads ativos conhecidos
      for (const item of items) {
        extraLeadsCache.current.set(item.id, item.name)
      }
    } catch (err) {
      if (currentRequestId !== requestId.current) return
      onError?.(
        err instanceof Error
          ? `Não foi possível carregar as opções de leads: ${err.message}`
          : 'Não foi possível carregar as opções de leads.',
      )
    } finally {
      if (currentRequestId === requestId.current) {
        setLoading(false)
      }
    }
  }, [userId, onError, onNotice])

  useEffect(() => {
    if (!userId) {
      requestId.current += 1
      return
    }

    const timeoutId = setTimeout(() => {
      void loadLeadOptions()
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      requestId.current += 1
    }
  }, [userId, loadLeadOptions])

  const getLeadName = useCallback(
    async (id: number): Promise<string | null> => {
      // 1. Já está nas opções ativas?
      const foundInOptions = state.items.find((item) => item.id === id)
      if (foundInOptions) {
        return foundInOptions.name
      }

      // 2. Já está no cache extra?
      if (extraLeadsCache.current.has(id)) {
        return extraLeadsCache.current.get(id) ?? null
      }

      // 3. Busca no banco por id (inclusive se arquivado)
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('name')
          .eq('id', id)
          .maybeSingle()

        if (error || !data) {
          extraLeadsCache.current.set(id, null)
          return null
        }

        const name = (data as { name: string }).name
        extraLeadsCache.current.set(id, name)
        return name
      } catch {
        return null
      }
    },
    [state.items],
  )

  return {
    leadOptions,
    loading: userId ? loading : false,
    reload: loadLeadOptions,
    getLeadName,
  }
}
