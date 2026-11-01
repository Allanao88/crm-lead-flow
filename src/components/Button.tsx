import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'md' | 'sm'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = Boolean(disabled || loading)

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={`crm-btn crm-btn--${variant} ${
        size === 'sm' ? 'crm-btn--sm' : ''
      } ${className}`.trim()}
      {...rest}
    >
      <span
        className={`inline-flex items-center justify-center gap-[var(--space-2)] ${
          loading ? 'invisible' : ''
        }`}
      >
        {children}
      </span>
      {loading && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            className="crm-spinner"
          >
            <path d="M12 3a9 9 0 1 0 9 9" />
          </svg>
        </span>
      )}
    </button>
  )
}

