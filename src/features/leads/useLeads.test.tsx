import { useState } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { Session } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LeadsPage from './LeadsPage'
import type { Stage } from './types'
import { useLeads } from './useLeads'

type DbLeadRow = {
  id: number
  name: string
  email: string | null
  phone: string | null
  company: string | null
  stage: Stage
  setup_value: number
  mrr_value: number
  archived_at: string | null
  created_at: string
  updated_at: string
}

const {
  getLeadsDb,
  setLeadsDb,
  mockRpc,
  mockFrom,
} = vi.hoisted(() => {
  let leadsDb: DbLeadRow[] = []

  const rpc = vi.fn(async (fnName: string, args: Record<string, unknown>) => {
    if (fnName === 'set_lead_archived') {
      const leadId = Number(args.p_lead_id)
      const archived = Boolean(args.p_archived)

      const target = leadsDb.find((lead) => lead.id === leadId)
      if (!target) {
        return { data: null, error: { message: 'Lead não encontrado.' } }
      }

      if (archived) {
        if (target.stage === 'Ganho') {
          return {
            data: null,
            error: {
              message:
                'Não é possível arquivar um lead na etapa "Ganho" com movimentações de estoque. Reabra o lead para outra etapa antes de arquivar.',
            },
          }
        }
        target.archived_at = '2026-11-02T22:00:00Z'
      } else {
        target.archived_at = null
      }

      return { data: { ...target }, error: null }
    }

    if (fnName === 'lead_stage_summary') {
      const activeLeads = leadsDb.filter((lead) => lead.archived_at === null)
      const summaryMap = new Map<string, { count: number; setup: number; mrr: number }>()

      for (const lead of activeLeads) {
        const current = summaryMap.get(lead.stage) ?? { count: 0, setup: 0, mrr: 0 }
        summaryMap.set(lead.stage, {
          count: current.count + 1,
          setup: current.setup + lead.setup_value,
          mrr: current.mrr + lead.mrr_value,
        })
      }

      const rows = Array.from(summaryMap.entries()).map(([stage, val]) => ({
        stage,
        lead_count: val.count,
        setup_total: val.setup,
        mrr_total: val.mrr,
      }))

      return { data: rows, error: null }
    }

    throw new Error(`Unexpected RPC: ${fnName}`)
  })

  const from = vi.fn((table: string) => {
    if (table === 'leads') {
      return {
        select: vi.fn(() => {
          let filtered = [...leadsDb]

          const builder = {
            is: vi.fn((col: string, val: unknown) => {
              if (col === 'archived_at' && val === null) {
                filtered = filtered.filter((item) => item.archived_at === null)
              }
              return builder
            }),
            not: vi.fn((col: string, op: string, val: unknown) => {
              if (col === 'archived_at' && op === 'is' && val === null) {
                filtered = filtered.filter((item) => item.archived_at !== null)
              }
              return builder
            }),
            eq: vi.fn((col: string, val: unknown) => {
              if (col === 'stage') {
                filtered = filtered.filter((item) => item.stage === val)
              }
              return builder
            }),
            or: vi.fn(() => builder),
            order: vi.fn(() => builder),
            range: vi.fn(async (fromIdx: number, toIdx: number) => {
              const slice = filtered.slice(fromIdx, toIdx + 1)
              return {
                data: slice.map((item) => ({ ...item })),
                error: null,
                count: filtered.length,
              }
            }),
          }

          return builder
        }),
      }
    }

    throw new Error(`Unexpected table: ${table}`)
  })

  return {
    getLeadsDb: () => leadsDb,
    setLeadsDb: (rows: DbLeadRow[]) => {
      leadsDb = rows
    },
    mockRpc: rpc,
    mockFrom: from,
  }
})

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    rpc: mockRpc,
  },
}))

const mockSession = {
  user: { id: 'user-leads-1', email: 'allan@leadflow.com' },
} as Session

function LeadsFeatureHarness({ onReloadSummary }: { onReloadSummary?: () => void }) {
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const {
    leads,
    totalCount,
    page,
    totalPages,
    setPage,
    search,
    setSearch,
    stageFilter,
    setStageFilter,
    showArchived,
    setShowArchived,
    resetFilters,
    loading,
    saving,
    handleStageChange,
    setLeadArchived,
  } = useLeads(mockSession, setError, setNotice, onReloadSummary)

  const emptySummary = {
    'Novo lead': { leadCount: 0, setupTotal: 0, mrrTotal: 0 },
    Qualificação: { leadCount: 0, setupTotal: 0, mrrTotal: 0 },
    Proposta: { leadCount: 0, setupTotal: 0, mrrTotal: 0 },
    Negociação: { leadCount: 0, setupTotal: 0, mrrTotal: 0 },
    Ganho: { leadCount: 0, setupTotal: 0, mrrTotal: 0 },
  }

  return (
    <div>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <LeadsPage
        leads={leads}
        summary={emptySummary}
        summaryLoading={false}
        summaryError=""
        totalCount={totalCount}
        page={page}
        totalPages={totalPages}
        loading={loading}
        saving={saving}
        search={search}
        stageFilter={stageFilter}
        showArchived={showArchived}
        form={{
          name: '',
          email: '',
          phone: '',
          company: '',
          stage: 'Novo lead',
          setup_value: '',
          mrr_value: '',
        }}
        showForm={false}
        editingLeadId={null}
        products={[]}
        productItems={[]}
        productsLoading={false}
        productsError=""
        error={error}
        onSearchChange={setSearch}
        onStageFilterChange={setStageFilter}
        onShowArchivedChange={setShowArchived}
        onFormChange={() => {}}
        onSubmit={() => {}}
        onCreateLead={() => {}}
        onCancelForm={() => {}}
        onQuantityChange={() => {}}
        onEditLead={() => {}}
        onStageChange={handleStageChange}
        onSetLeadArchived={setLeadArchived}
        onClearFilters={resetFilters}
        onPageChange={setPage}
        onSelectStage={() => {}}
        onRetrySummary={() => {}}
      />
    </div>
  )
}

describe('Arquivamento e restauração de leads (Fase 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setLeadsDb([
      {
        id: 1,
        name: 'Lead Ativo Alpha',
        email: 'alpha@empresa.com',
        phone: '11999990001',
        company: 'Alpha Corp',
        stage: 'Qualificação',
        setup_value: 5000,
        mrr_value: 1200,
        archived_at: null,
        created_at: '2026-10-20T10:00:00Z',
        updated_at: '2026-10-20T10:00:00Z',
      },
      {
        id: 2,
        name: 'Lead Ganho Beta',
        email: 'beta@empresa.com',
        phone: '11999990002',
        company: 'Beta Corp',
        stage: 'Ganho',
        setup_value: 15000,
        mrr_value: 3500,
        archived_at: null,
        created_at: '2026-10-22T10:00:00Z',
        updated_at: '2026-10-22T10:00:00Z',
      },
    ])
  })

  it('carrega por padrão apenas não arquivados e arquiva lead ativo via modal de confirmação recarregando resumo', async () => {
    const onReloadSummary = vi.fn()
    render(<LeadsFeatureHarness onReloadSummary={onReloadSummary} />)

    // Ambos começam visíveis na lista padrão ativa
    expect(await screen.findByText('Lead Ativo Alpha')).toBeInTheDocument()
    expect(screen.getByText('Lead Ganho Beta')).toBeInTheDocument()
    expect(screen.getByText('2 resultado(s)')).toBeInTheDocument()

    const alphaRow = screen.getByText('Lead Ativo Alpha').closest('tr')!
    const archiveBtn = within(alphaRow).getByRole('button', { name: 'Arquivar' })

    // Abre modal de confirmação
    fireEvent.click(archiveBtn)
    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByText(
        'Deseja arquivar o lead "Lead Ativo Alpha"? Ele deixará de ser contabilizado no funil e nos indicadores comerciais, mas poderá ser visualizado e restaurado a qualquer momento.',
      ),
    ).toBeInTheDocument()

    // Cancelar focado inicialmente e Esc fecha sem chamar RPC
    const cancelBtn = within(dialog).getByRole('button', { name: 'Cancelar' })
    expect(cancelBtn).toHaveFocus()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mockRpc).not.toHaveBeenCalledWith('set_lead_archived', expect.anything())

    // Confirma arquivamento
    fireEvent.click(archiveBtn)
    const confirmDialog = await screen.findByRole('dialog')
    fireEvent.click(
      within(confirmDialog).getByRole('button', { name: 'Arquivar' }),
    )

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('set_lead_archived', {
        p_lead_id: 1,
        p_archived: true,
      })
    })

    expect(screen.getByRole('status')).toHaveTextContent(
      'Lead arquivado com sucesso.',
    )
    expect(onReloadSummary).toHaveBeenCalled()

    // O lead arquivado desaparece da lista ativa padrão
    await waitFor(() => {
      expect(screen.queryByText('Lead Ativo Alpha')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Lead Ganho Beta')).toBeInTheDocument()
    expect(screen.getByText('1 resultado(s)')).toBeInTheDocument()
  })

  it('exibe erro claro em pt-BR da RPC ao tentar arquivar lead Ganho com movimentações', async () => {
    render(<LeadsFeatureHarness />)

    expect(await screen.findByText('Lead Ganho Beta')).toBeInTheDocument()
    const betaRow = screen.getByText('Lead Ganho Beta').closest('tr')!

    fireEvent.click(within(betaRow).getByRole('button', { name: 'Arquivar' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Arquivar' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Não é possível arquivar um lead na etapa "Ganho" com movimentações de estoque. Reabra o lead para outra etapa antes de arquivar.',
      )
    })

    // Lead continua ativo na lista
    expect(screen.getByText('Lead Ganho Beta')).toBeInTheDocument()
  })

  it('permite filtrar por "Mostrar arquivados", exibe badge e permite restaurar', async () => {
    // Inicializa com um lead já arquivado
    getLeadsDb()[0].archived_at = '2026-11-01T12:00:00Z'

    const onReloadSummary = vi.fn()
    render(<LeadsFeatureHarness onReloadSummary={onReloadSummary} />)

    // Inicialmente na lista ativa: apenas Lead Ganho Beta aparece
    expect(await screen.findByText('Lead Ganho Beta')).toBeInTheDocument()
    expect(screen.queryByText('Lead Ativo Alpha')).not.toBeInTheDocument()

    // Marca o checkbox "Mostrar arquivados"
    const checkbox = screen.getByLabelText('Mostrar arquivados')
    fireEvent.click(checkbox)

    // Agora lista somente arquivados
    expect(await screen.findByText('Lead Ativo Alpha')).toBeInTheDocument()
    expect(screen.queryByText('Lead Ganho Beta')).not.toBeInTheDocument()

    const alphaRow = screen.getByText('Lead Ativo Alpha').closest('tr')!
    expect(within(alphaRow).getByText('Arquivado')).toBeInTheDocument()

    // Lead arquivado não tem link de edição nem select de etapa ativo
    expect(within(alphaRow).queryByRole('button', { name: 'Editar lead' })).not.toBeInTheDocument()
    expect(within(alphaRow).queryByRole('combobox')).not.toBeInTheDocument()

    // Ação "Restaurar" com confirmação
    fireEvent.click(within(alphaRow).getByRole('button', { name: 'Restaurar' }))
    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByText(
        'Deseja restaurar o lead "Lead Ativo Alpha"? Ele voltará para a lista ativa e para os cálculos do pipeline comercial.',
      ),
    ).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Restaurar' }))

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('set_lead_archived', {
        p_lead_id: 1,
        p_archived: false,
      })
    })

    expect(screen.getByRole('status')).toHaveTextContent(
      'Lead restaurado com sucesso.',
    )
    expect(onReloadSummary).toHaveBeenCalled()

    // Ao ser restaurado, ele sai da lista de arquivados
    await waitFor(() => {
      expect(screen.queryByText('Lead Ativo Alpha')).not.toBeInTheDocument()
    })

    // Desmarca "Mostrar arquivados" para voltar para os ativos
    fireEvent.click(checkbox)
    expect(await screen.findByText('Lead Ativo Alpha')).toBeInTheDocument()
    expect(screen.getByText('Lead Ganho Beta')).toBeInTheDocument()
  })
})
