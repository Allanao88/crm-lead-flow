import type { ReactNode } from 'react'
import Button from './Button'

type EmptyStateIconType = 'leads' | 'contacts' | 'companies' | 'inventory' | 'search'

type EmptyStateProps = {
  icon?: EmptyStateIconType
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  actionVariant?: 'primary' | 'secondary'
}

const iconNodes: Record<EmptyStateIconType, ReactNode> = {
  leads: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20v-1.5A4.5 4.5 0 0 1 7.5 14h3a4.5 4.5 0 0 1 4.5 4.5V20" />
      <path d="M19 8v6M16 11h6" />
    </>
  ),
  contacts: (
    <>
      <rect x="3" y="5" width="18" height="15" rx="2.5" />
      <circle cx="9" cy="11" r="2.2" />
      <path d="M5.5 17a3.5 3.5 0 0 1 7 0M15 10h3M15 14h3" />
    </>
  ),
  companies: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M9 7h2M14 7h1M9 11h2M14 11h1M9 15h2M14 15h1M10 21v-3h4v3" />
    </>
  ),
  inventory: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5M3 16l9 5 9-5M12 13v4" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
}

export default function EmptyState({
  icon = 'leads',
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = 'primary',
}: EmptyStateProps) {
  return (
    <div className="crm-empty-state">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--color-brand-border)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
        <svg
          aria-hidden="true"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {iconNodes[icon]}
        </svg>
      </span>

      <h3 className="mt-4 text-[length:var(--text-md)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)]">
        {title}
      </h3>
      <p className="mt-1.5 max-w-md text-[length:var(--text-sm)] text-[var(--color-text-secondary)]">
        {description}
      </p>

      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant={actionVariant} onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  )
}

