import { useEffect, useState } from 'react'

type FeedbackMessagesProps = {
  error: string
  notice: string
  onDismissError?: () => void
  onDismissNotice?: () => void
}

type ToastState = {
  text: string
  leaving: boolean
}

function useAnimatedMessage(value: string, autoHideMs?: number, onDismiss?: () => void) {
  const [toast, setToast] = useState<ToastState>({ text: '', leaving: false })

  useEffect(() => {
    if (value) {
      const showTimer = setTimeout(() => {
        setToast({ text: value, leaving: false })
      }, 0)

      if (!autoHideMs || !onDismiss) {
        return () => clearTimeout(showTimer)
      }

      const hideTimer = setTimeout(() => {
        setToast((cur) => (cur.text ? { ...cur, leaving: true } : cur))
        setTimeout(() => {
          onDismiss()
        }, 160)
      }, autoHideMs)

      return () => {
        clearTimeout(showTimer)
        clearTimeout(hideTimer)
      }
    }

    const leaveTimer = setTimeout(() => {
      setToast((cur) => (cur.text ? { ...cur, leaving: true } : cur))
    }, 0)
    const clearTimer = setTimeout(() => {
      setToast({ text: '', leaving: false })
    }, 160)

    return () => {
      clearTimeout(leaveTimer)
      clearTimeout(clearTimer)
    }
  }, [value, autoHideMs, onDismiss])

  return toast
}

export default function FeedbackMessages({
  error,
  notice,
  onDismissError,
  onDismissNotice,
}: FeedbackMessagesProps) {
  const errorToast = useAnimatedMessage(error)
  const noticeToast = useAnimatedMessage(notice, 4500, onDismissNotice)

  return (
    <>
      {/* Regiões live permanentes para leitores de tela */}
      <div className="sr-only" role="alert" aria-live="assertive" aria-atomic="true">
        {error}
      </div>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {notice}
      </div>

      {(errorToast.text || noticeToast.text) && (
        <aside aria-label="Notificações" className="crm-toast-viewport">
          {errorToast.text && (
            <div
              className={`glass-strong crm-toast crm-toast--error ${
                errorToast.leaving ? 'crm-toast--leaving' : ''
              }`}
            >
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--badge-danger-bg)] text-[var(--badge-danger-text)]"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4.5M12 16h.01" />
                </svg>
              </span>
              <p className="min-w-0 flex-1 text-[var(--color-text-primary)]">
                {errorToast.text}
              </p>
              {onDismissError && (
                <button
                  type="button"
                  onClick={onDismissError}
                  aria-label="Fechar alerta de erro"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-text-primary)]"
                >
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {noticeToast.text && (
            <div
              className={`glass-strong crm-toast crm-toast--notice ${
                noticeToast.leaving ? 'crm-toast--leaving' : ''
              }`}
            >
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--badge-success-bg)] text-[var(--badge-success-text)]"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m5 12 4.5 4.5L19 7" />
                </svg>
              </span>
              <p className="min-w-0 flex-1 text-[var(--color-text-primary)]">
                {noticeToast.text}
              </p>
              {onDismissNotice && (
                <button
                  type="button"
                  onClick={onDismissNotice}
                  aria-label="Fechar aviso"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-text-primary)]"
                >
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </aside>
      )}
    </>
  )
}
