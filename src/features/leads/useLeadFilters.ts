import { useMemo, useState } from 'react'
import type { Lead } from './types'

export function useLeadFilters(leads: Lead[]) {
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('Todas')

  const filteredLeads = useMemo(() => {
    const term = search.toLowerCase().trim()

    return leads.filter((lead) => {
      const matchesSearch = [
        lead.name,
        lead.company ?? '',
        lead.email ?? '',
        lead.phone ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(term)

      return matchesSearch &&
        (stageFilter === 'Todas' || lead.stage === stageFilter)
    })
  }, [leads, search, stageFilter])

  function resetFilters() {
    setSearch('')
    setStageFilter('Todas')
  }

  return {
    search,
    setSearch,
    stageFilter,
    setStageFilter,
    filteredLeads,
    resetFilters,
  }
}
