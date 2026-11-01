import { Skeleton } from '../../components/Skeleton'
import type { InventoryProduct } from '../inventory/types'
import type { LeadProductItem } from './useLeadProducts'

type LeadProductsEditorProps = {
  products: InventoryProduct[]
  items: LeadProductItem[]
  loading: boolean
  loadError: string
  disabled?: boolean
  onQuantityChange: (productId: number, quantity: string) => void
}

export default function LeadProductsEditor({
  products,
  items,
  loading,
  loadError,
  disabled = false,
  onQuantityChange,
}: LeadProductsEditorProps) {
  const availableProducts = products.filter(
    (product) =>
      product.is_active ||
      items.some((item) => item.product_id === product.id),
  )

  return (
    <section className="glass-subtle space-y-3 rounded-[var(--radius-md)] p-4 sm:col-span-2">
      <div>
        <h3 className="text-[length:var(--text-base)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)]">
          Produtos vinculados
        </h3>
        <p className="mt-1 text-[length:var(--text-xs)] text-[var(--color-text-secondary)]">
          Informe a quantidade de cada produto utilizado neste lead. A baixa
          acontece quando a etapa muda para Ganho.
        </p>
      </div>

      {loadError && (
        <p role="alert" className="crm-callout crm-callout--danger">
          {loadError}
        </p>
      )}

      {loading ? (
        <div
          role="status"
          aria-live="polite"
          className="grid gap-3 sm:grid-cols-2"
        >
          <span className="sr-only">Carregando produtos vinculados...</span>
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              aria-hidden="true"
              className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-[var(--field-bg)] p-3"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-11 w-24 rounded-[var(--radius-sm)]" />
            </div>
          ))}
        </div>
      ) : availableProducts.length === 0 ? (
        <div className="rounded-[var(--radius-sm)] border border-dashed border-[var(--glass-border-strong)] p-4 text-center">
          <p className="text-[length:var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--color-text-primary)]">
            Nenhum produto disponível para vincular
          </p>
          <p className="mt-1 text-[length:var(--text-xs)] text-[var(--color-text-secondary)]">
            Cadastre itens ativos na seção Estoque para associá-los aos leads.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {availableProducts.map((product) => {
            const selected = items.find(
              (item) => item.product_id === product.id,
            )

            return (
              <label
                key={product.id}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-[var(--field-bg)] p-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[length:var(--text-sm)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)]">
                    {product.name}
                  </span>
                  <span className="mt-0.5 block text-[length:var(--text-xs)] text-[var(--color-text-muted)] tabular-nums">
                    Estoque: {product.quantity_on_hand} {product.unit}
                    {product.sku ? ` · SKU ${product.sku}` : ''}
                  </span>
                </span>

                <span className="shrink-0">
                  <span className="mb-1 block text-[length:var(--text-2xs)] font-[var(--font-weight-medium)] text-[var(--color-text-secondary)]">
                    Quantidade
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    aria-label={`Quantidade de ${product.name}`}
                    disabled={disabled}
                    value={selected?.quantity ?? ''}
                    onChange={(event) =>
                      onQuantityChange(product.id, event.target.value)
                    }
                    className="crm-field w-24 text-right tabular-nums"
                    placeholder="0"
                  />
                </span>
              </label>
            )
          })}
        </div>
      )}

      <p className="text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
        Deixe a quantidade vazia para remover o vínculo. O estoque não é alterado
        enquanto o lead estiver em negociação.
      </p>
    </section>
  )
}
