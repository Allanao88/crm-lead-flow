import { useState } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { Session } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ContactsPage from './ContactsPage'
import type { Contact } from './types'
import { useContacts } from './useContacts'

const {
  mockSelectOrder,
  mockInsertSingle,
  mockDeleteSelect,
  mockDeleteEq,
  mockFrom,
} = vi.hoisted(() => {
  const selectOrder = vi.fn()
  const insertSingle = vi.fn()
  const deleteSelect = vi.fn()
  const deleteEq = vi.fn(() => ({ select: deleteSelect }))

  const from = vi.fn(() => ({
    select: vi.fn(() => ({ order: selectOrder })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({ single: insertSingle })),
    })),
    delete: vi.fn(() => ({ eq: deleteEq })),
  }))

  return {
    mockSelectOrder: selectOrder,
    mockInsertSingle: insertSingle,
    mockDeleteSelect: deleteSelect,
    mockDeleteEq: deleteEq,
    mockFrom: from,
  }
})

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}))

const mockSession = {
  user: { id: 'user-1', email: 'allan@empresa.com.br' },
} as Session

function ContactsHarness() {
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const { contacts, loading, saving, saveContact, deleteContact } = useContacts(
    mockSession,
    setError,
    setNotice,
  )

  return (
    <div>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <ContactsPage
        contacts={contacts}
        leads={[]}
        loading={loading}
        saving={saving}
        onSave={saveContact}
        onDelete={deleteContact}
        onError={setError}
        onNotice={setNotice}
      />
    </div>
  )
}

const sampleContact: Contact = {
  id: 10,
  name: 'Ana Costa',
  email: 'ana@cliente.com.br',
  phone: '(11) 98888-7777',
  company: 'Cliente S.A.',
  job_title: 'Diretora',
  notes: null,
  source: 'Indicação',
  lead_id: null,
  created_at: '2026-10-25T12:00:00Z',
  updated_at: '2026-10-25T12:00:00Z',
}

describe('useContacts e ContactsPage — criar e excluir contato (Fase 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSelectOrder.mockResolvedValue({ data: [], error: null })
  })

  it('cria um contato, abre confirmação com foco em Cancelar (Esc fecha) e exclui com sucesso', async () => {
    mockInsertSingle.mockResolvedValue({ data: sampleContact, error: null })
    mockDeleteSelect.mockResolvedValue({ data: [{ id: 10 }], error: null })

    render(<ContactsHarness />)

    await screen.findByText('Nenhum contato cadastrado')

    fireEvent.click(
      screen.getAllByRole('button', { name: '+ Novo contato' })[0],
    )
    fireEvent.change(screen.getByLabelText('Nome completo *'), {
      target: { value: 'Ana Costa' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar contato' }))

    expect(await screen.findByText('Ana Costa')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Contato cadastrado com sucesso.',
    )

    const row = screen.getByText('Ana Costa').closest('tr')!
    fireEvent.click(within(row).getByRole('button', { name: 'Excluir' }))

    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByText(
        'Excluir Ana Costa? Esta ação não pode ser desfeita.',
      ),
    ).toBeInTheDocument()

    const cancelButton = within(dialog).getByRole('button', {
      name: 'Cancelar',
    })
    expect(cancelButton).toHaveFocus()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mockDeleteEq).not.toHaveBeenCalled()

    fireEvent.click(within(row).getByRole('button', { name: 'Excluir' }))
    const reopenedDialog = await screen.findByRole('dialog')
    fireEvent.click(
      within(reopenedDialog).getByRole('button', { name: 'Excluir' }),
    )

    await waitFor(() => {
      expect(mockDeleteEq).toHaveBeenCalledWith('id', 10)
    })

    expect(screen.queryByText('Ana Costa')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Contato excluído com sucesso.',
    )
  })

  it('exibe mensagem clara em pt-BR quando houver violação de chave estrangeira (23503)', async () => {
    mockSelectOrder.mockResolvedValue({ data: [sampleContact], error: null })
    mockDeleteSelect.mockResolvedValue({
      data: null,
      error: {
        code: '23503',
        message:
          'update or delete on table "contacts" violates foreign key constraint',
      },
    })

    render(<ContactsHarness />)

    const nameCell = await screen.findByText('Ana Costa')
    const row = nameCell.closest('tr')!
    fireEvent.click(within(row).getByRole('button', { name: 'Excluir' }))

    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Excluir' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não é possível excluir este contato porque ele está vinculado a outros registros.',
    )
    expect(screen.getByText('Ana Costa')).toBeInTheDocument()
  })
})
