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
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fc] px-5 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white">
            L
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">LeadFlow</h1>
            <p className="text-sm text-slate-500">CRM da AKS - Tech</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900">
          {authMode === 'login' ? 'Entrar na sua conta' : 'Criar conta'}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
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
          <label className="block text-sm font-medium text-slate-700">
            E-mail
            <input
              required
              type="email"
              autoComplete="email"
              value={authEmail}
              onChange={(event) => onEmailChange(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Senha
            <input
              required
              type="password"
              minLength={6}
              autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
              value={authPassword}
              onChange={(event) => onPasswordChange(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            <span className="mt-1 block text-xs text-slate-500">
              Mínimo de 6 caracteres; use uma senha forte e exclusiva.
            </span>
          </label>

          <button
            disabled={saving}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
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
          className="mt-5 w-full text-sm font-medium text-indigo-700 hover:text-indigo-900"
        >
          {authMode === 'login'
            ? 'Primeiro acesso? Criar conta'
            : 'Já possui conta? Entrar'}
        </button>
      </section>
    </main>
  )
}
