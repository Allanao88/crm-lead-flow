import { useState } from 'react'
import { brand, getClientInitials } from '../config/brand'

type BrandLogoProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  alt?: string
}

const sizeClasses: Record<'sm' | 'md' | 'lg', { container: string; text: string }> = {
  sm: { container: 'h-9 w-9', text: 'text-[length:var(--text-xs)]' },
  md: { container: 'h-10 w-10', text: 'text-[length:var(--text-sm)]' },
  lg: { container: 'h-12 w-12', text: 'text-[length:var(--text-base)]' },
}

export default function BrandLogo({
  size = 'md',
  className = '',
  alt,
}: BrandLogoProps) {
  const [imgError, setImgError] = useState(false)
  const { container, text } = sizeClasses[size]
  const label = alt || brand.clientName

  if (brand.logoUrl && !imgError) {
    return (
      <img
        src={brand.logoUrl}
        alt={label}
        onError={() => setImgError(true)}
        className={`${container} shrink-0 rounded-full border border-[var(--color-brand-border)] bg-[var(--glass-bg-subtle)] object-cover shadow-[var(--shadow-xs)] ${className}`}
      />
    )
  }

  return (
    <div
      role="img"
      aria-label={label}
      className={`${container} ${text} flex shrink-0 select-none items-center justify-center rounded-full border border-[var(--color-brand-border)] bg-[var(--color-brand-soft)] font-[var(--font-weight-bold)] text-[var(--color-brand)] shadow-[var(--shadow-xs)] ${className}`}
    >
      {getClientInitials(brand.clientName)}
    </div>
  )
}
