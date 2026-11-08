import { describe, expect, it } from 'vitest'
import {
  createBrandConfig,
  DEFAULT_BRAND_COLOR,
  DEFAULT_CLIENT_NAME,
  MAX_CLIENT_NAME_LENGTH,
  sanitizeBrandColor,
  sanitizeClientName,
  sanitizeContactEmail,
  sanitizeLogoUrl,
} from './brand'

describe('Configuração de marca (src/config/brand.ts)', () => {
  describe('sanitizeClientName', () => {
    it('retorna o padrão quando ausente ou indefinido', () => {
      expect(sanitizeClientName(undefined)).toBe(DEFAULT_CLIENT_NAME)
      expect(sanitizeClientName(null)).toBe(DEFAULT_CLIENT_NAME)
      expect(sanitizeClientName('')).toBe(DEFAULT_CLIENT_NAME)
      expect(sanitizeClientName('   ')).toBe(DEFAULT_CLIENT_NAME)
      expect(sanitizeClientName(123)).toBe(DEFAULT_CLIENT_NAME)
    })

    it('faz trim de espaços e preserva nomes válidos', () => {
      expect(sanitizeClientName('  Acme Corporation  ')).toBe('Acme Corporation')
    })

    it('limita o nome a no máximo 60 caracteres', () => {
      const longName = 'A'.repeat(80)
      const sanitized = sanitizeClientName(longName)
      expect(sanitized).toHaveLength(MAX_CLIENT_NAME_LENGTH)
      expect(sanitized).toBe('A'.repeat(MAX_CLIENT_NAME_LENGTH))
    })
  })

  describe('sanitizeLogoUrl', () => {
    it('retorna null quando ausente, vazio ou não string', () => {
      expect(sanitizeLogoUrl(undefined)).toBeNull()
      expect(sanitizeLogoUrl(null)).toBeNull()
      expect(sanitizeLogoUrl('')).toBeNull()
      expect(sanitizeLogoUrl('   ')).toBeNull()
      expect(sanitizeLogoUrl(123)).toBeNull()
    })

    it('aceita URLs válidas com protocolo https:', () => {
      expect(sanitizeLogoUrl('https://example.com/logo.png')).toBe(
        'https://example.com/logo.png',
      )
      expect(sanitizeLogoUrl('  https://cdn.empresa.com/assets/logo.svg  ')).toBe(
        'https://cdn.empresa.com/assets/logo.svg',
      )
    })

    it('rejeita protocolos não-https (http:, data:, javascript:, file:)', () => {
      expect(sanitizeLogoUrl('http://example.com/logo.png')).toBeNull()
      expect(sanitizeLogoUrl('data:image/svg+xml;base64,...')).toBeNull()
      expect(sanitizeLogoUrl('javascript:alert(1)')).toBeNull()
      expect(sanitizeLogoUrl('file:///etc/passwd')).toBeNull()
      expect(sanitizeLogoUrl('//example.com/logo.png')).toBeNull()
      expect(sanitizeLogoUrl('not-a-valid-url')).toBeNull()
    })
  })

  describe('sanitizeBrandColor', () => {
    it('retorna o padrão quando ausente, vazio ou não string', () => {
      expect(sanitizeBrandColor(undefined)).toBe(DEFAULT_BRAND_COLOR)
      expect(sanitizeBrandColor(null)).toBe(DEFAULT_BRAND_COLOR)
      expect(sanitizeBrandColor('')).toBe(DEFAULT_BRAND_COLOR)
      expect(sanitizeBrandColor('   ')).toBe(DEFAULT_BRAND_COLOR)
      expect(sanitizeBrandColor(123)).toBe(DEFAULT_BRAND_COLOR)
    })

    it('aceita cores hex válidas no formato #RRGGBB e normaliza para minúsculas', () => {
      expect(sanitizeBrandColor('#007A29')).toBe('#007a29')
      expect(sanitizeBrandColor('#1E40AF')).toBe('#1e40af')
      expect(sanitizeBrandColor('  #CCFF00  ')).toBe('#ccff00')
    })

    it('rejeita formatos hex inválidos e usa o padrão', () => {
      expect(sanitizeBrandColor('#fff')).toBe(DEFAULT_BRAND_COLOR) // 3 dígitos não aceitos
      expect(sanitizeBrandColor('#12345678')).toBe(DEFAULT_BRAND_COLOR) // 8 dígitos (alpha) não aceito
      expect(sanitizeBrandColor('007a29')).toBe(DEFAULT_BRAND_COLOR) // sem hash
      expect(sanitizeBrandColor('rgb(0, 122, 41)')).toBe(DEFAULT_BRAND_COLOR)
      expect(sanitizeBrandColor('#gggggg')).toBe(DEFAULT_BRAND_COLOR)
      expect(sanitizeBrandColor('red')).toBe(DEFAULT_BRAND_COLOR)
    })
  })

  describe('sanitizeContactEmail', () => {
    it('retorna null quando ausente, vazio ou não string', () => {
      expect(sanitizeContactEmail(undefined)).toBeNull()
      expect(sanitizeContactEmail(null)).toBeNull()
      expect(sanitizeContactEmail('')).toBeNull()
      expect(sanitizeContactEmail('   ')).toBeNull()
      expect(sanitizeContactEmail(123)).toBeNull()
    })

    it('aceita e-mails com formato válido simples e faz trim', () => {
      expect(sanitizeContactEmail('contato@empresa.com.br')).toBe(
        'contato@empresa.com.br',
      )
      expect(sanitizeContactEmail('  suporte.ti@cliente.io  ')).toBe(
        'suporte.ti@cliente.io',
      )
    })

    it('rejeita e-mails malformados', () => {
      expect(sanitizeContactEmail('invalido')).toBeNull()
      expect(sanitizeContactEmail('invalido@')).toBeNull()
      expect(sanitizeContactEmail('@dominio.com')).toBeNull()
      expect(sanitizeContactEmail('invalido@dominio')).toBeNull()
      expect(sanitizeContactEmail('dois@@dominio.com')).toBeNull()
      expect(sanitizeContactEmail('espaco no meio@dominio.com')).toBeNull()
    })
  })

  describe('createBrandConfig', () => {
    it('cria configuração com padrões quando o ambiente está vazio', () => {
      const config = createBrandConfig({})

      expect(config).toEqual({
        clientName: 'Sua empresa',
        logoUrl: null,
        brandColor: '#007a29',
        contactEmail: null,
      })
      expect(Object.isFrozen(config)).toBe(true)
    })

    it('preenche variáveis válidas fornecidas no ambiente', () => {
      const config = createBrandConfig({
        VITE_CLIENT_NAME: 'Tech Solutions',
        VITE_CLIENT_LOGO_URL: 'https://tech.exemplo.com/logo.png',
        VITE_BRAND_COLOR: '#2563EB',
        VITE_CONTACT_EMAIL: 'ajuda@tech.exemplo.com',
      })

      expect(config).toEqual({
        clientName: 'Tech Solutions',
        logoUrl: 'https://tech.exemplo.com/logo.png',
        brandColor: '#2563eb',
        contactEmail: 'ajuda@tech.exemplo.com',
      })
    })

    it('ignora variáveis inválidas com segurança sem quebrar', () => {
      const config = createBrandConfig({
        VITE_CLIENT_NAME: '   ',
        VITE_CLIENT_LOGO_URL: 'http://insecure.com/logo.png',
        VITE_BRAND_COLOR: 'invalid-color',
        VITE_CONTACT_EMAIL: 'not-an-email',
      })

      expect(config).toEqual({
        clientName: 'Sua empresa',
        logoUrl: null,
        brandColor: '#007a29',
        contactEmail: null,
      })
    })
  })
})
