export const LIGHT_CANVAS_BG = '#edf3ee'
export const DARK_CANVAS_BG = '#0f1311'
export const DEFAULT_BRAND_COLOR = '#007a29'
export const MIN_WCAG_CONTRAST = 4.5

export interface RgbColor {
  r: number
  g: number
  b: number
}

export interface BrandTokens {
  brand: string
  hover: string
  text: string
  soft: string
  border: string
  focusRing: string
}

export interface BrandTheme {
  light: BrandTokens
  dark: BrandTokens
}

export function hexToRgb(hex: string): RgbColor {
  const clean = hex.replace(/^#/, '')
  const num = parseInt(clean, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
      .toLowerCase()
  )
}

/**
 * Calcula a luminância relativa de uma cor sRGB conforme especificação WCAG 2.1.
 * Retorna valor normalizado entre 0.0 (preto absoluto) e 1.0 (branco absoluto).
 */
export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  const [lr, lg, lb] = [r, g, b].map((val) => {
    const srgb = val / 255
    return srgb <= 0.04045
      ? srgb / 12.92
      : Math.pow((srgb + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb
}

/**
 * Calcula a razão de contraste WCAG 2.1 entre duas cores hex.
 * Retorna valor entre 1.0 (mesma cor) e 21.0 (preto vs branco).
 */
export function getContrastRatio(colorA: string, colorB: string): number {
  const lumA = getRelativeLuminance(colorA)
  const lumB = getRelativeLuminance(colorB)
  const lighter = Math.max(lumA, lumB)
  const darker = Math.min(lumA, lumB)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Determina a cor de texto com maior contraste sobre o fundo (branco #ffffff vs preto #111612).
 */
export function getBestTextColor(bgHex: string): string {
  const contrastWhite = getContrastRatio(bgHex, '#ffffff')
  const contrastBlack = getContrastRatio(bgHex, '#111612')
  return contrastWhite >= contrastBlack ? '#ffffff' : '#111612'
}

/**
 * Ajusta o brilho de uma cor hex (percent positivo clareia, negativo escurece).
 */
export function adjustBrightness(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex)
  const factor = percent / 100
  if (factor >= 0) {
    return rgbToHex(
      r + (255 - r) * factor,
      g + (255 - g) * factor,
      b + (255 - b) * factor,
    )
  }
  const scale = 1 + factor
  return rgbToHex(r * scale, g * scale, b * scale)
}

/**
 * Clareia progressivamente uma cor até que ela atinja a razão de contraste mínima sobre o fundo escuro.
 */
export function lightenUntilContrast(
  hex: string,
  bgHex: string = DARK_CANVAS_BG,
  minRatio: number = MIN_WCAG_CONTRAST,
): string {
  let current = hex
  if (getContrastRatio(current, bgHex) >= minRatio) {
    return current
  }

  for (let step = 1; step <= 20; step++) {
    const candidate = adjustBrightness(hex, step * 5)
    if (getContrastRatio(candidate, bgHex) >= minRatio) {
      return candidate
    }
    current = candidate
  }

  return current
}

export function createBrandTokens(brandColorHex: string): BrandTheme {
  const lightBrand = brandColorHex.toLowerCase()
  const lightHover = adjustBrightness(lightBrand, -15)
  const lightText = getBestTextColor(lightBrand)
  const lightRgb = hexToRgb(lightBrand)

  const darkBrand = lightenUntilContrast(brandColorHex, DARK_CANVAS_BG, MIN_WCAG_CONTRAST)
  const darkHover = adjustBrightness(darkBrand, -10)
  const darkText = getBestTextColor(darkBrand)
  const darkRgb = hexToRgb(darkBrand)

  return {
    light: {
      brand: lightBrand,
      hover: lightHover,
      text: lightText,
      soft: `rgb(${lightRgb.r} ${lightRgb.g} ${lightRgb.b} / 10%)`,
      border: `rgb(${lightRgb.r} ${lightRgb.g} ${lightRgb.b} / 74%)`,
      focusRing: `rgb(${lightRgb.r} ${lightRgb.g} ${lightRgb.b} / 30%)`,
    },
    dark: {
      brand: darkBrand,
      hover: darkHover,
      text: darkText,
      soft: `rgb(${darkRgb.r} ${darkRgb.g} ${darkRgb.b} / 14%)`,
      border: `rgb(${darkRgb.r} ${darkRgb.g} ${darkRgb.b} / 46%)`,
      focusRing: `rgb(${darkRgb.r} ${darkRgb.g} ${darkRgb.b} / 34%)`,
    },
  }
}

export function buildThemeCss(theme: BrandTheme): string {
  return `
:root, :root[data-theme="light"] {
  --color-brand: ${theme.light.brand};
  --color-brand-vivid: ${theme.light.brand};
  --color-brand-hover: ${theme.light.hover};
  --color-brand-text: ${theme.light.text};
  --color-brand-soft: ${theme.light.soft};
  --color-brand-border: ${theme.light.border};
  --color-accent: ${theme.light.brand};
  --color-action-text: ${theme.light.hover};
  --color-focus-ring: ${theme.light.focusRing};
}

:root[data-theme="dark"] {
  --color-brand: ${theme.dark.brand};
  --color-brand-vivid: ${theme.dark.brand};
  --color-brand-hover: ${theme.dark.hover};
  --color-brand-text: ${theme.dark.text};
  --color-brand-soft: ${theme.dark.soft};
  --color-brand-border: ${theme.dark.border};
  --color-accent: ${theme.dark.brand};
  --color-action-text: ${theme.dark.brand};
  --color-focus-ring: ${theme.dark.focusRing};
}
`.trim()
}

/**
 * Inicializa e aplica a cor da marca dinâmica no DOM via tag <style id="leadflow-brand-theme">.
 * Se a variável estiver ausente ou inválida, não altera nada e preserva os estilos nativos do CSS.
 * Se o contraste no tema claro for menor que 4.5:1, utiliza fallback com aviso no console.
 */
export function applyBrandTheme(rawColor?: unknown): boolean {
  if (typeof rawColor !== 'string') {
    return false
  }

  const trimmed = rawColor.trim()
  if (!/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return false
  }

  let finalColor = trimmed.toLowerCase()
  const lightContrast = getContrastRatio(finalColor, LIGHT_CANVAS_BG)

  if (lightContrast < MIN_WCAG_CONTRAST) {
    console.warn(
      `[LeadFlow] A cor de marca "${finalColor}" possui contraste insuficiente com o fundo claro (${lightContrast.toFixed(
        2,
      )}:1 < ${MIN_WCAG_CONTRAST}:1). Utilizando padrão "${DEFAULT_BRAND_COLOR}".`,
    )
    finalColor = DEFAULT_BRAND_COLOR
  }

  const tokens = createBrandTokens(finalColor)
  const css = buildThemeCss(tokens)

  if (typeof document !== 'undefined') {
    let styleEl = document.getElementById('leadflow-brand-theme') as HTMLStyleElement | null
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'leadflow-brand-theme'
      document.head.appendChild(styleEl)
    }
    styleEl.textContent = css
  }

  return true
}
