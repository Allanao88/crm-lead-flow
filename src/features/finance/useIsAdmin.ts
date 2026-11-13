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
  const isCached =
    Boolean(userId) &&
    cachedAdminUserId === userId &&
    cachedAdminResult !== null

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (!userId) return false
    if (cachedAdminUserId === userId && cachedAdminResult !== null) {
      return cachedAdminResult
    }
    return false
  })

  const [loading, setLoading] = useState<boolean>(() => {
    if (!userId) return false
    return !isCached
  })

  useEffect(() => {
    if (!userId) {
      return
    }

    if (cachedAdminUserId === userId && cachedAdminResult !== null) {
      return
    }

    let active = true

    if (cachedAdminUserId !== userId) {
      cachedAdminUserId = userId
      cachedAdminResult = null
      cachedAdminPromise = null
    }

    const timeoutId = setTimeout(() => {
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

      void cachedAdminPromise.then((result) => {
        cachedAdminResult = result
        if (active) {
          setIsAdmin(result)
          setLoading(false)
        }
      })
    }, 0)

    return () => {
      active = false
      clearTimeout(timeoutId)
    }
  }, [userId])

  const resolvedIsAdmin =
    Boolean(userId) &&
    cachedAdminUserId === userId &&
    cachedAdminResult !== null
      ? cachedAdminResult
      : isAdmin

  return { isAdmin: resolvedIsAdmin, loading }
}
