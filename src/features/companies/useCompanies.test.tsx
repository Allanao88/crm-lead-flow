import { useState } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { Session } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CompaniesPage from './CompaniesPage'
import type { Company } from './types'
import { useCompanies } from './useCompanies'

const {
  mockSelectOrder,
  mockInsertSingle,
  mockDeleteSelect,
  mockDeleteEqUser,
  mockDeleteEqId,
  mockFrom,
} = vi.hoisted(() => {
  const selectOrder = vi.fn()
  const insertSingle = vi.fn()
  const deleteSelect = vi.fn()
  const deleteEqUser = vi.fn(() => ({ select: deleteSelect }))
  const deleteEqId = vi.fn(() => ({ eq: deleteEqUser }))

  const from = vi.fn(() => ({
    select: vi.fn(() => ({ order: selectOrder })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({ single: insertSingle })),
    })),
    delete: vi.fn(() => ({ eq: deleteEqId })),
  }))

  return {
    mockSelectOrder: selectOrder,
    mockInsertSingle: insertSingle,
    mockDeleteSelect: deleteSelect,
    mockDeleteEqUser: deleteEqUser,
    mockDeleteEqId: deleteEqId,
    mockFrom: from,
  }
})

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}))

const mockSession = {
  user: { id: 'user-owner', email: 'allan@empresa.com.br' },
} as Session

function CompaniesHarness() {
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const { companies, loading, saving, saveCompany, deleteCompany } =
    useCompanies(mockSession, setError, setNotice)

  return (
    <div>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <CompaniesPage
        companies={companies}
        loading={loading}
        saving={saving}
        onSave={saveCompany}
        onDelete={deleteCompany}
        onError={setError}
        onNotice={setNotice}
      />
    </div>
  )
}

const sampleCompany: Company = {
  id: 25,
  user_id: 'user-owner',
  name: 'Tech Solutions Ltda',
  cnpj: '12.345.678/0001-90',
  website: 'https://techsolutions.com.br',
  email: 'contato@techsolutions.com.br',
  phone: '(11) 3000-0000',
  industry: 'Tecnologia',
  address: null,
  notes: null,
  created_at: '2026-10-25T12:00:00Z',
  updated_at: '2026-10-25T12:00:00Z',
}

describe('useCompanies e CompaniesPage — criar e excluir empresa (Fase 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSelectOrder.mockResolvedValue({ data: [], error: null })
  })

  it('cria e exclui empresa escopando por user_id, com foco em Cancelar e fechamento via Esc', async () => {
    mockInsertSingle.mockResolvedValue({ data: sampleCompany, error: null })
    mockDeleteSelect.mockResolvedValue({ data: [{ id: 25 }], error: null })

    render(<CompaniesHarness />)

    await screen.findByText('Nenhuma empresa cadastrada')

    fireEvent.click(
      screen.getAllByRole('button', { name: '+ Nova empresa' })[0],
    )
    fireEvent.change(screen.getByLabelText('Nome da empresa *'), {
      target: { value: 'Tech Solutions Ltda' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar empresa' }))

    expect(await screen.findByText('Tech Solutions Ltda')).toBeInTheDocument()

    const row = screen.getByText('Tech Solutions Ltda').closest('tr')!
    fireEvent.click(within(row).getByRole('button', { name: 'Excluir' }))

    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByText(
        'Excluir Tech Solutions Ltda? Contatos e leads com este nome de empresa não serão alterados. Esta ação não pode ser desfeita.',
      ),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByRole('button', { name: 'Cancelar' }),
    ).toHaveFocus()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(within(row).getByRole('button', { name: 'Excluir' }))
    const reopenedDialog = await screen.findByRole('dialog')
    fireEvent.click(
      within(reopenedDialog).getByRole('button', { name: 'Excluir' }),
    )

    await waitFor(() => {
      expect(mockDeleteEqId).toHaveBeenCalledWith('id', 25)
      expect(mockDeleteEqUser).toHaveBeenCalledWith('user_id', 'user-owner')
    })

    expect(screen.queryByText('Tech Solutions Ltda')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Empresa excluída com sucesso.',
    )
  })

  it('exibe erro claro quando houver vínculo de chave estrangeira ou bloqueio por RLS (0 linhas)', async () => {
    mockSelectOrder.mockResolvedValue({ data: [sampleCompany], error: null })
    mockDeleteSelect.mockResolvedValueOnce({
      data: null,
      error: {
        code: '23503',
        message: 'violates foreign key constraint',
      },
    })

    render(<CompaniesHarness />)

    const nameCell = await screen.findByText('Tech Solutions Ltda')
    const row = nameCell.closest('tr')!
    fireEvent.click(within(row).getByRole('button', { name: 'Excluir' }))
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Excluir',
      }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não é possível excluir esta empresa porque ela está vinculada a outros registros.',
    )
    expect(screen.getByText('Tech Solutions Ltda')).toBeInTheDocument()

    // Simula RLS negando exclusão de registro de outro usuário (0 linhas afetadas)
    mockDeleteSelect.mockResolvedValueOnce({ data: [], error: null })
    fireEvent.click(within(row).getByRole('button', { name: 'Excluir' }))
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Excluir',
      }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível excluir a empresa: registro não encontrado ou sem permissão.',
    )
    expect(screen.getByText('Tech Solutions Ltda')).toBeInTheDocument()
  })
})
