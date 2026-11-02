import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
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

type UseLeadSummaryResult = {
  summary: LeadStageSummary
  loading: boolean
  reload: () => Promise<void>
}

export function useLeadSummary(
  session: Session | null,
  setError?: Dispatch<SetStateAction<string>>,
): UseLeadSummaryResult {
  const userId = session?.user.id ?? null

  const [summaryState, setSummaryState] = useState<{
    userId: string | null
    summary: LeadStageSummary
  }>({
    userId: null,
    summary: createEmptyLeadSummary(),
  })

  const [fetching, setFetching] = useState(false)
  const requestId = useRef(0)

  const isCurrentUser = summaryState.userId === userId
  const summary = isCurrentUser
    ? summaryState.summary
    : createEmptyLeadSummary()

  const loadSummary = useCallback(async () => {
    if (!userId) return

    const currentRequestId = ++requestId.current
    setFetching(true)

    try {
      const { data, error } = await supabase.rpc('lead_stage_summary')

      if (currentRequestId !== requestId.current) return

      if (error) {
        setSummaryState((current) => ({
          userId,
          summary:
            current.userId === userId
              ? current.summary
              : createEmptyLeadSummary(),
        }))
        setError?.(
          `Não foi possível carregar o resumo comercial: ${error.message}`,
        )
        return
      }

      setSummaryState({
        userId,
        summary: buildLeadStageSummary(
          (data ?? []) as LeadStageSummaryRow[],
        ),
      })
    } catch (err) {
      if (currentRequestId !== requestId.current) return

      setSummaryState((current) => ({
        userId,
        summary:
          current.userId === userId
            ? current.summary
            : createEmptyLeadSummary(),
      }))
      setError?.(
        err instanceof Error
          ? `Não foi possível carregar o resumo comercial: ${err.message}`
          : 'Não foi possível carregar o resumo comercial.',
      )
    } finally {
      if (currentRequestId === requestId.current) {
        setFetching(false)
      }
    }
  }, [userId, setError])

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
    reload: loadSummary,
  }
}

