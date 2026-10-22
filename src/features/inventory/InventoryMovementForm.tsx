import type { FormEvent } from 'react'
import type { InventoryProduct, MovementForm } from './types'

type MovementType = 'entry' | 'exit'

type InventoryMovementFormProps = {
  form: MovementForm
  products: InventoryProduct[]
  movementType: MovementType
  saving: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onUpdateField: (field: keyof MovementForm, value: string) => void
  onCancel: () => void
}

const inputClass = 'crm-field mt-1.5'
const labelClass = 'crm-field-label'
const quantityFormat = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 3,
})

export default function InventoryMovementForm({
  form,
  products,
  movementType,
  saving,
  onSubmit,
  onUpdateField,
  onCancel,
}: InventoryMovementFormProps) {
  return (
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
        onSubmit={onSubmit}
        className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <label className={labelClass}>
          Produto *
          <select
            required
            value={form.product_id}
            onChange={(event) => onUpdateField('product_id', event.target.value)}
            className={inputClass}
          >
            <option value="">Selecione um produto</option>
            {products.map((product) => (
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
            value={form.quantity}
            onChange={(event) => onUpdateField('quantity', event.target.value)}
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
              value={form.unit_cost}
              onChange={(event) => onUpdateField('unit_cost', event.target.value)}
              className={inputClass}
              placeholder="0,0000"
            />
          </label>
        )}

        <label className={labelClass}>
          Motivo / referência
          <input
            maxLength={500}
            value={form.reason}
            onChange={(event) => onUpdateField('reason', event.target.value)}
            className={inputClass}
            placeholder="Ex.: Compra NF 123"
          />
        </label>

        <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-4">
          <button
            type="submit"
            disabled={saving || products.length === 0}
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Registrando...' : 'Confirmar movimentação'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </section>
  )
}
