import Button from '../../components/Button'

type SummaryErrorStateProps = {
  message: string
  onRetry: () => void
}

export default function SummaryErrorState({
  message,
  onRetry,
}: SummaryErrorStateProps) {
  return (
    <section
      role="alert"
      className="crm-panel flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--badge-danger-border)] bg-[var(--badge-danger-bg)] text-[var(--badge-danger-text)]"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4.5M12 16h.01" />
          </svg>
        </span>
        <div className="min-w-0">
          <h3 className="text-[length:var(--text-md)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)]">
            Resumo comercial indisponível
          </h3>
          <p className="mt-1 text-[length:var(--text-sm)] text-[var(--color-text-secondary)]">
            {message}
          </p>
        </div>
      </div>

      <Button
        variant="secondary"
        onClick={onRetry}
        className="w-full shrink-0 sm:w-auto"
      >
        Tentar novamente
      </Button>
    </section>
  )
}

