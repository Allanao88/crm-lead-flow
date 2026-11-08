export interface BrandConfig {
  readonly clientName: string
  readonly logoUrl: string | null
  readonly brandColor: string
  readonly contactEmail: string | null
}

export const DEFAULT_CLIENT_NAME = 'Sua empresa'
export const DEFAULT_BRAND_COLOR = '#007a29'
export const MAX_CLIENT_NAME_LENGTH = 60

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function sanitizeClientName(name?: unknown): string {
  if (typeof name !== 'string') {
    return DEFAULT_CLIENT_NAME
  }

  const trimmed = name.trim()
  if (!trimmed) {
    return DEFAULT_CLIENT_NAME
  }

  return trimmed.slice(0, MAX_CLIENT_NAME_LENGTH)
}

export function sanitizeLogoUrl(url?: unknown): string | null {
  if (typeof url !== 'string') {
    return null
  }

  const trimmed = url.trim()
  if (!trimmed) {
    return null
  }

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'https:') {
      return parsed.toString()
    }
  } catch {
    return null
  }

  return null
}

export function sanitizeBrandColor(color?: unknown): string {
  if (typeof color !== 'string') {
    return DEFAULT_BRAND_COLOR
  }

  const trimmed = color.trim()
  if (HEX_COLOR_REGEX.test(trimmed)) {
    return trimmed.toLowerCase()
  }

  return DEFAULT_BRAND_COLOR
}

export function sanitizeContactEmail(email?: unknown): string | null {
  if (typeof email !== 'string') {
    return null
  }

  const trimmed = email.trim()
  if (!trimmed) {
    return null
  }

  if (EMAIL_REGEX.test(trimmed)) {
    return trimmed
  }

  return null
}

export function createBrandConfig(
  env: Partial<Record<string, unknown>> = {},
): BrandConfig {
  return Object.freeze({
    clientName: sanitizeClientName(env.VITE_CLIENT_NAME),
    logoUrl: sanitizeLogoUrl(env.VITE_CLIENT_LOGO_URL),
    brandColor: sanitizeBrandColor(env.VITE_BRAND_COLOR),
    contactEmail: sanitizeContactEmail(env.VITE_CONTACT_EMAIL),
  })
}

export const brand: BrandConfig = createBrandConfig(
  typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {},
)
