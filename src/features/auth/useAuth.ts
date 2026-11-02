import { useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

export const MIN_PASSWORD_LENGTH = 10

export const RESET_PASSWORD_NEUTRAL_NOTICE =
  'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.'

type UseAuthResult = {
  session: Session | null
  authReady: boolean
  authSaving: boolean
  authMode: 'login' | 'signup'
  passwordRecovery: boolean
  authEmail: string
  authPassword: string
  recoveryPassword: string
  recoveryPasswordConfirm: string
  setAuthEmail: (value: string) => void
  setAuthPassword: (value: string) => void
  setRecoveryPassword: (value: string) => void
  setRecoveryPasswordConfirm: (value: string) => void
  setAuthMode: (
    mode:
      | 'login'
      | 'signup'
      | ((current: 'login' | 'signup') => 'login' | 'signup'),
  ) => void
  handleAuth: (event: FormEvent<HTMLFormElement>) => Promise<void>
  handleForgotPassword: () => Promise<void>
  handlePasswordUpdate: (event: FormEvent<HTMLFormElement>) => Promise<void>
  handleCancelRecovery: () => Promise<void>
  handleLogout: () => Promise<void>
}

function isAccountEnumerationError(message: string): boolean {
  return /user not found|email not found|invalid email|no user/i.test(message)
}

export function useAuth(
  setError: (value: string) => void,
  setNotice: (value: string) => void,
): UseAuthResult {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [authSaving, setAuthSaving] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [passwordRecovery, setPasswordRecovery] = useState(() =>
    typeof window !== 'undefined' &&
    /(?:^|[&#?])type=recovery(?:&|$)/.test(
      `${window.location.hash}${window.location.search}`,
    ),
  )
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [recoveryPassword, setRecoveryPassword] = useState('')
  const [recoveryPasswordConfirm, setRecoveryPasswordConfirm] = useState('')

  useEffect(() => {
    let active = true

    async function loadSession() {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (!active) return

        if (error) setError(error.message)
        setSession(data.session)
      } catch (err) {
        if (!active) return

        setError(
          err instanceof Error
            ? err.message
            : 'Não foi possível recuperar a sessão.',
        )
      } finally {
        if (active) setAuthReady(true)
      }
    }

    void loadSession()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        if (!active) return

        if (event === 'PASSWORD_RECOVERY') {
          setError('')
          setNotice('')
          setRecoveryPassword('')
          setRecoveryPasswordConfirm('')
          setPasswordRecovery(true)
        } else if (event === 'SIGNED_OUT') {
          setPasswordRecovery(false)
          setRecoveryPassword('')
          setRecoveryPasswordConfirm('')
        }

        setSession(nextSession)
        setAuthReady(true)
      },
    )

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [setError, setNotice])

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')

    if (authMode === 'signup' && authPassword.length < MIN_PASSWORD_LENGTH) {
      setError(
        `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`,
      )
      return
    }

    setAuthSaving(true)

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        })

        if (error) throw error
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
        })

        if (error) throw error

        setNotice(
          data.session
            ? 'Conta criada com sucesso.'
            : 'Cadastro recebido. Confira seu e-mail para confirmar a conta antes de entrar.',
        )
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : ''

      setError(
        authMode === 'signup' &&
          message.includes('Database error saving new user')
          ? 'Cadastro não autorizado. Solicite ao administrador a liberação do seu e-mail.'
          : message || 'Erro de autenticação.',
      )
    } finally {
      setAuthSaving(false)
    }
  }

  async function handleForgotPassword() {
    setError('')
    setNotice('')

    const email = authEmail.trim()
    if (!email) {
      setError(
        'Informe seu e-mail corporativo para receber o link de recuperação.',
      )
      return
    }

    setAuthSaving(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      })

      if (error && !isAccountEnumerationError(error.message)) {
        setError(
          'Não foi possível solicitar a recuperação de senha no momento. Tente novamente em instantes.',
        )
        return
      }

      setNotice(RESET_PASSWORD_NEUTRAL_NOTICE)
    } catch {
      setError(
        'Não foi possível solicitar a recuperação de senha no momento. Tente novamente em instantes.',
      )
    } finally {
      setAuthSaving(false)
    }
  }

  async function handlePasswordUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')

    if (recoveryPassword.length < MIN_PASSWORD_LENGTH) {
      setError(
        `A nova senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`,
      )
      return
    }

    if (recoveryPassword !== recoveryPasswordConfirm) {
      setError('A confirmação de senha deve ser igual à nova senha.')
      return
    }

    setAuthSaving(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: recoveryPassword,
      })

      if (error) throw error

      setRecoveryPassword('')
      setRecoveryPasswordConfirm('')
      setPasswordRecovery(false)
      setNotice('Senha redefinida com sucesso.')
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      setError(message || 'Não foi possível redefinir a senha.')
    } finally {
      setAuthSaving(false)
    }
  }

  async function handleCancelRecovery() {
    setError('')
    setNotice('')
    setRecoveryPassword('')
    setRecoveryPasswordConfirm('')
    setPasswordRecovery(false)
    await supabase.auth.signOut()
  }

  async function handleLogout() {
    setError('')
    const { error } = await supabase.auth.signOut()

    if (error) setError(`Não foi possível sair: ${error.message}`)
  }

  return {
    session,
    authReady,
    authSaving,
    authMode,
    passwordRecovery,
    authEmail,
    authPassword,
    recoveryPassword,
    recoveryPasswordConfirm,
    setAuthEmail,
    setAuthPassword,
    setRecoveryPassword,
    setRecoveryPasswordConfirm,
    setAuthMode,
    handleAuth,
    handleForgotPassword,
    handlePasswordUpdate,
    handleCancelRecovery,
    handleLogout,
  }
}
