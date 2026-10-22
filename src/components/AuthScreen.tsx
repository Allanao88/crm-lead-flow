import type { FormEvent } from 'react'

type AuthScreenProps = {
  authMode: 'login' | 'signup'
  authEmail: string
  authPassword: string
  error: string
  notice: string
  saving: boolean
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onToggleMode: () => void
}

export default function AuthScreen({
  authMode,
  authEmail,
  authPassword,
  error,
  notice,
  saving,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onToggleMode,
}: AuthScreenProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface-muted)] px-5 py-10">
      <section className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
        <div className="mb-7 flex items-center gap-3">
          <div>
            <img
              src="/brand/lead-flow.svg"
              alt="Lead Flow — CRM da AKS-Tech"
              className="h-auto w-44 max-w-full"
            />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
          {authMode === 'login' ? 'Entrar na sua conta' : 'Criar conta'}
        </h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Acesse o ambiente comercial compartilhado.
        </p>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            {notice}
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-[var(--color-text-primary)]">
            E-mail
            <input
              required
              type="email"
              autoComplete="email"
              value={authEmail}
              onChange={(event) => onEmailChange(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-focus-ring)]"
            />
          </label>

          <label className="block text-sm font-medium text-[var(--color-text-primary)]">
            Senha
            <input
              required
              type="password"
              minLength={6}
              autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
              value={authPassword}
              onChange={(event) => onPasswordChange(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-focus-ring)]"
            />
            <span className="mt-1 block text-xs text-[var(--color-text-secondary)]">
              Mínimo de 6 caracteres; use uma senha forte e exclusiva.
            </span>
          </label>

          <button
            disabled={saving}
            className="w-full rounded-xl bg-[var(--color-brand)] px-4 py-3 font-semibold text-[#1a1a1a] hover:bg-[var(--color-brand-hover)] disabled:opacity-60"
          >
            {saving
              ? 'Aguarde...'
              : authMode === 'login'
                ? 'Entrar'
                : 'Criar conta'}
          </button>
        </form>

        <button
          type="button"
          onClick={onToggleMode}
          className="mt-5 w-full text-sm font-medium text-[var(--color-brand)] hover:opacity-80"
        >
          {authMode === 'login'
            ? 'Primeiro acesso? Criar conta'
            : 'Já possui conta? Entrar'}
        </button>
      </section>
    </main>
  )
}
