type InventoryMetricCardProps = {
  label: string
  value: string
  detail: string
}

export default function InventoryMetricCard({
  label,
  value,
  detail,
}: InventoryMetricCardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </section>
  )
}
