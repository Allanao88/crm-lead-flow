import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getRelativeLuminance,
  getContrastRatio,
  getBestTextColor,
  adjustBrightness,
  lightenUntilContrast,
  createBrandTokens,
  buildThemeCss,
  applyBrandTheme,
  DEFAULT_BRAND_COLOR,
  DARK_CANVAS_BG,
} from './brandTheme'

describe('Cálculo de luminância e contraste WCAG 2.1 (6 cores representativas)', () => {
  const testColors = [
    { name: 'clara', hex: '#f8fafc', expectedRange: [0.9, 1.0] },
    { name: 'escura', hex: '#0f172a', expectedRange: [0.0, 0.05] },
    { name: 'saturada', hex: '#ff0055', expectedRange: [0.2, 0.35] },
    { name: 'cinza', hex: '#64748b', expectedRange: [0.15, 0.25] },
    { name: 'amarela', hex: '#facc15', expectedRange: [0.6, 0.75] },
    { name: 'azul', hex: '#2563eb', expectedRange: [0.1, 0.25] },
  ]

  it.each(testColors)(
    'calcula luminância correta para cor $name ($hex)',
    ({ hex, expectedRange }) => {
      const lum = getRelativeLuminance(hex)
      expect(lum).toBeGreaterThanOrEqual(expectedRange[0])
      expect(lum).toBeLessThanOrEqual(expectedRange[1])
    },
  )

  it('calcula contraste simétrico entre duas cores (ratio >= 1.0 e <= 21.0)', () => {
    testColors.forEach(({ hex }) => {
      // Contraste consigo mesmo é sempre 1.0:1
      expect(getContrastRatio(hex, hex)).toBeCloseTo(1.0, 1)

      // Contraste é comutativo: ratio(A, B) == ratio(B, A)
      const ratioWhite = getContrastRatio(hex, '#ffffff')
      const ratioWhiteReversed = getContrastRatio('#ffffff', hex)
      expect(ratioWhite).toBeCloseTo(ratioWhiteReversed, 5)

      // Razão sempre válida
      expect(ratioWhite).toBeGreaterThanOrEqual(1.0)
      expect(ratioWhite).toBeLessThanOrEqual(21.0)
    })
  })

  it('determina a melhor cor de texto (branco vs preto) para as 6 cores', () => {
    // Cores claras e amarela devem ter texto escuro para contraste
    expect(getBestTextColor('#f8fafc')).toBe('#111612')
    expect(getBestTextColor('#facc15')).toBe('#111612')

    // Cores escuras e azul devem ter texto branco
    expect(getBestTextColor('#0f172a')).toBe('#ffffff')
    expect(getBestTextColor('#2563eb')).toBe('#ffffff')
    expect(getBestTextColor('#007a29')).toBe('#ffffff')
    expect(getBestTextColor('#64748b')).toBe('#ffffff')
  })
})

describe('Ajuste de brilho e clareamento para modo escuro', () => {
  it('clareia e escurece com adjustBrightness', () => {
    const base = '#2563eb'
    const darker = adjustBrightness(base, -20)
    const lighter = adjustBrightness(base, 20)

    expect(getRelativeLuminance(darker)).toBeLessThan(getRelativeLuminance(base))
    expect(getRelativeLuminance(lighter)).toBeGreaterThan(getRelativeLuminance(base))
  })

  it('lightenUntilContrast clareia cores escuras até atender 4.5:1 no fundo escuro', () => {
    const darkNavy = '#0a192f'
    const initialContrast = getContrastRatio(darkNavy, DARK_CANVAS_BG)
    expect(initialContrast).toBeLessThan(4.5)

    const lightened = lightenUntilContrast(darkNavy, DARK_CANVAS_BG, 4.5)
    const finalContrast = getContrastRatio(lightened, DARK_CANVAS_BG)
    expect(finalContrast).toBeGreaterThanOrEqual(4.5)
  })

  it('preserva cor que já atende 4.5:1 no fundo escuro', () => {
    const brightLime = '#ccff00'
    const result = lightenUntilContrast(brightLime, DARK_CANVAS_BG, 4.5)
    expect(result).toBe(brightLime)
  })
})

describe('createBrandTokens e buildThemeCss', () => {
  it('gera tokens completos para tema claro e escuro', () => {
    const tokens = createBrandTokens('#2563eb')
    expect(tokens.light.brand).toBe('#2563eb')
    expect(tokens.light.text).toBe('#ffffff')
    expect(tokens.dark.brand).toBeDefined()
    expect(getContrastRatio(tokens.dark.brand, DARK_CANVAS_BG)).toBeGreaterThanOrEqual(4.5)

    const css = buildThemeCss(tokens)
    expect(css).toContain(':root, :root[data-theme="light"]')
    expect(css).toContain(':root[data-theme="dark"]')
    expect(css).toContain('--color-brand: #2563eb')
    expect(css).toContain('--color-brand-text: #ffffff')
  })
})

describe('applyBrandTheme', () => {
  beforeEach(() => {
    const existing = document.getElementById('leadflow-brand-theme')
    if (existing) existing.remove()
  })

  afterEach(() => {
    const existing = document.getElementById('leadflow-brand-theme')
    if (existing) existing.remove()
    vi.restoreAllMocks()
  })

  it('quando ausente ou nula, não injeta nenhum estilo e não altera o visual', () => {
    expect(applyBrandTheme(undefined)).toBe(false)
    expect(applyBrandTheme(null)).toBe(false)
    expect(applyBrandTheme('')).toBe(false)
    expect(document.getElementById('leadflow-brand-theme')).toBeNull()
  })

  it('quando inválida (sem ser hex #RRGGBB), não injeta nenhum estilo', () => {
    expect(applyBrandTheme('invalid-color')).toBe(false)
    expect(applyBrandTheme('rgb(0,0,0)')).toBe(false)
    expect(applyBrandTheme('#fff')).toBe(false)
    expect(document.getElementById('leadflow-brand-theme')).toBeNull()
  })

  it('quando cor válida atende o contraste, aplica no DOM via tag <style>', () => {
    const applied = applyBrandTheme('#2563eb')
    expect(applied).toBe(true)

    const styleEl = document.getElementById('leadflow-brand-theme')
    expect(styleEl).not.toBeNull()
    expect(styleEl?.textContent).toContain('--color-brand: #2563eb')
  })

  it('quando cor não tem contraste mínimo de 4.5:1 com o fundo claro, faz fallback para cor padrão e avisa no console', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // #e2e8f0 é um cinza quase branco, contraste ínfimo contra #edf3ee
    const applied = applyBrandTheme('#e2e8f0')
    expect(applied).toBe(true)

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('contraste insuficiente com o fundo claro'),
    )

    const styleEl = document.getElementById('leadflow-brand-theme')
    expect(styleEl?.textContent).toContain(`--color-brand: ${DEFAULT_BRAND_COLOR}`)
  })
})
