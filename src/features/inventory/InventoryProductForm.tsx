import { useState, type FormEvent } from 'react'
import Button from '../../components/Button'
import FormField from '../../components/FormField'
import GlassDialog from '../../components/GlassDialog'
import type { ProductForm } from './types'

type InventoryProductFormProps = {
  open: boolean
  form: ProductForm
  editingProductId: number | null
  saving: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onUpdateField: (field: keyof ProductForm, value: string) => void
  onCancel: () => void
}

export default function InventoryProductForm({
  open,
  form,
  editingProductId,
  saving,
  onSubmit,
  onUpdateField,
  onCancel,
}: InventoryProductFormProps) {
  const [nameTouched, setNameTouched] = useState(false)

  const nameError =
    nameTouched && !form.name.trim() ? 'Informe o nome do produto.' : undefined

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    setNameTouched(true)
    onSubmit(event)
  }

  return (
    <GlassDialog
      open={open}
      variant="modal"
      busy={saving}
      title={editingProductId === null ? 'Cadastrar produto' : 'Editar produto'}
      description="O saldo e o custo médio são calculados pelas movimentações e não podem ser editados manualmente."
      onClose={onCancel}
    >
      <form
        noValidate
        onSubmit={handleFormSubmit}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <FormField
          label="Nome do produto *"
          error={nameError}
          className="sm:col-span-2"
        >
          {(fieldProps) => (
            <input
              {...fieldProps}
              data-autofocus
              required
              maxLength={200}
              value={form.name}
              onBlur={() => setNameTouched(true)}
              onChange={(event) => onUpdateField('name', event.target.value)}
              placeholder="Ex.: Roteador corporativo"
            />
          )}
        </FormField>

        <FormField label="SKU">
          {(fieldProps) => (
            <input
              {...fieldProps}
              maxLength={80}
              value={form.sku}
              onChange={(event) => onUpdateField('sku', event.target.value)}
              placeholder="Código interno único"
            />
          )}
        </FormField>

        <FormField label="Unidade de medida *">
          {(fieldProps) => (
            <select
              {...fieldProps}
              required
              value={form.unit}
              onChange={(event) => onUpdateField('unit', event.target.value)}
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
          )}
        </FormField>

        <FormField label="Descrição" className="sm:col-span-2">
          {(fieldProps) => (
            <textarea
              {...fieldProps}
              rows={3}
              maxLength={2000}
              value={form.description}
              onChange={(event) =>
                onUpdateField('description', event.target.value)
              }
              className={`${fieldProps.className} resize-y`}
              placeholder="Especificações ou observações do produto"
            />
          )}
        </FormField>

        <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--glass-border)] pt-4 sm:col-span-2">
          <Button variant="secondary" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            Salvar produto
          </Button>
        </div>
      </form>
    </GlassDialog>
  )
}
