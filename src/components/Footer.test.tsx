import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Footer from './Footer'
import * as brandModule from '../config/brand'

describe('Footer', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renderiza o nome do produto e da empresa padrão sem email de contato', () => {
    vi.spyOn(brandModule, 'brand', 'get').mockReturnValue({
      clientName: 'Sua empresa',
      logoUrl: null,
      brandColor: '#007a29',
      contactEmail: null,
    })

    render(<Footer />)
    expect(screen.getByText('LeadFlow CRM · Sua empresa')).toBeInTheDocument()
    expect(screen.queryByText(/Precisa de ajuda\?/i)).not.toBeInTheDocument()
  })

  it('exibe link mailto quando contactEmail estiver configurado', () => {
    vi.spyOn(brandModule, 'brand', 'get').mockReturnValue({
      clientName: 'Empresa XPTO',
      logoUrl: null,
      brandColor: '#007a29',
      contactEmail: 'suporte@xpto.com.br',
    })

    render(<Footer />)
    expect(screen.getByText('LeadFlow CRM · Empresa XPTO')).toBeInTheDocument()
    const emailLink = screen.getByRole('link', { name: 'suporte@xpto.com.br' })
    expect(emailLink).toBeInTheDocument()
    expect(emailLink).toHaveAttribute('href', 'mailto:suporte@xpto.com.br')
  })
})
