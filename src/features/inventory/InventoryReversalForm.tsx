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
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6">
      <h3 className="font-bold text-[var(--color-text-primary)]">
        Confirmar estorno da movimentação #{movementId}
      </h3>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
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
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-5 py-3 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-brand-soft)]"
          >
            Cancelar
          </button>
        </div>
      </form>
    </section>
  )
}
