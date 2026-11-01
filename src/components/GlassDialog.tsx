import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'

type GlassDialogProps = {
  open: boolean
  title: string
  description?: string
  variant?: 'modal' | 'drawer'
  busy?: boolean
  onClose: () => void
  children: ReactNode
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export default function GlassDialog({
  open,
  title,
  description,
  variant = 'modal',
  busy = false,
  onClose,
  children,
}: GlassDialogProps) {
  const titleId = useId()
  const descId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  const busyRef = useRef(busy)

  useEffect(() => {
    onCloseRef.current = onClose
    busyRef.current = busy
  }, [onClose, busy])

  useEffect(() => {
    if (!open) return

    const previousFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const panel = panelRef.current
    if (panel) {
      const preferred = panel.querySelector<HTMLElement>(
        '[data-autofocus], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled)',
      )
      preferred?.focus()
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (!busyRef.current) {
          event.preventDefault()
          onCloseRef.current()
        }
        return
      }

      if (event.key !== 'Tab' || !panelRef.current) return

      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => el.offsetParent !== null)

      if (focusables.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement

      if (event.shiftKey) {
        if (active === first || !panelRef.current.contains(active)) {
          event.preventDefault()
          last.focus()
        }
      } else if (active === last || !panelRef.current.contains(active)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocused?.focus()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className={`crm-dialog-backdrop ${
        variant === 'drawer'
          ? 'crm-dialog-backdrop--drawer'
          : 'crm-dialog-backdrop--modal'
      }`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onClose()
        }
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={`glass-strong ${
          variant === 'drawer' ? 'crm-drawer-panel' : 'crm-dialog-panel'
        }`}
      >
        <div className="flex shrink-0 items-start justify-between gap-[var(--space-4)] border-b border-[var(--glass-border)] px-[var(--space-5)] py-[var(--space-4)] sm:px-[var(--space-6)]">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-[length:var(--text-lg)] font-[var(--font-weight-bold)] tracking-[var(--tracking-tight)] text-[var(--color-text-primary)]"
            >
              {title}
            </h2>
            {description && (
              <p
                id={descId}
                className="mt-1 text-[length:var(--text-sm)] text-[var(--color-text-secondary)]"
              >
                {description}
              </p>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={onClose}
            aria-label="Fechar painel"
            title="Fechar (Esc)"
            className="shrink-0 px-2.5"
          >
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-[var(--space-5)] sm:p-[var(--space-6)]">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}

