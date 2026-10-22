import { useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'lead-flow-theme'

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'dark' || saved === 'light') return saved
  } catch {
    // Usa o tema padrão se o armazenamento não estiver disponível.
  }

  return 'dark'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme

    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // O tema continua funcionando durante a sessão.
    }
  }, [theme])

  function toggleTheme() {
    setTheme((current) => current === 'dark' ? 'light' : 'dark')
  }

  return { theme, toggleTheme }
}
