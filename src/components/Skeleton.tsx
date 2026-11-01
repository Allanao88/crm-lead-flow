type SkeletonProps = {
  className?: string
}

export function Skeleton({ className = 'h-4 w-full' }: SkeletonProps) {
  return <div aria-hidden="true" className={`crm-skeleton ${className}`} />
}

export function MetricCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="glass min-w-0 rounded-[var(--radius-lg)] p-[var(--space-5)] sm:p-[var(--space-6)]"
    >
      <div className="flex min-h-8 items-start justify-between gap-[var(--space-3)]">
        <Skeleton className="mt-1 h-4 w-28" />
        <Skeleton className="h-8 w-8 shrink-0 rounded-[var(--radius-xs)]" />
      </div>
      <Skeleton className="mt-[var(--space-4)] h-8 w-36" />
      <Skeleton className="mt-[var(--space-2)] h-3.5 w-44 max-w-full" />
    </div>
  )
}

type TableRowsSkeletonProps = {
  columns: number
  rows?: number
}

export function TableRowsSkeleton({
  columns,
  rows = 5,
}: TableRowsSkeletonProps) {
  const widths = ['w-40', 'w-28', 'w-24', 'w-20', 'w-24', 'w-20', 'w-28', 'w-16']

  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} aria-hidden="true">
          {Array.from({ length: columns }).map((__, colIndex) => (
            <td key={colIndex}>
              <Skeleton
                className={`h-4 ${widths[(rowIndex + colIndex) % widths.length]} ${
                  colIndex >= columns - 2 ? 'ml-auto' : ''
                }`}
              />
              {colIndex === 0 && <Skeleton className="mt-2 h-3 w-32" />}
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export function ModulePageSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Carregando módulo"
      className="crm-page"
    >
      <span className="sr-only">Carregando módulo...</span>
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-4 w-72 max-w-full" />
        <Skeleton className="h-11 w-36 rounded-[var(--radius-md)]" />
      </div>
      <div className="crm-panel">
        <div className="border-b border-[var(--glass-border)] p-5 sm:p-6">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-2 h-11 w-full max-w-md rounded-[var(--radius-sm)]" />
        </div>
        <div className="crm-table-container">
          <table className="crm-table min-w-[700px]">
            <tbody>
              <TableRowsSkeleton columns={5} rows={5} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

