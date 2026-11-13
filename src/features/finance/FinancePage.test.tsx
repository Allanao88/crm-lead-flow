import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Sidebar from '../../components/Sidebar'
import FinancePage from './FinancePage'
import type { FinanceClientMargin, FinanceSupplier, FinanceTotals, LeadCost } from './types'
import { useFinance } from './useFinance'

vi.mock('./useFinance', () => ({
  useFinance: vi.fn(),
}))

const mockTotals: FinanceTotals = {
  total_mrr: 10000,
  total_costs: 3000,
  total_margin: 7000,
  cost_percent: 30.0,
  clients_count: 2,
  clients_without_costs: 0,
}

const mockClients: FinanceClientMargin[] = [
  {
    lead_id: 1,
    lead_name: 'Empresa Alfa',
    company: 'Alfa Corp',
    mrr_value: 6000,
    total_costs: 1500,
    net_margin: 4500,
    cost_percent: 25.0,
    cost_count: 1,
  },
  {
    lead_id: 2,
    lead_name: 'Empresa Beta',
    company: 'Beta S.A.',
    mrr_value: 4000,
    total_costs: 1500,
    net_margin: 2500,
    cost_percent: 37.5,
    cost_count: 1,
  },
]

const mockSuppliers: FinanceSupplier[] = [
  { id: 1, name: 'Vercel' },
  { id: 2, name: 'AWS' },
]

const mockCosts: LeadCost[] = [
  {
    id: 101,
    lead_id: 1,
    supplier_id: 1,
    amount_monthly: 1500,
    note: 'Hospedagem Pro',
    created_at: '2026-11-01T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
    supplier: { id: 1, name: 'Vercel' },
  },
  {
    id: 102,
    lead_id: 2,
    supplier_id: 2,
    amount_monthly: 1500,
    note: 'RDS Postgres',
    created_at: '2026-11-01T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
    supplier: { id: 2, name: 'AWS' },
  },
]

describe('FinancePage (integração)', () => {
  const onBackToOverview = vi.fn()
  const onError = vi.fn()
  const onNotice = vi.fn()
  const reload = vi.fn().mockResolvedValue(undefined)
  const addCost = vi.fn().mockResolvedValue(true)
  const updateCost = vi.fn().mockResolvedValue(true)
  const deleteCost = vi.fn().mockResolvedValue(true)

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useFinance).mockReturnValue({
      clients: mockClients,
      totals: mockTotals,
      suppliers: mockSuppliers,
      costs: mockCosts,
      loading: false,
      saving: false,
      reload,
      addCost,
      updateCost,
      deleteCost,
    })
  })

  it('renderiza cards de totais e clientes e permite expandir custos', () => {
    render(
      <FinancePage
        isAdmin={true}
        userId="user-admin"
        onBackToOverview={onBackToOverview}
        onError={onError}
        onNotice={onNotice}
      />,
    )

    expect(
      screen.getByRole('heading', { level: 2, name: 'Margens por Cliente' }),
    ).toBeInTheDocument()

    const metricsSection = screen.getByRole('region', { name: 'Métricas financeiras gerais' })
    expect(within(metricsSection).getByText('MRR Total')).toBeInTheDocument()
    expect(within(metricsSection).getByText('Custos Totais')).toBeInTheDocument()
    expect(within(metricsSection).getByText('Margem Líquida')).toBeInTheDocument()
    expect(within(metricsSection).getByText('% de Custo Geral')).toBeInTheDocument()
    expect(within(metricsSection).getByText('30,0%')).toBeInTheDocument()

    expect(screen.getByText('Empresa Alfa')).toBeInTheDocument()
    expect(screen.getByText('Empresa Beta')).toBeInTheDocument()

    // Expandir custos de Empresa Alfa
    const expandButton = screen.getByRole('button', { name: /Empresa Alfa/i })
    fireEvent.click(expandButton)

    expect(screen.getByText('Hospedagem Pro')).toBeInTheDocument()
    expect(screen.getByText('Vercel')).toBeInTheDocument()
  })

  it('MRR = 0 exibe "—" no percentual geral e de cliente', () => {
    vi.mocked(useFinance).mockReturnValue({
      clients: [
        {
          lead_id: 3,
          lead_name: 'Cliente MRR Zero',
          company: null,
          mrr_value: 0,
          total_costs: 300,
          net_margin: -300,
          cost_percent: null,
          cost_count: 1,
        },
      ],
      totals: {
        total_mrr: 0,
        total_costs: 300,
        total_margin: -300,
        cost_percent: null,
        clients_count: 1,
        clients_without_costs: 0,
      },
      suppliers: mockSuppliers,
      costs: [],
      loading: false,
      saving: false,
      reload,
      addCost,
      updateCost,
      deleteCost,
    })

    render(
      <FinancePage
        isAdmin={true}
        userId="user-admin"
        onBackToOverview={onBackToOverview}
        onError={onError}
        onNotice={onNotice}
      />,
    )

    const metricsSection = screen.getByRole('region', { name: 'Métricas financeiras gerais' })
    expect(within(metricsSection).getByText('—')).toBeInTheDocument()
    expect(screen.getByText('Cliente MRR Zero')).toBeInTheDocument()
  })

  it('cliente sem custos exibe aviso e custo 0', () => {
    vi.mocked(useFinance).mockReturnValue({
      clients: [
        {
          lead_id: 4,
          lead_name: 'Cliente Sem Custo',
          company: null,
          mrr_value: 2000,
          total_costs: 0,
          net_margin: 2000,
          cost_percent: 0,
          cost_count: 0,
        },
      ],
      totals: {
        total_mrr: 2000,
        total_costs: 0,
        total_margin: 2000,
        cost_percent: 0,
        clients_count: 1,
        clients_without_costs: 1,
      },
      suppliers: mockSuppliers,
      costs: [],
      loading: false,
      saving: false,
      reload,
      addCost,
      updateCost,
      deleteCost,
    })

    render(
      <FinancePage
        isAdmin={true}
        userId="user-admin"
        onBackToOverview={onBackToOverview}
        onError={onError}
        onNotice={onNotice}
      />,
    )

    expect(
      screen.getByText('1 cliente ativo ainda não tem custos cadastrados.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Sem custos cadastrados')).toBeInTheDocument()
  })

  it('adicionar custo abre modal e chama mutate (addCost)', async () => {
    render(
      <FinancePage
        isAdmin={true}
        userId="user-admin"
        onBackToOverview={onBackToOverview}
        onError={onError}
        onNotice={onNotice}
      />,
    )

    // Expandir custos de Empresa Alfa
    fireEvent.click(screen.getByRole('button', { name: /Empresa Alfa/i }))

    const addButton = screen.getByRole('button', {
      name: '+ Adicionar custo',
    })
    fireEvent.click(addButton)

    expect(screen.getByRole('heading', { level: 2, name: 'Adicionar custo mensal' })).toBeInTheDocument()

    const supplierInput = screen.getByLabelText(/Fornecedor/i)
    const amountInput = screen.getByLabelText(/Valor mensal/i)
    const noteInput = screen.getByLabelText(/Observação/i)

    fireEvent.change(supplierInput, { target: { value: 'Google Cloud' } })
    fireEvent.change(amountInput, { target: { value: '250,50' } })
    fireEvent.change(noteInput, { target: { value: 'BigQuery e Cloud Run' } })

    const saveButton = screen.getByRole('button', { name: 'Adicionar custo' })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(addCost).toHaveBeenCalledWith(1, {
        supplierName: 'Google Cloud',
        amountMonthly: 250.5,
        note: 'BigQuery e Cloud Run',
      })
    })
  })

  it('excluir custo abre diálogo de confirmação e chama deleteCost', async () => {
    render(
      <FinancePage
        isAdmin={true}
        userId="user-admin"
        onBackToOverview={onBackToOverview}
        onError={onError}
        onNotice={onNotice}
      />,
    )

    // Expandir custos de Empresa Alfa
    fireEvent.click(screen.getByRole('button', { name: /Empresa Alfa/i }))

    const deleteButton = screen.getByRole('button', {
      name: 'Excluir custo de Vercel',
    })
    fireEvent.click(deleteButton)

    expect(screen.getByRole('heading', { level: 2, name: 'Excluir custo' })).toBeInTheDocument()

    const confirmButton = screen.getByRole('button', { name: 'Excluir custo' })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(deleteCost).toHaveBeenCalledWith(101)
    })
  })

  it('usuário não-admin exibe tela de acesso restrito com botão de retorno', () => {
    render(
      <FinancePage
        isAdmin={false}
        userId="user-regular"
        onBackToOverview={onBackToOverview}
        onError={onError}
        onNotice={onNotice}
      />,
    )

    expect(screen.getByRole('heading', { level: 2, name: 'Acesso restrito' })).toBeInTheDocument()
    expect(
      screen.getByText('Esta área é restrita a administradores.'),
    ).toBeInTheDocument()

    const backButton = screen.getByRole('button', { name: 'Voltar à Visão Geral' })
    fireEvent.click(backButton)

    expect(onBackToOverview).toHaveBeenCalledTimes(1)
  })

  it('menu de navegação Sidebar exibe Financeiro apenas para administradores', () => {
    const { rerender } = render(
      <Sidebar
        isAdmin={false}
        userEmail="teste@exemplo.com"
        onLogout={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: /Financeiro/i })).not.toBeInTheDocument()

    rerender(
      <Sidebar
        isAdmin={true}
        userEmail="teste@exemplo.com"
        onLogout={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /Financeiro/i })).toBeInTheDocument()
  })
})
