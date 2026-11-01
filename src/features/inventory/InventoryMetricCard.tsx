import MetricCard from '../../components/MetricCard'

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
  return <MetricCard label={label} value={value} detail={detail} />
}
