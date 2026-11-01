import { useMemo, useState, type FormEvent } from 'react'
import Button from '../../components/Button'
import { MetricCardSkeleton } from '../../components/Skeleton'
import type {
  InventoryMovement,
  InventoryProduct,
  MovementForm,
  ProductForm,
} from './types'
import { emptyMovementForm, emptyProductForm } from './types'
import InventoryMetricCard from './InventoryMetricCard'
import InventoryProductsTable from './InventoryProductsTable'
import InventoryMovementsTable from './InventoryMovementsTable'
import InventoryProductForm from './InventoryProductForm'
import InventoryMovementForm from './InventoryMovementForm'
import InventoryReversalForm from './InventoryReversalForm'

type InventoryPageProps = {
  products: InventoryProduct[]
  movements: InventoryMovement[]
  loading: boolean
  saving: boolean
  onSaveProduct: (
    form: ProductForm,
    productId: number | null,
  ) => Promise<boolean>
  onRegisterMovement: (
    form: MovementForm,
    movementType: 'entry' | 'exit',
  ) => Promise<boolean>
  onReverseMovement: (
    movementId: number,
    reason: string,
  ) => Promise<boolean>
  onError: (message: string) => void
  onNotice: (message: string) => void
}

type InventoryTab = 'products' | 'movements'
type MovementType = 'entry' | 'exit'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const quantityFormat = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 3,
})

export default function InventoryPage({
  products,
  movements,
  loading,
  saving,
  onSaveProduct,
  onRegisterMovement,
  onReverseMovement,
  onError,
  onNotice,
}: InventoryPageProps) {
  const [tab, setTab] = useState<InventoryTab>('products')
  const [search, setSearch] = useState('')
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProductId, setEditingProductId] = useState<number | null>(null)
  const [productForm, setProductForm] =
    useState<ProductForm>(emptyProductForm)
  const [showMovementForm, setShowMovementForm] = useState(false)
  const [movementType, setMovementType] = useState<MovementType>('entry')
  const [movementForm, setMovementForm] =
    useState<MovementForm>(emptyMovementForm)
  const [reversingMovementId, setReversingMovementId] = useState<number | null>(
    null,
  )
  const [reversalReason, setReversalReason] = useState('')

  const activeProducts = useMemo(
    () => products.filter((product) => product.is_active),
    [products],
  )

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase()

    return products.filter((product) =>
      [product.name, product.sku ?? '', product.description ?? '']
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
  }, [products, search])

  const totalUnits = products.reduce(
    (total, product) => total + product.quantity_on_hand,
    0,
  )

  const inventoryValue = products.reduce(
    (total, product) =>
      total + product.quantity_on_hand * product.average_cost,
    0,
  )

  function clearMessages() {
    onError('')
    onNotice('')
  }

  function closeProductForm() {
    setShowProductForm(false)
    setEditingProductId(null)
    setProductForm(emptyProductForm)
    clearMessages()
  }

  function openNewProductForm() {
    setProductForm(emptyProductForm)
    setEditingProductId(null)
    setShowProductForm(true)
    clearMessages()
  }

  function openEditProductForm(product: InventoryProduct) {
    setProductForm({
      name: product.name,
      sku: product.sku ?? '',
      description: product.description ?? '',
      unit: product.unit,
    })
    setEditingProductId(product.id)
    setShowProductForm(true)
    clearMessages()
  }

  function updateProductField(field: keyof ProductForm, value: string) {
    setProductForm((current) => ({ ...current, [field]: value }))
  }

  function updateMovementField(field: keyof MovementForm, value: string) {
    setMovementForm((current) => ({ ...current, [field]: value }))
  }

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const saved = await onSaveProduct(productForm, editingProductId)

    if (saved) {
      closeProductForm()
      setSearch('')
    }
  }

  function openMovementForm(type: MovementType) {
    setMovementType(type)
    setMovementForm({
      ...emptyMovementForm,
      product_id: activeProducts[0] ? String(activeProducts[0].id) : '',
    })
    setShowMovementForm(true)
    clearMessages()
  }

  async function submitMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const saved = await onRegisterMovement(movementForm, movementType)

    if (saved) {
      setShowMovementForm(false)
      setMovementForm(emptyMovementForm)
    }
  }

  async function submitReversal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (reversingMovementId === null) return

    const saved = await onReverseMovement(
      reversingMovementId,
      reversalReason,
    )

    if (saved) {
      setReversingMovementId(null)
      setReversalReason('')
    }
  }

  function startReversal(movement: InventoryMovement) {
    setReversingMovementId(movement.id)
    setReversalReason('')
    clearMessages()
  }

  return (
    <div className="crm-page">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-[length:var(--text-sm)] text-[var(--color-text-secondary)]">
            Controle produtos, custos médios e movimentações do estoque compartilhado.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => openMovementForm('entry')}
            disabled={activeProducts.length === 0 || saving}
          >
            + Entrada
          </Button>
          <Button
            variant="secondary"
            onClick={() => openMovementForm('exit')}
            disabled={activeProducts.length === 0 || saving}
          >
            − Saída
          </Button>
          <Button
            variant="primary"
            onClick={openNewProductForm}
            disabled={saving}
          >
            + Novo produto
          </Button>
        </div>
      </section>

      {loading && products.length === 0 ? (
        <section
          aria-label="Carregando indicadores do estoque"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <MetricCardSkeleton key={index} />
          ))}
        </section>
      ) : (
        <section className="crm-stagger-cards grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <InventoryMetricCard
            label="Produtos cadastrados"
            value={products.length.toLocaleString('pt-BR')}
            detail={`${activeProducts.length} ativos`}
          />
          <InventoryMetricCard
            label="Unidades em estoque"
            value={quantityFormat.format(totalUnits)}
            detail="Saldo consolidado dos produtos"
          />
          <InventoryMetricCard
            label="Valor do estoque"
            value={currency.format(inventoryValue)}
            detail="Quantidade × custo médio atual"
          />
          <InventoryMetricCard
            label="Movimentações recentes"
            value={movements.length.toLocaleString('pt-BR')}
            detail="Até 200 registros mais recentes"
          />
        </section>
      )}

      {showProductForm && (
        <InventoryProductForm
          open={showProductForm}
          key={editingProductId ?? 'new-product'}
          form={productForm}
          editingProductId={editingProductId}
          saving={saving}
          onSubmit={submitProduct}
          onUpdateField={updateProductField}
          onCancel={closeProductForm}
        />
      )}

      {showMovementForm && (
        <InventoryMovementForm
          open={showMovementForm}
          key={movementType}
          form={movementForm}
          products={activeProducts}
          movementType={movementType}
          saving={saving}
          onSubmit={submitMovement}
          onUpdateField={updateMovementField}
          onCancel={() => {
            setShowMovementForm(false)
            setMovementForm(emptyMovementForm)
            clearMessages()
          }}
        />
      )}

      <section className="crm-panel">
        <div className="flex flex-col justify-between gap-4 border-b border-[var(--glass-border)] p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <h2 className="crm-section-title">Controle de estoque</h2>
            <p className="mt-1 text-[length:var(--text-sm)] text-[var(--color-text-secondary)]">
              Consulte produtos, saldos e histórico de movimentações.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Visualização do estoque"
            className="glass-subtle inline-flex self-start rounded-full p-1 sm:self-auto"
          >
            <button
              id="inventory-tab-products"
              type="button"
              role="tab"
              aria-selected={tab === 'products'}
              aria-controls="inventory-panel-products"
              onClick={() => setTab('products')}
              className={`min-h-9 rounded-full px-4 py-1.5 text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] ${
                tab === 'products'
                  ? 'bg-[var(--color-brand)] text-[var(--color-brand-text)] shadow-[var(--shadow-xs)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Produtos
            </button>
            <button
              id="inventory-tab-movements"
              type="button"
              role="tab"
              aria-selected={tab === 'movements'}
              aria-controls="inventory-panel-movements"
              onClick={() => setTab('movements')}
              className={`min-h-9 rounded-full px-4 py-1.5 text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] ${
                tab === 'movements'
                  ? 'bg-[var(--color-brand)] text-[var(--color-brand-text)] shadow-[var(--shadow-xs)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Movimentações
            </button>
          </div>
        </div>

        {tab === 'products' ? (
          <div
            id="inventory-panel-products"
            role="tabpanel"
            aria-labelledby="inventory-tab-products"
          >
            <InventoryProductsTable
              products={filteredProducts}
              loading={loading}
              search={search}
              onSearchChange={setSearch}
              onCreateProduct={openNewProductForm}
              onEdit={openEditProductForm}
            />
          </div>
        ) : (
          <div
            id="inventory-panel-movements"
            role="tabpanel"
            aria-labelledby="inventory-tab-movements"
          >
            <InventoryMovementsTable
              movements={movements}
              loading={loading}
              saving={saving}
              hasActiveProducts={activeProducts.length > 0}
              onCreateEntry={
                activeProducts.length > 0
                  ? () => openMovementForm('entry')
                  : openNewProductForm
              }
              onReverse={startReversal}
            />
          </div>
        )}
      </section>

      {reversingMovementId !== null && (
        <InventoryReversalForm
          open={reversingMovementId !== null}
          key={reversingMovementId}
          movementId={reversingMovementId}
          reason={reversalReason}
          saving={saving}
          onReasonChange={setReversalReason}
          onSubmit={submitReversal}
          onCancel={() => {
            setReversingMovementId(null)
            setReversalReason('')
            clearMessages()
          }}
        />
      )}
      <footer className="pb-2 text-center text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
        LeadFlow CRM · AKS - Tech
      </footer>
    </div>
  )
}
