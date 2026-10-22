import type { FormEvent } from 'react'

type InventoryReversalFormProps = {
  movementId: number
  reason: string
  saving: boolean
  onReasonChange: (reason: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

const inputClass = 'crm-field mt-1.5'
const labelClass = 'crm-field-label'

export default function InventoryReversalForm({
  movementId,
  reason,
  saving,
  onReasonChange,
  onSubmit,
  onCancel,
}: InventoryReversalFormProps) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
      <h3 className="font-bold text-amber-900">
        Confirmar estorno da movimentação #{movementId}
      </h3>
      <p className="mt-1 text-sm text-amber-800">
        O estorno criará um novo registro no histórico. A movimentação original será preservada.
      </p>
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <label className={labelClass}>
          Motivo do estorno *
          <textarea
            required
            autoFocus
            rows={2}
            maxLength={500}
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            className={inputClass}
            placeholder="Explique por que esta movimentação precisa ser revertida."
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving || !reason.trim()}
            className="rounded-xl bg-amber-700 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
          >
            {saving ? 'Registrando...' : 'Confirmar estorno'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-xl border border-amber-300 px-5 py-3 text-sm font-semibold text-amber-900 hover:bg-amber-100"
          >
            Cancelar
          </button>
        </div>
      </form>
    </section>
  )
}
