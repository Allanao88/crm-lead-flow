import { useMemo, useState, type FormEvent } from 'react'
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
    <div className="mx-auto max-w-[1440px] space-y-6 p-5 sm:p-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-slate-500">AKS - Tech / CRM</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            Gestão de estoque
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Controle produtos, custos médios e movimentações do estoque compartilhado.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openMovementForm('entry')}
            disabled={activeProducts.length === 0 || saving}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Entrada
          </button>
          <button
            type="button"
            onClick={() => openMovementForm('exit')}
            disabled={activeProducts.length === 0 || saving}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            − Saída
          </button>
          <button
            type="button"
            onClick={showProductForm ? closeProductForm : openNewProductForm}
            disabled={saving}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {showProductForm ? 'Cancelar produto' : '+ Novo produto'}
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      {showProductForm && (
        <InventoryProductForm
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

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <h3 className="font-bold text-slate-900">Controle de estoque</h3>
            <p className="mt-1 text-sm text-slate-500">
              Consulte produtos, saldos e histórico de movimentações.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab('products')}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                tab === 'products'
                  ? 'bg-indigo-600 text-white'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Produtos
            </button>
            <button
              type="button"
              onClick={() => setTab('movements')}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                tab === 'movements'
                  ? 'bg-indigo-600 text-white'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Movimentações
            </button>
          </div>
        </div>

        {tab === 'products' ? (
          <InventoryProductsTable
            products={filteredProducts}
            loading={loading}
            search={search}
            onSearchChange={setSearch}
            onEdit={openEditProductForm}
          />
        ) : (
          <InventoryMovementsTable
            movements={movements}
            loading={loading}
            saving={saving}
            onReverse={startReversal}
          />
        )}
      </section>

      {reversingMovementId !== null && (
        <InventoryReversalForm
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
    </div>
  )
}
