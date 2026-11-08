import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import BrandLogo from './BrandLogo'
import { getClientInitials } from '../config/brand'
import * as brandModule from '../config/brand'

describe('getClientInitials', () => {
  it('retorna duas letras para nomes com múltiplas palavras', () => {
    expect(getClientInitials('Sua empresa')).toBe('SE')
    expect(getClientInitials('Tech Solutions Ltda')).toBe('TS')
    expect(getClientInitials('Acme Corporation')).toBe('AC')
  })

  it('retorna até duas letras para nomes de uma palavra só', () => {
    expect(getClientInitials('Acme')).toBe('AC')
    expect(getClientInitials('A')).toBe('A')
  })

  it('retorna fallback "C" para strings vazias', () => {
    expect(getClientInitials('')).toBe('C')
    expect(getClientInitials('   ')).toBe('C')
  })
})

describe('BrandLogo', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renderiza avatar com iniciais quando logoUrl for nulo/ausente', () => {
    render(<BrandLogo />)
    const fallback = screen.getByRole('img', { name: brandModule.brand.clientName })
    expect(fallback).toBeInTheDocument()
    expect(fallback).toHaveTextContent(getClientInitials(brandModule.brand.clientName))
  })

  it('renderiza <img> quando logoUrl estiver definido', () => {
    vi.spyOn(brandModule, 'brand', 'get').mockReturnValue({
      clientName: 'Alpha Corp',
      logoUrl: 'https://example.com/logo.png',
      brandColor: '#007a29',
      contactEmail: null,
    })

    render(<BrandLogo alt="Alpha Corp" />)
    const img = screen.getByRole('img', { name: 'Alpha Corp' })
    expect(img).toBeInTheDocument()
    expect(img.tagName).toBe('IMG')
    expect(img).toHaveAttribute('src', 'https://example.com/logo.png')
  })

  it('faz fallback para avatar com iniciais caso <img> falhe ao carregar (onError)', () => {
    vi.spyOn(brandModule, 'brand', 'get').mockReturnValue({
      clientName: 'Beta Indústria',
      logoUrl: 'https://example.com/broken.png',
      brandColor: '#007a29',
      contactEmail: null,
    })

    render(<BrandLogo />)
    const img = screen.getByRole('img', { name: 'Beta Indústria' })
    expect(img.tagName).toBe('IMG')

    // Dispara onError
    fireEvent.error(img)

    const fallback = screen.getByRole('img', { name: 'Beta Indústria' })
    expect(fallback.tagName).toBe('DIV')
    expect(fallback).toHaveTextContent('BI')
  })
})
