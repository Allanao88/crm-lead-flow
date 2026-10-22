import type { FormEvent } from 'react'
import type { ProductForm } from './types'

type InventoryProductFormProps = {
  form: ProductForm
  editingProductId: number | null
  saving: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onUpdateField: (field: keyof ProductForm, value: string) => void
  onCancel: () => void
}

const inputClass = 'crm-field mt-1.5'
const labelClass = 'crm-field-label'

export default function InventoryProductForm({
  form,
  editingProductId,
  saving,
  onSubmit,
  onUpdateField,
  onCancel,
}: InventoryProductFormProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="font-bold text-slate-900">
        {editingProductId === null ? 'Cadastrar produto' : 'Editar produto'}
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        O saldo e o custo médio são calculados pelas movimentações e não podem ser editados manualmente.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <label className={labelClass}>
          Nome do produto *
          <input
            required
            autoFocus
            maxLength={200}
            value={form.name}
            onChange={(event) => onUpdateField('name', event.target.value)}
            className={inputClass}
            placeholder="Ex.: Roteador corporativo"
          />
        </label>

        <label className={labelClass}>
          SKU
          <input
            maxLength={80}
            value={form.sku}
            onChange={(event) => onUpdateField('sku', event.target.value)}
            className={inputClass}
            placeholder="Código interno único"
          />
        </label>

        <label className={labelClass}>
          Unidade de medida *
          <select
            required
            value={form.unit}
            onChange={(event) => onUpdateField('unit', event.target.value)}
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
            value={form.description}
            onChange={(event) => onUpdateField('description', event.target.value)}
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
