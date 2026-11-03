import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { Session } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ContactsPage from '../contacts/ContactsPage'
import type { Contact } from '../contacts/types'
import { useContacts } from '../contacts/useContacts'
import LeadsPage from './LeadsPage'
import { LEAD_OPTIONS_MAX_LIMIT, useLeadOptions } from './useLeadOptions'
import { useLeads } from './useLeads'

type DbLead = {
  id: number
  name: string
  company: string | null
  email: string | null
  phone: string | null
  stage: string
  setup_value: number
  mrr_value: number
  archived_at: string | null
  created_at: string
  updated_at: string
}

const {
  setLeadsDb,
  setContactsDb,
  mockFrom,
  mockRpc,
} = vi.hoisted(() => {
  let leadsDb: DbLead[] = []
  let contactsDb: Contact[] = []

  const rpc = vi.fn(async (fnName: string, args: Record<string, unknown>) => {
    if (fnName === 'set_lead_archived') {
      const leadId = Number(args.p_lead_id)
      const archived = Boolean(args.p_archived)
      const target = leadsDb.find((l) => l.id === leadId)
      if (target) {
        target.archived_at = archived ? new Date().toISOString() : null
      }
      return { data: target, error: null }
    }
    if (fnName === 'save_lead') {
      const nextId = leadsDb.length + 1
      const newLead: DbLead = {
        id: nextId,
        name: String(args.p_name),
        company: (args.p_company as string) ?? null,
        email: null,
        phone: null,
        stage: 'Novo lead',
        setup_value: 0,
        mrr_value: 0,
        archived_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      leadsDb.push(newLead)
      return { data: newLead, error: null }
    }
    return { data: null, error: null }
  })

  const from = vi.fn((table: string) => {
    if (table === 'leads') {
      return {
        select: vi.fn(() => {
          let filtered = [...leadsDb]

          const builder = {
            is: vi.fn((col: string, val: unknown) => {
              if (col === 'archived_at' && val === null) {
                filtered = filtered.filter((l) => l.archived_at === null)
              }
              return builder
            }),
            not: vi.fn((col: string, op: string, val: unknown) => {
              if (col === 'archived_at' && op === 'is' && val === null) {
                filtered = filtered.filter((l) => l.archived_at !== null)
              }
              return builder
            }),
            eq: vi.fn((col: string, val: unknown) => {
              if (col === 'id') {
                filtered = filtered.filter((l) => l.id === Number(val))
              }
              if (col === 'stage') {
                filtered = filtered.filter((l) => l.stage === val)
              }
              return builder
            }),
            or: vi.fn(() => builder),
            order: vi.fn(() => builder),
            limit: vi.fn(async (lim: number) => {
              const slice = filtered.slice(0, lim)
              return {
                data: slice.map((l) => ({
                  id: l.id,
                  name: l.name,
                  company: l.company,
                })),
                error: null,
                count: filtered.length,
              }
            }),
            range: vi.fn(async (fromIdx: number, toIdx: number) => {
              const slice = filtered.slice(fromIdx, toIdx + 1)
              return {
                data: slice,
                error: null,
                count: filtered.length,
              }
            }),
            maybeSingle: vi.fn(async () => {
              const item = filtered[0]
              return {
                data: item ? { name: item.name } : null,
                error: null,
              }
            }),
          }

          return builder
        }),
      }
    }

    if (table === 'contacts') {
      return {
        select: vi.fn(() => ({
          order: vi.fn(async () => ({
            data: contactsDb.map((c) => ({ ...c })),
            error: null,
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => ({ data: contactsDb[0], error: null })),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(async () => ({ data: [{ id: 1 }], error: null })),
          })),
        })),
      }
    }

    throw new Error(`Unexpected table: ${table}`)
  })

  return {
    setLeadsDb: (rows: DbLead[]) => {
      leadsDb = rows
    },
    setContactsDb: (rows: Contact[]) => {
      contactsDb = rows
    },
    mockFrom: from,
    mockRpc: rpc,
  }
})

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    rpc: mockRpc,
  },
}))

const mockSession = {
  user: { id: 'user-contacts-leads-1', email: 'test@leadflow.com' },
} as Session

function IntegrationAppHarness() {
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [section, setSection] = useState<'contacts' | 'leads'>('contacts')

  const {
    leadOptions,
    reload: reloadLeadOptions,
    getLeadName,
  } = useLeadOptions(mockSession, setError, setNotice)

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
    loading: leadsLoading,
    saving: leadsSaving,
    handleStageChange,
    setLeadArchived,
  } = useLeads(mockSession, setError, setNotice, reloadLeadOptions)

  const {
    contacts,
    loading: contactsLoading,
    saving: contactsSaving,
    saveContact,
    deleteContact,
  } = useContacts(mockSession, setError, setNotice)

  return (
    <div>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <nav>
        <button onClick={() => setSection('contacts')}>Ir para Contatos</button>
        <button onClick={() => setSection('leads')}>Ir para Leads</button>
      </nav>

      {section === 'contacts' ? (
        <ContactsPage
          contacts={contacts}
          leadOptions={leadOptions}
          loading={contactsLoading}
          saving={contactsSaving}
          onSave={saveContact}
          onDelete={deleteContact}
          getLeadName={getLeadName}
          onError={setError}
          onNotice={setNotice}
        />
      ) : (
        <LeadsPage
          leads={leads}
          summary={{
            'Novo lead': { leadCount: 0, setupTotal: 0, mrrTotal: 0 },
            Qualificação: { leadCount: 0, setupTotal: 0, mrrTotal: 0 },
            Proposta: { leadCount: 0, setupTotal: 0, mrrTotal: 0 },
            Negociação: { leadCount: 0, setupTotal: 0, mrrTotal: 0 },
            Ganho: { leadCount: 0, setupTotal: 0, mrrTotal: 0 },
          }}
          summaryLoading={false}
          summaryError=""
          totalCount={totalCount}
          page={page}
          totalPages={totalPages}
          loading={leadsLoading}
          saving={leadsSaving}
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
      )}
    </div>
  )
}

describe('useLeadOptions e integração com ContactsPage (fix/seletor-leads-contatos)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setLeadsDb([])
    setContactsDb([])
  })

  it('exibe todos os leads ativos no seletor mesmo com mais de 50 leads e paginação na tela de leads', async () => {
    // Cria 65 leads (mais de 50, que é o tamanho da página da tela de Leads)
    const initialLeads: DbLead[] = Array.from({ length: 65 }, (_, i) => ({
      id: i + 1,
      name: `Lead Número ${String(i + 1).padStart(2, '0')}`,
      company: `Empresa ${i + 1}`,
      email: null,
      phone: null,
      stage: 'Novo lead',
      setup_value: 1000,
      mrr_value: 200,
      archived_at: null,
      created_at: new Date(2026, 0, i + 1).toISOString(),
      updated_at: new Date(2026, 0, i + 1).toISOString(),
    }))

    setLeadsDb(initialLeads)
    setContactsDb([
      {
        id: 1,
        name: 'Contato Teste',
        email: 'contato@teste.com',
        phone: null,
        company: 'Empresa Teste',
        job_title: null,
        notes: null,
        source: null,
        lead_id: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ])

    render(<IntegrationAppHarness />)

    // Abre o formulário de novo contato
    expect(await screen.findByText('Contato Teste')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '+ Novo contato' }))

    const dialog = await screen.findByRole('dialog')
    const leadSelect = within(dialog).getByLabelText('Lead relacionado')

    // Deve conter todas as 65 opções ativas + a opção padrão "Nenhum lead vinculado"
    const options = within(leadSelect).getAllByRole('option')
    expect(options).toHaveLength(66)

    // O lead 60 (que estaria na página 2 na tela de Leads) está presente no select
    expect(within(leadSelect).getByText('Lead Número 60 — Empresa 60')).toBeInTheDocument()
  })

  it('seletor de contatos NÃO é afetado por filtros aplicados na tela de Leads', async () => {
    const leadsData: DbLead[] = [
      {
        id: 1,
        name: 'Lead Alfa (Proposta)',
        company: 'Alfa SA',
        email: null,
        phone: null,
        stage: 'Proposta',
        setup_value: 1000,
        mrr_value: 200,
        archived_at: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 2,
        name: 'Lead Beta (Negociação)',
        company: 'Beta SA',
        email: null,
        phone: null,
        stage: 'Negociação',
        setup_value: 2000,
        mrr_value: 400,
        archived_at: null,
        created_at: '2026-01-02T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z',
      },
    ]

    setLeadsDb(leadsData)
    setContactsDb([])

    render(<IntegrationAppHarness />)

    // Vai para tela de Leads e aplica filtro de etapa "Proposta"
    fireEvent.click(screen.getByText('Ir para Leads'))
    expect(await screen.findByText('Lead Alfa (Proposta)')).toBeInTheDocument()
    expect(screen.getByText('Lead Beta (Negociação)')).toBeInTheDocument()

    const stageSelect = screen.getByLabelText('Filtrar por etapa')
    fireEvent.change(stageSelect, { target: { value: 'Proposta' } })

    // Na tela de Leads, agora só aparece Lead Alfa
    expect(await screen.findByText('Lead Alfa (Proposta)')).toBeInTheDocument()
    expect(screen.queryByText('Lead Beta (Negociação)')).not.toBeInTheDocument()

    // Volta para tela de Contatos e abre novo contato
    fireEvent.click(screen.getByText('Ir para Contatos'))
    const newContactButtons = await screen.findAllByRole('button', { name: '+ Novo contato' })
    fireEvent.click(newContactButtons[0])

    const dialog = await screen.findByRole('dialog')
    const leadSelect = within(dialog).getByLabelText('Lead relacionado')

    // AMBOS os leads ativos continuam no seletor, independente do filtro na tela de Leads
    expect(within(leadSelect).getByText('Lead Alfa (Proposta) — Alfa SA')).toBeInTheDocument()
    expect(within(leadSelect).getByText('Lead Beta (Negociação) — Beta SA')).toBeInTheDocument()
  })

  it('contato vinculado a lead arquivado continua exibindo o nome na tabela e na mensagem de exclusão', async () => {
    const leadsData: DbLead[] = [
      {
        id: 101,
        name: 'Lead Histórico Arquivado',
        company: 'Legado SA',
        email: null,
        phone: null,
        stage: 'Qualificação',
        setup_value: 0,
        mrr_value: 0,
        archived_at: '2026-02-01T00:00:00Z', // ARQUIVADO!
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-02-01T00:00:00Z',
      },
    ]

    setLeadsDb(leadsData)
    setContactsDb([
      {
        id: 50,
        name: 'Carlos Interlocutor',
        email: 'carlos@legado.com',
        phone: null,
        company: 'Legado SA',
        job_title: 'Gerente',
        notes: null,
        source: null,
        lead_id: 101, // vinculado ao lead arquivado
        created_at: '2026-01-10T00:00:00Z',
        updated_at: '2026-01-10T00:00:00Z',
      },
    ])

    render(<IntegrationAppHarness />)

    // O nome do lead arquivado deve ser resolvido e exibido na coluna "Lead relacionado"
    expect(await screen.findByText('Carlos Interlocutor')).toBeInTheDocument()
    expect(await screen.findByText('Lead Histórico Arquivado')).toBeInTheDocument()

    // Clica em excluir contato
    const row = screen.getByText('Carlos Interlocutor').closest('tr')!
    fireEvent.click(within(row).getByRole('button', { name: 'Excluir' }))

    // O diálogo de confirmação deve exibir o nome do lead vinculado (mesmo arquivado)
    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByText(
        'Excluir Carlos Interlocutor? Este contato está vinculado ao lead "Lead Histórico Arquivado"; o lead não será alterado. Esta ação não pode ser desfeita.',
      ),
    ).toBeInTheDocument()
  })

  it('emite aviso quando a contagem ultrapassa o limite de segurança de 1000', async () => {
    // Simula resposta com count = 1005 criando 1005 leads mockados
    const thousandLeads: DbLead[] = Array.from({ length: 1005 }, (_, i) => ({
      id: i + 1,
      name: `Lead ${i + 1}`,
      company: null,
      email: null,
      phone: null,
      stage: 'Novo lead',
      setup_value: 0,
      mrr_value: 0,
      archived_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    setLeadsDb(thousandLeads)

    render(<IntegrationAppHarness />)

    expect(await screen.findByRole('status')).toHaveTextContent(
      `A listagem de leads para vínculo atingiu o limite de segurança de ${LEAD_OPTIONS_MAX_LIMIT} registros.`,
    )
  })
})
