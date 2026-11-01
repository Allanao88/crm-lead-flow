import Button from '../../components/Button'
import FormField from '../../components/FormField'
import type { InventoryProduct } from './types'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const quantityFormat = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 3,
})

type InventoryProductsTableProps = {
  products: InventoryProduct[]
  loading: boolean
  search: string
  onSearchChange: (value: string) => void
  onEdit: (product: InventoryProduct) => void
}

export default function InventoryProductsTable({
  products,
  loading,
  search,
  onSearchChange,
  onEdit,
}: InventoryProductsTableProps) {
  return (
    <>
      <div className="border-b border-[var(--glass-border)] p-4 sm:px-6">
        <FormField label="Buscar produto" className="sm:max-w-md">
          {(fieldProps) => (
            <input
              {...fieldProps}
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar por produto, SKU ou descrição..."
            />
          )}
        </FormField>
      </div>

      <div className="crm-table-container">
        <table className="crm-table min-w-[850px]">
          <thead>
            <tr>
              <th>Produto</th>
              <th>SKU</th>
              <th className="text-right">Saldo</th>
              <th className="text-right">Custo médio</th>
              <th className="text-right">Valor em estoque</th>
              <th>Situação</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center">
                  Carregando estoque...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center">
                  {search
                    ? 'Nenhum produto corresponde à busca.'
                    : 'Nenhum produto cadastrado. Comece adicionando um produto.'}
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const badgeClass = !product.is_active
                  ? 'crm-badge crm-badge--neutral'
                  : product.quantity_on_hand <= 0
                    ? 'crm-badge crm-badge--warning'
                    : 'crm-badge crm-badge--success'

                const statusLabel = !product.is_active
                  ? 'Inativo'
                  : product.quantity_on_hand <= 0
                    ? 'Sem estoque'
                    : 'Disponível'

                return (
                  <tr key={product.id}>
                    <td>
                      <p className="font-[var(--font-weight-semibold)] text-[var(--color-text-primary)]">
                        {product.name}
                      </p>
                      {product.description && (
                        <p className="mt-1 max-w-xs truncate text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
                          {product.description}
                        </p>
                      )}
                    </td>
                    <td className="tabular-nums">
                      {product.sku || '—'}
                    </td>
                    <td className="text-right tabular-nums">
                      <span className="font-[var(--font-weight-semibold)] text-[var(--color-text-primary)]">
                        {quantityFormat.format(product.quantity_on_hand)}{' '}
                        {product.unit}
                      </span>
                    </td>
                    <td className="text-right tabular-nums">
                      {currency.format(product.average_cost)}
                    </td>
                    <td className="text-right tabular-nums">
                      <span className="font-[var(--font-weight-semibold)] text-[var(--color-text-primary)]">
                        {currency.format(
                          product.quantity_on_hand * product.average_cost,
                        )}
                      </span>
                    </td>
                    <td>
                      <span className={badgeClass}>{statusLabel}</span>
                    </td>
                    <td className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(product)}
                      >
                        Editar
                      </Button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
