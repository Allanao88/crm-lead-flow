type MetricCardProps = {
  label: string
  value: string
  detail: string
}

export default function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-4 break-words text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </article>
  )
}
