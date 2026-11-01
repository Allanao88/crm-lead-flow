import { useState, type FormEvent } from 'react'
import Button from '../../components/Button'
import FormField from '../../components/FormField'
import GlassDialog from '../../components/GlassDialog'

type InventoryReversalFormProps = {
  open: boolean
  movementId: number
  reason: string
  saving: boolean
  onReasonChange: (reason: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export default function InventoryReversalForm({
  open,
  movementId,
  reason,
  saving,
  onReasonChange,
  onSubmit,
  onCancel,
}: InventoryReversalFormProps) {
  const [touched, setTouched] = useState(false)
  const reasonError =
    touched && !reason.trim() ? 'Informe o motivo do estorno.' : undefined

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    setTouched(true)
    onSubmit(event)
  }

  return (
    <GlassDialog
      open={open}
      variant="modal"
      busy={saving}
      title={`Confirmar estorno da movimentação #${movementId}`}
      description="O estorno criará um novo registro no histórico. A movimentação original será preservada."
      onClose={onCancel}
    >
      <form noValidate onSubmit={handleFormSubmit} className="space-y-4">
        <FormField label="Motivo do estorno *" error={reasonError}>
          {(fieldProps) => (
            <textarea
              {...fieldProps}
              data-autofocus
              required
              rows={3}
              maxLength={500}
              value={reason}
              onBlur={() => setTouched(true)}
              onChange={(event) => onReasonChange(event.target.value)}
              className={`${fieldProps.className} resize-y`}
              placeholder="Explique por que esta movimentação precisa ser revertida."
            />
          )}
        </FormField>

        <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--glass-border)] pt-4">
          <Button variant="secondary" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="danger"
            loading={saving}
            disabled={!reason.trim()}
          >
            Confirmar estorno
          </Button>
        </div>
      </form>
    </GlassDialog>
  )
}
