import Button, { type ButtonVariant } from './Button'
import GlassDialog from './GlassDialog'

type ConfirmDialogProps = {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  confirmVariant?: ButtonVariant
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  confirmVariant = 'danger',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <GlassDialog
      open={open}
      variant="modal"
      busy={busy}
      title={title}
      onClose={onCancel}
    >
      <div className="space-y-5">
        <p className="text-[length:var(--text-sm)] leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]">
          {message}
        </p>

        <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--glass-border)] pt-4">
          <Button
            data-autofocus
            variant="secondary"
            disabled={busy}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>

          <Button
            variant={confirmVariant}
            loading={busy}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </GlassDialog>
  )
}
