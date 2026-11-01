import { useId, type ReactNode } from 'react'

type FieldChildProps = {
  id: string
  'aria-invalid'?: true
  'aria-describedby'?: string
  className: string
}

type FormFieldProps = {
  label: string
  error?: string
  hint?: string
  className?: string
  children: (fieldProps: FieldChildProps) => ReactNode
}

export default function FormField({
  label,
  error,
  hint,
  className = '',
  children,
}: FormFieldProps) {
  const generatedId = useId()
  const hintId = hint ? `${generatedId}-hint` : undefined
  const errorId = error ? `${generatedId}-error` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className={className}>
      <label htmlFor={generatedId} className="crm-field-label">
        {label}
      </label>

      {children({
        id: generatedId,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
        className: `crm-field mt-1.5 ${error ? 'crm-field--error' : ''}`.trim(),
      })}

      {hint && !error && (
        <p id={hintId} className="crm-field-hint">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="crm-field-error">
          <svg
            aria-hidden="true"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4.5M12 16h.01" />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

