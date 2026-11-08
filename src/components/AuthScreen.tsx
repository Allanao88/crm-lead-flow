import type { FormEvent } from 'react'
import { MIN_PASSWORD_LENGTH } from '../features/auth/useAuth'
import type { Theme } from '../hooks/useTheme'
import Button from './Button'
import FormField from './FormField'
import Footer from './Footer'
import BrandLogo from './BrandLogo'
import { brand } from '../config/brand'

type AuthScreenProps = {
  authMode: 'login' | 'signup'
  passwordRecovery?: boolean
  authEmail: string
  authPassword: string
  recoveryPassword?: string
  recoveryPasswordConfirm?: string
  error: string
  notice: string
  saving: boolean
  theme: Theme
  onToggleTheme: () => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onRecoveryPasswordChange?: (value: string) => void
  onRecoveryPasswordConfirmChange?: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onForgotPassword?: () => void
  onSubmitRecovery?: (event: FormEvent<HTMLFormElement>) => void
  onCancelRecovery?: () => void
  onToggleMode: () => void
}

export default function AuthScreen({
  authMode,
  passwordRecovery = false,
  authEmail,
  authPassword,
  recoveryPassword = '',
  recoveryPasswordConfirm = '',
  error,
  notice,
  saving,
  theme,
  onToggleTheme,
  onEmailChange,
  onPasswordChange,
  onRecoveryPasswordChange = () => {},
  onRecoveryPasswordConfirmChange = () => {},
  onSubmit,
  onForgotPassword = () => {},
  onSubmitRecovery = () => {},
  onCancelRecovery = () => {},
  onToggleMode,
}: AuthScreenProps) {
  const heading = passwordRecovery
    ? 'Definir nova senha'
    : authMode === 'login'
      ? 'Entrar na sua conta'
      : 'Criar conta'

  const description = passwordRecovery
    ? `Escolha uma nova senha com no mínimo ${MIN_PASSWORD_LENGTH} caracteres para concluir a recuperação.`
    : authMode === 'login'
      ? 'Acesse o ambiente comercial compartilhado da equipe.'
      : 'Cadastre seu e-mail corporativo autorizado para acessar o CRM.'

  return (
    <main className="crm-app-canvas relative flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6">
      <div className="mb-4 flex w-full max-w-md justify-end">
        <Button
          variant="secondary"
          size="sm"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
          title={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
        >
          {theme === 'dark' ? (
            <svg
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          )}
          <span>{theme === 'dark' ? 'Tema claro' : 'Tema escuro'}</span>
        </Button>
      </div>

      <section className="glass-strong crm-page-transition relative w-full max-w-md overflow-hidden rounded-[var(--radius-xl)] p-7 sm:p-9">
        {saving && (
          <div
            role="progressbar"
            aria-label="Autenticando"
            className="crm-top-progress"
          />
        )}

        <div className="mb-7 flex items-center justify-between gap-3.5">
          <div className="flex items-center gap-3.5 min-w-0">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-[var(--glass-bg-subtle)] shadow-[var(--shadow-xs)]">
              <img
                src="/brand/lead-flow-icon.svg"
                alt=""
                aria-hidden="true"
                className="h-8 w-8 shrink-0"
              />
            </span>
            <div className="min-w-0">
              <p className="text-[length:var(--text-lg)] font-[var(--font-weight-bold)] tracking-[var(--tracking-tight)] text-[var(--color-text-primary)]">
                LeadFlow
              </p>
              <p className="mt-0.5 text-[length:var(--text-2xs)] font-[var(--font-weight-semibold)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-text-muted)]">
                CRM Comercial · {brand.clientName}
              </p>
            </div>
          </div>
          <BrandLogo size="md" />
        </div>

        <h1 className="text-[length:var(--text-xl)] font-[var(--font-weight-bold)] tracking-[var(--tracking-tight)] text-[var(--color-text-primary)]">
          {heading}
        </h1>
        <p className="mt-1.5 text-[length:var(--text-sm)] text-[var(--color-text-secondary)]">
          {description}
        </p>

        {error && (
          <p role="alert" className="crm-callout crm-callout--danger mt-5">
            {error}
          </p>
        )}

        {notice && (
          <p role="status" className="crm-callout crm-callout--success mt-5">
            {notice}
          </p>
        )}

        {passwordRecovery ? (
          <>
            <form onSubmit={onSubmitRecovery} className="mt-6 space-y-4">
              <FormField
                label="Nova senha"
                hint={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres; use uma senha forte e exclusiva.`}
              >
                {(fieldProps) => (
                  <input
                    {...fieldProps}
                    required
                    type="password"
                    minLength={MIN_PASSWORD_LENGTH}
                    placeholder="••••••••••"
                    autoComplete="new-password"
                    value={recoveryPassword}
                    onChange={(event) =>
                      onRecoveryPasswordChange(event.target.value)
                    }
                  />
                )}
              </FormField>

              <FormField label="Confirmar nova senha">
                {(fieldProps) => (
                  <input
                    {...fieldProps}
                    required
                    type="password"
                    minLength={MIN_PASSWORD_LENGTH}
                    placeholder="••••••••••"
                    autoComplete="new-password"
                    value={recoveryPasswordConfirm}
                    onChange={(event) =>
                      onRecoveryPasswordConfirmChange(event.target.value)
                    }
                  />
                )}
              </FormField>

              <div className="pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  loading={saving}
                  className="w-full"
                >
                  Salvar nova senha
                </Button>
              </div>
            </form>

            <div className="mt-5 border-t border-[var(--glass-border)] pt-4 text-center">
              <Button
                variant="ghost"
                size="sm"
                disabled={saving}
                onClick={onCancelRecovery}
                className="w-full"
              >
                Voltar para o login
              </Button>
            </div>
          </>
        ) : (
          <>
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <FormField label="E-mail corporativo">
                {(fieldProps) => (
                  <input
                    {...fieldProps}
                    required
                    type="email"
                    autoComplete="email"
                    placeholder="nome@empresa.com.br"
                    value={authEmail}
                    onChange={(event) => onEmailChange(event.target.value)}
                  />
                )}
              </FormField>

              <FormField
                label="Senha"
                hint={
                  authMode === 'signup'
                    ? `Mínimo de ${MIN_PASSWORD_LENGTH} caracteres; use uma senha forte e exclusiva.`
                    : undefined
                }
              >
                {(fieldProps) => (
                  <input
                    {...fieldProps}
                    required
                    type="password"
                    minLength={
                      authMode === 'signup' ? MIN_PASSWORD_LENGTH : undefined
                    }
                    placeholder="••••••••••"
                    autoComplete={
                      authMode === 'login' ? 'current-password' : 'new-password'
                    }
                    value={authPassword}
                    onChange={(event) => onPasswordChange(event.target.value)}
                  />
                )}
              </FormField>

              {authMode === 'login' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={onForgotPassword}
                    className="text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] text-[var(--color-brand)] transition-colors hover:underline focus-visible:outline-none focus-visible:underline disabled:opacity-50"
                  >
                    Esqueci a senha
                  </button>
                </div>
              )}

              <div className="pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  loading={saving}
                  className="w-full"
                >
                  {authMode === 'login' ? 'Entrar' : 'Criar conta'}
                </Button>
              </div>
            </form>

            <div className="mt-5 border-t border-[var(--glass-border)] pt-4 text-center">
              <Button
                variant="ghost"
                size="sm"
                disabled={saving}
                onClick={onToggleMode}
                className="w-full"
              >
                {authMode === 'login'
                  ? 'Primeiro acesso? Criar conta'
                  : 'Já possui conta? Entrar'}
              </Button>
            </div>
          </>
        )}
      </section>

      <Footer className="mt-6" />
    </main>
  )
}
