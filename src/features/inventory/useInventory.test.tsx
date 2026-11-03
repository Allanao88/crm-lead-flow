import { useState } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LeadProductsEditor from '../leads/LeadProductsEditor'
import InventoryPage from './InventoryPage'
import { useInventory } from './useInventory'

type DbProductRow = {
  id: number
  name: string
  sku: string | null
  description: string | null
  unit: string
  average_cost: number
  is_active: boolean
  created_at: string
  updated_at: string
}

const {
  getProductsDb,
  setProductsDb,
  mockProductUpdate,
  mockProductDelete,
  mockFrom,
} = vi.hoisted(() => {
  let productsDb: DbProductRow[] = []

  const productUpdate = vi.fn(
    (payload: { is_active?: boolean }) => ({
      eq: vi.fn((_col: string, id: number) => ({
        select: vi.fn(async () => {
          let updated = false
          productsDb = productsDb.map((item) => {
            if (item.id === id) {
              updated = true
              return {
                ...item,
                ...payload,
              }
            }
            return item
          })
          return {
            data: updated ? [{ id }] : [],
            error: null,
          }
        }),
      })),
    }),
  )

  const productDelete = vi.fn()

  const from = vi.fn((table: string) => {
    if (table === 'inventory_products') {
      return {
        select: vi.fn(() => ({
          order: vi.fn(async () => ({
            data: productsDb.map((item) => ({ ...item })),
            error: null,
          })),
        })),
        update: productUpdate,
        delete: productDelete,
      }
    }

    if (table === 'inventory_stock_balances') {
      return {
        select: vi.fn(async () => ({
          data: [
            { product_id: 1, quantity_on_hand: 12 },
            { product_id: 2, quantity_on_hand: 5 },
          ],
          error: null,
        })),
      }
    }

    if (table === 'inventory_movements') {
      return {
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(async () => ({
              data: [
                {
                  id: 101,
                  product_id: 1,
                  lead_id: null,
                  movement_type: 'entry',
                  quantity_delta: 12,
                  unit_cost: 500,
                  total_cost: 6000,
                  reason: 'Compra inicial lote A',
                  reference_movement_id: null,
                  created_at: '2026-10-25T14:00:00Z',
                },
              ],
              error: null,
            })),
          })),
        })),
      }
    }

    throw new Error(`Unexpected table: ${table}`)
  })

  return {
    getProductsDb: () => productsDb,
    setProductsDb: (rows: DbProductRow[]) => {
      productsDb = rows
    },
    mockProductUpdate: productUpdate,
    mockProductDelete: productDelete,
    mockFrom: from,
  }
})

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}))

function InventoryAndLeadProductsHarness() {
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const {
    products,
    movements,
    loading,
    saving,
    saveProduct,
    setProductActive,
    registerMovement,
    reverseMovement,
  } = useInventory('user-1', setError, setNotice)

  return (
    <div>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <InventoryPage
        products={products}
        movements={movements}
        loading={loading}
        saving={saving}
        onSaveProduct={saveProduct}
        onSetProductActive={setProductActive}
        onRegisterMovement={registerMovement}
        onReverseMovement={reverseMovement}
        onError={setError}
        onNotice={setNotice}
      />
      <div data-testid="lead-products-preview">
        <LeadProductsEditor
          products={products}
          items={[]}
          loading={false}
          loadError=""
          onQuantityChange={() => {}}
        />
      </div>
    </div>
  )
}

describe('Desativar e reativar produtos de estoque (Fase 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setProductsDb([
      {
        id: 1,
        name: 'Roteador Corporativo',
        sku: 'ROT-01',
        description: 'Dual WAN',
        unit: 'un',
        average_cost: 500,
        is_active: true,
        created_at: '2026-10-20T10:00:00Z',
        updated_at: '2026-10-20T10:00:00Z',
      },
      {
        id: 2,
        name: 'Switch Gerenciável',
        sku: 'SW-24',
        description: '24 portas PoE',
        unit: 'un',
        average_cost: 1000,
        is_active: true,
        created_at: '2026-10-20T10:00:00Z',
        updated_at: '2026-10-20T10:00:00Z',
      },
    ])
  })

  it('desativa com confirmação (sem DELETE), remove das seleções preservando saldo/histórico e reativa', async () => {
    render(<InventoryAndLeadProductsHarness />)

    const leadEditor = screen.getByTestId('lead-products-preview')

    // Ambos começam ativos na tabela e no editor de produtos do lead
    const routerRow = (
      await screen.findAllByText('Roteador Corporativo')
    )[0].closest('tr')!
    expect(within(routerRow).getByText('Disponível')).toBeInTheDocument()
    expect(within(routerRow).getByText('12 un')).toBeInTheDocument()
    expect(
      within(leadEditor).getByText('Roteador Corporativo'),
    ).toBeInTheDocument()
    expect(
      within(leadEditor).getByText('Switch Gerenciável'),
    ).toBeInTheDocument()

    // Abre confirmação de desativação: foco em Cancelar e Esc fecha
    fireEvent.click(within(routerRow).getByRole('button', { name: 'Desativar' }))
    const confirmDialog = await screen.findByRole('dialog')
    expect(
      within(confirmDialog).getByRole('button', { name: 'Cancelar' }),
    ).toHaveFocus()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mockProductUpdate).not.toHaveBeenCalled()

    // Confirma desativação
    fireEvent.click(within(routerRow).getByRole('button', { name: 'Desativar' }))
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Desativar',
      }),
    )

    await waitFor(() => {
      expect(getProductsDb()[0].is_active).toBe(false)
    })
    expect(mockProductUpdate).toHaveBeenCalledWith({ is_active: false })
    expect(mockProductDelete).not.toHaveBeenCalled()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Produto desativado com sucesso.',
    )

    // Continua na tabela de produtos com badge "Inativo" e saldo intacto
    const updatedRouterRow = screen
      .getByText('Roteador Corporativo')
      .closest('tr')!
    expect(within(updatedRouterRow).getByText('Inativo')).toBeInTheDocument()
    expect(within(updatedRouterRow).getByText('12 un')).toBeInTheDocument()
    expect(
      within(updatedRouterRow).getByRole('button', { name: 'Reativar' }),
    ).toBeInTheDocument()

    // Some do editor de produtos do lead
    expect(
      within(leadEditor).queryByText('Roteador Corporativo'),
    ).not.toBeInTheDocument()
    expect(
      within(leadEditor).getByText('Switch Gerenciável'),
    ).toBeInTheDocument()

    // Some do seletor de movimentação (+ Entrada)
    fireEvent.click(screen.getByRole('button', { name: '+ Entrada' }))
    const movementDialog = await screen.findByRole('dialog')
    const select = within(movementDialog).getByLabelText('Produto *')
    expect(select.textContent).not.toContain('Roteador Corporativo')
    expect(select.textContent).toContain('Switch Gerenciável')
    fireEvent.click(
      within(movementDialog).getByRole('button', { name: 'Cancelar' }),
    )

    // Continua visível no histórico de movimentações
    fireEvent.click(screen.getByRole('tab', { name: 'Movimentações' }))
    expect(
      await screen.findByText('Compra inicial lote A'),
    ).toBeInTheDocument()
    expect(screen.getByText('Roteador Corporativo')).toBeInTheDocument()

    // Volta para aba Produtos e reativa
    fireEvent.click(screen.getByRole('tab', { name: 'Produtos' }))
    const rowToReactivate = (
      await screen.findByText('Roteador Corporativo')
    ).closest('tr')!
    fireEvent.click(
      within(rowToReactivate).getByRole('button', { name: 'Reativar' }),
    )

    await waitFor(() => {
      expect(getProductsDb()[0].is_active).toBe(true)
    })
    expect(mockProductUpdate).toHaveBeenLastCalledWith({ is_active: true })
    expect(screen.getByRole('status')).toHaveTextContent(
      'Produto reativado com sucesso.',
    )

    // Volta ao normal na tabela, no editor do lead e no seletor de movimentação
    const reactivatedRow = (
      await screen.findAllByText('Roteador Corporativo')
    )[0].closest('tr')!
    expect(within(reactivatedRow).getByText('Disponível')).toBeInTheDocument()
    expect(
      within(leadEditor).getByText('Roteador Corporativo'),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '+ Entrada' }))
    const movementDialogAfter = await screen.findByRole('dialog')
    expect(
      within(movementDialogAfter).getByLabelText('Produto *').textContent,
    ).toContain('Roteador Corporativo')
  })
})
