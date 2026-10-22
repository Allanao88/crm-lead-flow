import { useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

type UseAuthResult = {
  session: Session | null
  authReady: boolean
  authSaving: boolean
  authMode: 'login' | 'signup'
  authEmail: string
  authPassword: string
  setAuthEmail: (value: string) => void
  setAuthPassword: (value: string) => void
  setAuthMode: (mode: 'login' | 'signup' | ((current: 'login' | 'signup') => 'login' | 'signup')) => void
  handleAuth: (event: FormEvent<HTMLFormElement>) => Promise<void>
  handleLogout: () => Promise<void>
}

export function useAuth(
  setError: (value: string) => void,
  setNotice: (value: string) => void,
): UseAuthResult {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [authSaving, setAuthSaving] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')

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
      (_event, nextSession) => {
        if (!active) return

        setSession(nextSession)
        setAuthReady(true)
      },
    )

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [setError])

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
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
    authEmail,
    authPassword,
    setAuthEmail,
    setAuthPassword,
    setAuthMode,
    handleAuth,
    handleLogout,
  }
}
