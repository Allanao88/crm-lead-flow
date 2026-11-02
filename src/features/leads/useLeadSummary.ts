import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { stages } from './constants'
import type {
  LeadStageSummary,
  LeadStageSummaryRow,
  Stage,
} from './types'

export function createEmptyLeadSummary(): LeadStageSummary {
  return {
    'Novo lead': { leadCount: 0, setupTotal: 0, mrrTotal: 0 },
    Qualificação: { leadCount: 0, setupTotal: 0, mrrTotal: 0 },
    Proposta: { leadCount: 0, setupTotal: 0, mrrTotal: 0 },
    Negociação: { leadCount: 0, setupTotal: 0, mrrTotal: 0 },
    Ganho: { leadCount: 0, setupTotal: 0, mrrTotal: 0 },
  }
}

function isStage(value: string): value is Stage {
  return (stages as readonly string[]).includes(value)
}

export function buildLeadStageSummary(
  rows: readonly LeadStageSummaryRow[] | null | undefined,
): LeadStageSummary {
  const summary = createEmptyLeadSummary()

  if (!rows) {
    return summary
  }

  for (const row of rows) {
    if (!isStage(row.stage)) continue

    const leadCount = Number(row.lead_count)
    const setupTotal = Number(row.setup_total)
    const mrrTotal = Number(row.mrr_total)

    summary[row.stage] = {
      leadCount:
        summary[row.stage].leadCount +
        (Number.isFinite(leadCount) ? leadCount : 0),
      setupTotal:
        summary[row.stage].setupTotal +
        (Number.isFinite(setupTotal) ? setupTotal : 0),
      mrrTotal:
        summary[row.stage].mrrTotal +
        (Number.isFinite(mrrTotal) ? mrrTotal : 0),
    }
  }

  return summary
}

function formatSummaryError(rawMessage?: string): string {
  const trimmed = rawMessage?.trim() ?? ''

  if (
    !trimmed ||
    /failed to fetch|networkerror|load failed|fetch/i.test(trimmed)
  ) {
    return 'Não foi possível carregar o resumo comercial. Verifique sua conexão e tente novamente.'
  }

  return `Não foi possível carregar o resumo comercial: ${trimmed}`
}

type UseLeadSummaryResult = {
  summary: LeadStageSummary
  loading: boolean
  error: string
  reload: () => Promise<void>
}

export function useLeadSummary(session: Session | null): UseLeadSummaryResult {
  const userId = session?.user.id ?? null

  const [summaryState, setSummaryState] = useState<{
    userId: string | null
    summary: LeadStageSummary
    error: string
  }>({
    userId: null,
    summary: createEmptyLeadSummary(),
    error: '',
  })

  const [fetching, setFetching] = useState(false)
  const requestId = useRef(0)

  const isCurrentUser = summaryState.userId === userId
  const summary = isCurrentUser
    ? summaryState.summary
    : createEmptyLeadSummary()
  const error = isCurrentUser ? summaryState.error : ''

  const loadSummary = useCallback(async () => {
    if (!userId) return

    const currentRequestId = ++requestId.current
    setFetching(true)

    try {
      const { data, error: rpcError } = await supabase.rpc('lead_stage_summary')

      if (currentRequestId !== requestId.current) return

      if (rpcError) {
        setSummaryState({
          userId,
          summary: createEmptyLeadSummary(),
          error: formatSummaryError(rpcError.message),
        })
        return
      }

      setSummaryState({
        userId,
        summary: buildLeadStageSummary(
          (data ?? []) as LeadStageSummaryRow[],
        ),
        error: '',
      })
    } catch (err) {
      if (currentRequestId !== requestId.current) return

      setSummaryState({
        userId,
        summary: createEmptyLeadSummary(),
        error: formatSummaryError(
          err instanceof Error ? err.message : undefined,
        ),
      })
    } finally {
      if (currentRequestId === requestId.current) {
        setFetching(false)
      }
    }
  }, [userId])

  useEffect(() => {
    if (!userId) {
      requestId.current += 1
      return
    }

    const timeoutId = setTimeout(() => {
      void loadSummary()
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      requestId.current += 1
    }
  }, [userId, loadSummary])

  return {
    summary,
    loading: Boolean(userId) && (fetching || !isCurrentUser),
    error,
    reload: loadSummary,
  }
}
