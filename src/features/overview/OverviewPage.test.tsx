import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { currency } from '../leads/constants'
import type { LeadStageSummary } from '../leads/types'
import { createEmptyLeadSummary } from '../leads/useLeadSummary'
import OverviewPage from './OverviewPage'

const mockedSummary: LeadStageSummary = {
  'Novo lead': { leadCount: 50, setupTotal: 10000, mrrTotal: 2000 },
  Qualificação: { leadCount: 0, setupTotal: 0, mrrTotal: 0 },
  Proposta: { leadCount: 35, setupTotal: 25000, mrrTotal: 4500 },
  Negociação: { leadCount: 20, setupTotal: 15000, mrrTotal: 3000 },
  Ganho: { leadCount: 15, setupTotal: 12000, mrrTotal: 2800 },
}

describe('OverviewPage', () => {
  it('renderiza indicadores comerciais e pipeline a partir do resumo mockado', () => {
    const onOpenLeads = vi.fn()

    render(
      <OverviewPage
        summary={mockedSummary}
        contactsCount={42}
        companiesCount={18}
        loading={false}
        onOpenLeads={onOpenLeads}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Resumo comercial' }),
    ).toBeInTheDocument()

    const metricsSection = screen.getByRole('region', {
      name: 'Indicadores comerciais',
    })

    expect(within(metricsSection).getByText('Total de leads')).toBeInTheDocument()
    expect(within(metricsSection).getByText('120')).toBeInTheDocument()
    expect(within(metricsSection).getByText('105')).toBeInTheDocument()
    expect(within(metricsSection).getByText('15')).toBeInTheDocument()
    expect(within(metricsSection).getByText('42')).toBeInTheDocument()
    expect(within(metricsSection).getByText('18')).toBeInTheDocument()
    expect(
      within(metricsSection).getByText(currency(50000), {
        collapseWhitespace: false,
      }),
    ).toBeInTheDocument()
    expect(
      within(metricsSection).getByText(currency(9500), {
        collapseWhitespace: false,
      }),
    ).toBeInTheDocument()
    expect(
      within(metricsSection).getByText(currency(12000), {
        collapseWhitespace: false,
      }),
    ).toBeInTheDocument()
    expect(
      within(metricsSection).getByText(currency(2800), {
        collapseWhitespace: false,
      }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Acessar leads' }))
    expect(onOpenLeads).toHaveBeenCalledTimes(1)
  })

  it('exibe alerta de erro e aciona tentativa novamente sem mostrar zeros falsos', () => {
    const onRetry = vi.fn()

    render(
      <OverviewPage
        summary={createEmptyLeadSummary()}
        contactsCount={0}
        companiesCount={0}
        loading={false}
        summaryError="Não foi possível carregar o resumo comercial."
        onRetrySummary={onRetry}
        onOpenLeads={vi.fn()}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível carregar o resumo comercial.',
    )
    expect(screen.queryByText(/R\$\s*0,00/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
