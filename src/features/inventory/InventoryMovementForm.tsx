import { useState, type FormEvent } from 'react'
import Button from '../../components/Button'
import FormField from '../../components/FormField'
import GlassDialog from '../../components/GlassDialog'
import type { InventoryProduct, MovementForm } from './types'

type MovementType = 'entry' | 'exit'

type InventoryMovementFormProps = {
  open: boolean
  form: MovementForm
  products: InventoryProduct[]
  movementType: MovementType
  saving: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onUpdateField: (field: keyof MovementForm, value: string) => void
  onCancel: () => void
}

const quantityFormat = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 3,
})

export default function InventoryMovementForm({
  open,
  form,
  products,
  movementType,
  saving,
  onSubmit,
  onUpdateField,
  onCancel,
}: InventoryMovementFormProps) {
  const [touched, setTouched] = useState<{
    product_id?: boolean
    quantity?: boolean
    unit_cost?: boolean
  }>({})

  const qty = Number(form.quantity)
  const cost = Number(form.unit_cost)

  const productError =
    touched.product_id && !form.product_id ? 'Selecione um produto.' : undefined
  const quantityError =
    touched.quantity && (!form.quantity.trim() || !Number.isFinite(qty) || qty <= 0)
      ? 'Informe uma quantidade maior que zero.'
      : undefined
  const costError =
    movementType === 'entry' &&
    touched.unit_cost &&
    (!form.unit_cost.trim() || !Number.isFinite(cost) || cost < 0)
      ? 'Informe um custo unitário válido.'
      : undefined

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    setTouched({ product_id: true, quantity: true, unit_cost: true })
    onSubmit(event)
  }

  return (
    <GlassDialog
      open={open}
      variant="modal"
      busy={saving}
      title={`Registrar ${
        movementType === 'entry' ? 'entrada' : 'saída'
      } de estoque`}
      description={
        movementType === 'entry'
          ? 'A entrada atualiza o custo médio ponderado do produto.'
          : 'A saída será recusada se o saldo não for suficiente.'
      }
      onClose={onCancel}
    >
      <form
        noValidate
        onSubmit={handleFormSubmit}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <FormField
          label="Produto *"
          error={productError}
          className="sm:col-span-2"
        >
          {(fieldProps) => (
            <select
              {...fieldProps}
              data-autofocus
              required
              value={form.product_id}
              onBlur={() =>
                setTouched((cur) => ({ ...cur, product_id: true }))
              }
              onChange={(event) =>
                onUpdateField('product_id', event.target.value)
              }
            >
              <option value="">Selecione um produto</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} — saldo:{' '}
                  {quantityFormat.format(product.quantity_on_hand)}{' '}
                  {product.unit}
                </option>
              ))}
            </select>
          )}
        </FormField>

        <FormField
          label="Quantidade *"
          error={quantityError}
          hint="Até 3 casas decimais"
        >
          {(fieldProps) => (
            <input
              {...fieldProps}
              required
              type="number"
              min="0.001"
              step="0.001"
              value={form.quantity}
              onBlur={() => setTouched((cur) => ({ ...cur, quantity: true }))}
              onChange={(event) =>
                onUpdateField('quantity', event.target.value)
              }
              placeholder="0,000"
            />
          )}
        </FormField>

        {movementType === 'entry' && (
          <FormField
            label="Custo unitário (R$) *"
            error={costError}
            hint="Até 4 casas decimais"
          >
            {(fieldProps) => (
              <input
                {...fieldProps}
                required
                type="number"
                min="0"
                step="0.0001"
                value={form.unit_cost}
                onBlur={() =>
                  setTouched((cur) => ({ ...cur, unit_cost: true }))
                }
                onChange={(event) =>
                  onUpdateField('unit_cost', event.target.value)
                }
                placeholder="0,0000"
              />
            )}
          </FormField>
        )}

        <FormField label="Motivo / referência" className="sm:col-span-2">
          {(fieldProps) => (
            <input
              {...fieldProps}
              maxLength={500}
              value={form.reason}
              onChange={(event) => onUpdateField('reason', event.target.value)}
              placeholder="Ex.: Compra NF 123"
            />
          )}
        </FormField>

        <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--glass-border)] pt-4 sm:col-span-2">
          <Button variant="secondary" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={saving}
            disabled={products.length === 0}
          >
            Confirmar movimentação
          </Button>
        </div>
      </form>
    </GlassDialog>
  )
}
