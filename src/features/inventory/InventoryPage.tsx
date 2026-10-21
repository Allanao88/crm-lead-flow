import { useMemo, useState, type FormEvent } from 'react'
import type {
  InventoryMovement,
  InventoryProduct,
  MovementForm,
  ProductForm,
} from './types'
import { emptyMovementForm, emptyProductForm } from './types'

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

const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

const inputClass =
  'mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'

const labelClass = 'text-sm font-medium text-slate-700'

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
        <MetricCard
          label="Produtos cadastrados"
          value={products.length.toLocaleString('pt-BR')}
          detail={`${activeProducts.length} ativos`}
        />
        <MetricCard
          label="Unidades em estoque"
          value={quantityFormat.format(totalUnits)}
          detail="Saldo consolidado dos produtos"
        />
        <MetricCard
          label="Valor do estoque"
          value={currency.format(inventoryValue)}
          detail="Quantidade × custo médio atual"
        />
        <MetricCard
          label="Movimentações recentes"
          value={movements.length.toLocaleString('pt-BR')}
          detail="Até 200 registros mais recentes"
        />
      </section>

      {showProductForm && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="font-bold text-slate-900">
            {editingProductId === null ? 'Cadastrar produto' : 'Editar produto'}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            O saldo e o custo médio são calculados pelas movimentações e não podem ser editados manualmente.
          </p>

          <form
            onSubmit={submitProduct}
            className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <label className={labelClass}>
              Nome do produto *
              <input
                required
                autoFocus
                maxLength={200}
                value={productForm.name}
                onChange={(event) => updateProductField('name', event.target.value)}
                className={inputClass}
                placeholder="Ex.: Roteador corporativo"
              />
            </label>

            <label className={labelClass}>
              SKU
              <input
                maxLength={80}
                value={productForm.sku}
                onChange={(event) => updateProductField('sku', event.target.value)}
                className={inputClass}
                placeholder="Código interno único"
              />
            </label>

            <label className={labelClass}>
              Unidade de medida *
              <select
                required
                value={productForm.unit}
                onChange={(event) => updateProductField('unit', event.target.value)}
                className={inputClass}
              >
                <option value="un">Unidade (un)</option>
                <option value="cx">Caixa (cx)</option>
                <option value="pc">Peça (pc)</option>
                <option value="kg">Quilograma (kg)</option>
                <option value="g">Grama (g)</option>
                <option value="l">Litro (l)</option>
                <option value="m">Metro (m)</option>
                <option value="m2">Metro quadrado (m²)</option>
                <option value="m3">Metro cúbico (m³)</option>
                <option value="h">Hora (h)</option>
              </select>
            </label>

            <label className={`${labelClass} sm:col-span-2 lg:col-span-3`}>
              Descrição
              <textarea
                rows={3}
                maxLength={2000}
                value={productForm.description}
                onChange={(event) =>
                  updateProductField('description', event.target.value)
                }
                className={inputClass}
                placeholder="Especificações ou observações do produto"
              />
            </label>

            <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar produto'}
              </button>
              <button
                type="button"
                onClick={closeProductForm}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      {showMovementForm && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="font-bold text-slate-900">
            Registrar {movementType === 'entry' ? 'entrada' : 'saída'} de estoque
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {movementType === 'entry'
              ? 'A entrada atualiza o custo médio ponderado do produto.'
              : 'A saída será recusada se o saldo não for suficiente.'}
          </p>

          <form
            onSubmit={submitMovement}
            className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <label className={labelClass}>
              Produto *
              <select
                required
                value={movementForm.product_id}
                onChange={(event) =>
                  updateMovementField('product_id', event.target.value)
                }
                className={inputClass}
              >
                <option value="">Selecione um produto</option>
                {activeProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} — saldo: {quantityFormat.format(product.quantity_on_hand)} {product.unit}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClass}>
              Quantidade *
              <input
                required
                type="number"
                min="0.001"
                step="0.001"
                value={movementForm.quantity}
                onChange={(event) =>
                  updateMovementField('quantity', event.target.value)
                }
                className={inputClass}
                placeholder="0,000"
              />
            </label>

            {movementType === 'entry' && (
              <label className={labelClass}>
                Custo unitário (R$) *
                <input
                  required
                  type="number"
                  min="0"
                  step="0.0001"
                  value={movementForm.unit_cost}
                  onChange={(event) =>
                    updateMovementField('unit_cost', event.target.value)
                  }
                  className={inputClass}
                  placeholder="0,0000"
                />
              </label>
            )}

            <label className={labelClass}>
              Motivo / referência
              <input
                maxLength={500}
                value={movementForm.reason}
                onChange={(event) =>
                  updateMovementField('reason', event.target.value)
                }
                className={inputClass}
                placeholder="Ex.: Compra NF 123"
              />
            </label>

            <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-4">
              <button
                type="submit"
                disabled={saving || activeProducts.length === 0}
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Registrando...' : 'Confirmar movimentação'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMovementForm(false)
                  setMovementForm(emptyMovementForm)
                  clearMessages()
                }}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
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
          <>
            <div className="border-b border-slate-100 p-4 sm:px-6">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 sm:max-w-md"
                placeholder="Buscar por produto, SKU ou descrição..."
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Produto</th>
                    <th className="px-5 py-3 font-semibold">SKU</th>
                    <th className="px-5 py-3 text-right font-semibold">Saldo</th>
                    <th className="px-5 py-3 text-right font-semibold">Custo médio</th>
                    <th className="px-5 py-3 text-right font-semibold">Valor em estoque</th>
                    <th className="px-5 py-3 font-semibold">Situação</th>
                    <th className="px-5 py-3 text-right font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                        Carregando estoque...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                        {search
                          ? 'Nenhum produto corresponde à busca.'
                          : 'Nenhum produto cadastrado. Comece adicionando um produto.'}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">{product.name}</p>
                          {product.description && (
                            <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                              {product.description}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-600">{product.sku || '—'}</td>
                        <td className="px-5 py-4 text-right font-semibold tabular-nums text-slate-900">
                          {quantityFormat.format(product.quantity_on_hand)} {product.unit}
                        </td>
                        <td className="px-5 py-4 text-right tabular-nums text-slate-700">
                          {currency.format(product.average_cost)}
                        </td>
                        <td className="px-5 py-4 text-right font-medium tabular-nums text-slate-900">
                          {currency.format(product.quantity_on_hand * product.average_cost)}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            !product.is_active
                              ? 'bg-slate-100 text-slate-500'
                              : product.quantity_on_hand <= 0
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {!product.is_active
                              ? 'Inativo'
                              : product.quantity_on_hand <= 0
                                ? 'Sem estoque'
                                : 'Disponível'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => openEditProductForm(product)}
                            className="font-semibold text-indigo-600 hover:text-indigo-800"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Data</th>
                  <th className="px-5 py-3 font-semibold">Produto</th>
                  <th className="px-5 py-3 font-semibold">Tipo</th>
                  <th className="px-5 py-3 text-right font-semibold">Quantidade</th>
                  <th className="px-5 py-3 text-right font-semibold">Custo unitário</th>
                  <th className="px-5 py-3 text-right font-semibold">Custo total</th>
                  <th className="px-5 py-3 font-semibold">Motivo</th>
                  <th className="px-5 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-slate-500">
                      Carregando movimentações...
                    </td>
                  </tr>
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-slate-500">
                      Nenhuma movimentação registrada.
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
                      <tr key={movement.id} className="hover:bg-slate-50/70">
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {dateFormat.format(new Date(movement.created_at))}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {movement.product?.name ?? `Produto #${movement.product_id}`}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isEntry
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}>
                            {typeLabel}
                          </span>
                          {movement.lead_id !== null && (
                            <p className="mt-1 text-xs text-slate-500">
                              Lead #{movement.lead_id}
                            </p>
                          )}
                        </td>
                        <td className={`px-5 py-4 text-right tabular-nums ${
                          movement.quantity_delta < 0
                            ? 'text-rose-600'
                            : 'text-emerald-700'
                        }`}>
                          {movement.quantity_delta > 0 ? '+' : ''}
                          {quantityFormat.format(movement.quantity_delta)}
                        </td>
                        <td className="px-5 py-4 text-right tabular-nums text-slate-700">
                          {currency.format(movement.unit_cost)}
                        </td>
                        <td className="px-5 py-4 text-right tabular-nums text-slate-700">
                          {currency.format(movement.total_cost)}
                        </td>
                        <td className="max-w-xs px-5 py-4 text-slate-600">
                          <p className="truncate" title={movement.reason}>
                            {movement.reason || '—'}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {!isReversal && (
                            <button
                              type="button"
                              onClick={() => startReversal(movement)}
                              disabled={saving}
                              className="font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                            >
                              Estornar
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {reversingMovementId !== null && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
          <h3 className="font-bold text-amber-900">
            Confirmar estorno da movimentação #{reversingMovementId}
          </h3>
          <p className="mt-1 text-sm text-amber-800">
            O estorno criará um novo registro no histórico. A movimentação original será preservada.
          </p>
          <form onSubmit={submitReversal} className="mt-4 space-y-4">
            <label className={labelClass}>
              Motivo do estorno *
              <textarea
                required
                autoFocus
                rows={2}
                maxLength={500}
                value={reversalReason}
                onChange={(event) => setReversalReason(event.target.value)}
                className={inputClass}
                placeholder="Explique por que esta movimentação precisa ser revertida."
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving || !reversalReason.trim()}
                className="rounded-xl bg-amber-700 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
              >
                {saving ? 'Registrando...' : 'Confirmar estorno'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setReversingMovementId(null)
                  setReversalReason('')
                  clearMessages()
                }}
                disabled={saving}
                className="rounded-xl border border-amber-300 px-5 py-3 text-sm font-semibold text-amber-900 hover:bg-amber-100"
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  )
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </section>
  )
}
