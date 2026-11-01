type MetricCardProps = {
  label: string
  value: string
  detail: string
}

export default function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <article className="glass glass-interactive group relative min-w-0 overflow-hidden rounded-[var(--radius-lg)] p-[var(--space-5)] sm:p-[var(--space-6)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[var(--color-brand)] via-[var(--color-brand-vivid)] to-transparent opacity-0 transition-opacity duration-[var(--duration-normal)] group-hover:opacity-100" />

      <div className="flex min-h-8 items-start justify-between gap-[var(--space-3)]">
        <p className="text-[length:var(--text-sm)] font-[var(--font-weight-semibold)] tracking-wide text-[var(--color-text-secondary)]">
          {label}
        </p>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-xs)] border border-[var(--color-brand-border)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
          <svg
            aria-hidden="true"
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3v18h18" />
            <path d="m7 14 4-4 4 3 5-7" />
          </svg>
        </span>
      </div>

      <p className="mt-[var(--space-4)] break-words text-[length:var(--text-metric)] font-[var(--font-weight-bold)] leading-[var(--leading-tight)] tracking-[var(--tracking-tight)] text-[var(--color-text-primary)] tabular-nums">
        {value}
      </p>
      <p className="mt-[var(--space-2)] text-[length:var(--text-xs)] leading-[var(--leading-relaxed)] text-[var(--color-text-muted)]">
        {detail}
      </p>
    </article>
  )
}
