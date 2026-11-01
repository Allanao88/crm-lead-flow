import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import { TableRowsSkeleton } from '../../components/Skeleton'
import type { InventoryMovement } from './types'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const quantityFormat = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 3,
})

const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

type InventoryMovementsTableProps = {
  movements: InventoryMovement[]
  loading: boolean
  saving: boolean
  hasActiveProducts: boolean
  onCreateEntry: () => void
  onReverse: (movement: InventoryMovement) => void
}

export default function InventoryMovementsTable({
  movements,
  loading,
  saving,
  hasActiveProducts,
  onCreateEntry,
  onReverse,
}: InventoryMovementsTableProps) {
  return (
    <div className="crm-table-container">
      <table className="crm-table min-w-[950px]">
        <thead>
          <tr>
            <th>Data</th>
            <th>Produto</th>
            <th>Tipo</th>
            <th className="text-right">Quantidade</th>
            <th className="text-right">Custo unitário</th>
            <th className="text-right">Custo total</th>
            <th>Motivo</th>
            <th className="text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableRowsSkeleton columns={8} rows={5} />
          ) : movements.length === 0 ? (
            <tr>
              <td colSpan={8} className="p-0">
                <EmptyState
                  icon="inventory"
                  title="Nenhuma movimentação registrada"
                  description={
                    hasActiveProducts
                      ? 'Registre entradas, saídas ou estornos para auditar o histórico do estoque.'
                      : 'Cadastre um produto ativo antes de registrar entradas ou saídas no estoque.'
                  }
                  actionLabel={
                    hasActiveProducts ? '+ Registrar entrada' : '+ Novo produto'
                  }
                  onAction={onCreateEntry}
                />
              </td>
            </tr>
          ) : (
            movements.map((movement) => {
              const isReversal = movement.movement_type.startsWith('reversal_')
              const isEntry =
                movement.movement_type === 'entry' ||
                movement.movement_type === 'reversal_exit'
              const typeLabel = isReversal
                ? isEntry
                  ? 'Estorno de saída'
                  : 'Estorno de entrada'
                : movement.movement_type === 'entry'
                  ? 'Entrada'
                  : 'Saída'

              return (
                <tr key={movement.id}>
                  <td className="whitespace-nowrap tabular-nums">
                    {dateFormat.format(new Date(movement.created_at))}
                  </td>
                  <td>
                    <span className="font-[var(--font-weight-semibold)] text-[var(--color-text-primary)]">
                      {movement.product?.name ??
                        `Produto #${movement.product_id}`}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`crm-badge ${
                        isEntry ? 'crm-badge--success' : 'crm-badge--danger'
                      }`}
                    >
                      {typeLabel}
                    </span>
                    {movement.lead_id !== null && (
                      <p className="mt-1 text-[length:var(--text-xs)] text-[var(--color-text-muted)] tabular-nums">
                        Lead #{movement.lead_id}
                      </p>
                    )}
                  </td>
                  <td className="text-right tabular-nums">
                    <span
                      className={`font-[var(--font-weight-semibold)] ${
                        movement.quantity_delta < 0
                          ? 'text-[var(--color-negative-text)]'
                          : 'text-[var(--color-positive-text)]'
                      }`}
                    >
                      {movement.quantity_delta > 0 ? '+' : ''}
                      {quantityFormat.format(movement.quantity_delta)}
                    </span>
                  </td>
                  <td className="text-right tabular-nums">
                    {currency.format(movement.unit_cost)}
                  </td>
                  <td className="text-right tabular-nums">
                    {currency.format(movement.total_cost)}
                  </td>
                  <td className="max-w-xs">
                    <p className="truncate" title={movement.reason ?? undefined}>
                      {movement.reason || '—'}
                    </p>
                  </td>
                  <td className="text-right">
                    {!isReversal && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReverse(movement)}
                        disabled={saving}
                      >
                        Estornar
                      </Button>
                    )}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
