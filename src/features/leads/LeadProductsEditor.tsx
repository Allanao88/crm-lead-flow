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
    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2 lg:col-span-3">
      <div>
        <h3 className="font-semibold text-slate-900">Produtos vinculados</h3>
        <p className="mt-1 text-sm text-slate-500">
          Informe a quantidade de cada produto utilizado neste lead. A baixa
          acontece quando a etapa muda para Ganho.
        </p>
      </div>

      {loadError && (
        <p role="alert" className="text-sm text-red-700">
          {loadError}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Carregando produtos vinculados...</p>
      ) : availableProducts.length === 0 ? (
        <p className="text-sm text-slate-500">
          Nenhum produto cadastrado. Cadastre produtos na seção Estoque.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {availableProducts.map((product) => {
            const selected = items.find(
              (item) => item.product_id === product.id,
            )

            return (
              <label
                key={product.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-800">
                    {product.name}
                  </span>
                  <span className="block text-xs text-slate-500">
                    Estoque: {product.quantity_on_hand} {product.unit}
                    {product.sku ? ` · SKU ${product.sku}` : ''}
                  </span>
                </span>

                <span className="shrink-0">
                  <span className="mb-1 block text-xs text-slate-500">
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
                    className="w-28 rounded-lg border border-slate-200 px-2.5 py-2 text-sm disabled:bg-slate-100"
                    placeholder="0"
                  />
                </span>
              </label>
            )
          })}
        </div>
      )}

      <p className="text-xs text-slate-500">
        Deixe a quantidade vazia para remover o vínculo. O estoque não é alterado
        enquanto o lead estiver em negociação.
      </p>
    </section>
  )
}
