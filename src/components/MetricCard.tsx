type MetricCardProps = {
  label: string
  value: string
  detail: string
}

export default function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <article className="group relative min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md sm:p-6">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-indigo-500 to-violet-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      <div className="flex min-h-8 items-start justify-between gap-3">
        <p className="text-[13px] font-semibold tracking-wide text-slate-500">
          {label}
        </p>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
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

      <p className="mt-4 break-words text-[clamp(1.5rem,2vw,1.9rem)] font-bold leading-tight tracking-[-0.04em] text-slate-900 tabular-nums">
        {value}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">
        {detail}
      </p>
    </article>
  )
}
