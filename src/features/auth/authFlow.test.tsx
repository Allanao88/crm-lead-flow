import { useState } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AuthScreen from '../../components/AuthScreen'
import { useAuth } from './useAuth'

const {
  mockGetSession,
  mockOnAuthStateChange,
  mockSignInWithPassword,
  mockSignUp,
  mockResetPasswordForEmail,
  mockUpdateUser,
  mockSignOut,
  emitAuthEvent,
  resetListeners,
} = vi.hoisted(() => {
  type AuthCallback = (event: AuthChangeEvent, session: Session | null) => void
  let listeners: AuthCallback[] = []

  return {
    mockGetSession: vi.fn(),
    mockOnAuthStateChange: vi.fn((callback: AuthCallback) => {
      listeners.push(callback)
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(() => {
              listeners = listeners.filter((item) => item !== callback)
            }),
          },
        },
      }
    }),
    mockSignInWithPassword: vi.fn(),
    mockSignUp: vi.fn(),
    mockResetPasswordForEmail: vi.fn(),
    mockUpdateUser: vi.fn(),
    mockSignOut: vi.fn(),
    emitAuthEvent: (event: AuthChangeEvent, session: Session | null) => {
      for (const listener of listeners) {
        listener(event, session)
      }
    },
    resetListeners: () => {
      listeners = []
    },
  }
})

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      resetPasswordForEmail: mockResetPasswordForEmail,
      updateUser: mockUpdateUser,
      signOut: mockSignOut,
    },
  },
}))

function AuthHarness() {
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const {
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
  } = useAuth(setError, setNotice)

  if (!authReady) {
    return <p>Carregando...</p>
  }

  if (!session || passwordRecovery) {
    return (
      <AuthScreen
        authMode={authMode}
        passwordRecovery={passwordRecovery}
        authEmail={authEmail}
        authPassword={authPassword}
        recoveryPassword={recoveryPassword}
        recoveryPasswordConfirm={recoveryPasswordConfirm}
        error={error}
        notice={notice}
        saving={authSaving}
        theme="light"
        onToggleTheme={() => {}}
        onEmailChange={setAuthEmail}
        onPasswordChange={setAuthPassword}
        onRecoveryPasswordChange={setRecoveryPassword}
        onRecoveryPasswordConfirmChange={setRecoveryPasswordConfirm}
        onSubmit={(event) => void handleAuth(event)}
        onForgotPassword={() => void handleForgotPassword()}
        onSubmitRecovery={(event) => void handlePasswordUpdate(event)}
        onCancelRecovery={() => void handleCancelRecovery()}
        onToggleMode={() => {
          setAuthMode((mode) => (mode === 'login' ? 'signup' : 'login'))
          setError('')
          setNotice('')
        }}
      />
    )
  }

  return (
    <div>
      <p>Painel autenticado</p>
      {notice && <p role="status">{notice}</p>}
    </div>
  )
}

const recoverySession = {
  access_token: 'recovery-token',
  refresh_token: 'refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: 'user-1',
    email: 'allan@empresa.com.br',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00Z',
  },
} as Session

describe('Fluxo de autenticação e recuperação de senha (Fase 6)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetListeners()
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null })
    mockSignUp.mockResolvedValue({ data: { session: null }, error: null })
    mockUpdateUser.mockResolvedValue({ data: { user: recoverySession.user }, error: null })
    mockSignOut.mockResolvedValue({ error: null })
  })

  it('aciona resetPasswordForEmail com redirectTo na origem atual e exibe mensagem neutra', async () => {
    render(<AuthHarness />)

    const emailInput = await screen.findByLabelText('E-mail corporativo')
    fireEvent.change(emailInput, {
      target: { value: '  allan@empresa.com.br  ' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Esqueci a senha' }))

    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        'allan@empresa.com.br',
        { redirectTo: window.location.origin },
      )
    })

    expect(screen.getByRole('status')).toHaveTextContent(
      'Se o e-mail estiver cadastrado, você receberá um link',
    )
  })

  it('exige no mínimo 10 caracteres no cadastro antes de chamar signUp', async () => {
    render(<AuthHarness />)

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Primeiro acesso? Criar conta',
      }),
    )

    fireEvent.change(screen.getByLabelText('E-mail corporativo'), {
      target: { value: 'novo@empresa.com.br' },
    })
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'curta1234' },
    })

    const form = screen
      .getByRole('button', { name: 'Criar conta' })
      .closest('form')!
    fireEvent.submit(form)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A senha deve ter no mínimo 10 caracteres.',
    )
    expect(mockSignUp).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'SenhaForte10!' },
    })
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'novo@empresa.com.br',
        password: 'SenhaForte10!',
      })
    })
  })

  it('trata PASSWORD_RECOVERY, valida mínimo de 10 caracteres + confirmação e chama updateUser', async () => {
    render(<AuthHarness />)

    await screen.findByRole('heading', { name: 'Entrar na sua conta' })

    act(() => {
      emitAuthEvent('PASSWORD_RECOVERY', recoverySession)
    })

    expect(
      await screen.findByRole('heading', { name: 'Definir nova senha' }),
    ).toBeInTheDocument()

    const recoveryForm = screen
      .getByRole('button', { name: 'Salvar nova senha' })
      .closest('form')!

    fireEvent.change(screen.getByLabelText('Nova senha'), {
      target: { value: '123456789' },
    })
    fireEvent.change(screen.getByLabelText('Confirmar nova senha'), {
      target: { value: '123456789' },
    })
    fireEvent.submit(recoveryForm)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A nova senha deve ter no mínimo 10 caracteres.',
    )
    expect(mockUpdateUser).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Nova senha'), {
      target: { value: 'NovaSenhaForte10' },
    })
    fireEvent.change(screen.getByLabelText('Confirmar nova senha'), {
      target: { value: 'OutraSenhaForte10' },
    })
    fireEvent.submit(recoveryForm)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A confirmação de senha deve ser igual à nova senha.',
    )
    expect(mockUpdateUser).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Confirmar nova senha'), {
      target: { value: 'NovaSenhaForte10' },
    })
    fireEvent.submit(recoveryForm)

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        password: 'NovaSenhaForte10',
      })
    })

    expect(await screen.findByText('Painel autenticado')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Senha redefinida com sucesso.',
    )
  })
})
