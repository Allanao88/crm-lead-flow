import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../../lib/supabase'
import { resetIsAdminCache, useIsAdmin } from './useIsAdmin'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}))

describe('useIsAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetIsAdminCache()
  })

  it('returns isAdmin false and loading false when userId is null', () => {
    const { result } = renderHook(() => useIsAdmin(null))

    expect(result.current.isAdmin).toBe(false)
    expect(result.current.loading).toBe(false)
    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it('queries is_admin RPC and returns true when user is admin', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: true,
      error: null,
    } as any)

    const { result } = renderHook(() => useIsAdmin('user-1'))

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isAdmin).toBe(true)
    expect(supabase.rpc).toHaveBeenCalledWith('is_admin')
  })

  it('returns false when is_admin returns error or false', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { message: 'permission denied' },
    } as any)

    const { result } = renderHook(() => useIsAdmin('user-2'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isAdmin).toBe(false)
  })

  it('caches the result for the same user and avoids multiple RPC calls', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: true,
      error: null,
    } as any)

    const { result: firstResult } = renderHook(() => useIsAdmin('user-admin'))

    await waitFor(() => {
      expect(firstResult.current.isAdmin).toBe(true)
    })

    expect(supabase.rpc).toHaveBeenCalledTimes(1)

    // Second call with same user should use cache
    const { result: secondResult } = renderHook(() => useIsAdmin('user-admin'))

    expect(secondResult.current.isAdmin).toBe(true)
    expect(secondResult.current.loading).toBe(false)
    expect(supabase.rpc).toHaveBeenCalledTimes(1)
  })
})
