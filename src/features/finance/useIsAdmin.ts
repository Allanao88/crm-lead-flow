import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

let cachedAdminUserId: string | null = null
let cachedAdminPromise: Promise<boolean> | null = null
let cachedAdminResult: boolean | null = null

export function resetIsAdminCache() {
  cachedAdminUserId = null
  cachedAdminPromise = null
  cachedAdminResult = null
}

export function useIsAdmin(userId: string | null) {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (!userId) return false
    if (cachedAdminUserId === userId && cachedAdminResult !== null) {
      return cachedAdminResult
    }
    return false
  })

  const [loading, setLoading] = useState<boolean>(() => {
    if (!userId) return false
    return !(cachedAdminUserId === userId && cachedAdminResult !== null)
  })

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false)
      setLoading(false)
      return
    }

    if (cachedAdminUserId === userId && cachedAdminResult !== null) {
      setIsAdmin(cachedAdminResult)
      setLoading(false)
      return
    }

    let active = true

    if (cachedAdminUserId !== userId) {
      cachedAdminUserId = userId
      cachedAdminResult = null
      cachedAdminPromise = null
    }

    setLoading(true)

    if (!cachedAdminPromise) {
      cachedAdminPromise = (async () => {
        try {
          const { data, error } = await supabase.rpc('is_admin')
          if (error) {
            return false
          }
          return Boolean(data)
        } catch {
          return false
        }
      })()
    }

    cachedAdminPromise.then((result) => {
      cachedAdminResult = result
      if (active) {
        setIsAdmin(result)
        setLoading(false)
      }
    })

    return () => {
      active = false
    }
  }, [userId])

  return { isAdmin, loading }
}
