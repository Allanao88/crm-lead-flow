import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

export type LeadProductItem = {
  product_id: number
  quantity: string
}

export function useLeadProducts(leadId: number | null) {
  const [items, setItems] = useState<LeadProductItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const requestId = useRef(0)

  const loadItems = useCallback(async () => {
    const currentRequestId = ++requestId.current

    setLoading(true)
    setLoadError('')

    if (leadId === null) {
      setItems([])
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('lead_products')
      .select('product_id, quantity')
      .eq('lead_id', leadId)
      .order('product_id')

    if (currentRequestId !== requestId.current) return

    if (error) {
      setLoadError(
        `Não foi possível carregar os produtos do lead: ${error.message}`,
      )
      setLoading(false)
      return
    }

    setItems(
      (data ?? []).map((item) => ({
        product_id: Number(item.product_id),
        quantity: String(item.quantity),
      })),
    )
    setLoading(false)
  }, [leadId])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadItems()
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      requestId.current += 1
    }
  }, [loadItems])

  function setProductQuantity(productId: number, quantity: string) {
    setItems((current) => {
      const existing = current.find((item) => item.product_id === productId)

      if (existing) {
        if (!quantity.trim()) {
          return current.filter((item) => item.product_id !== productId)
        }

        return current.map((item) =>
          item.product_id === productId ? { ...item, quantity } : item,
        )
      }

      if (!quantity.trim()) return current

      return [...current, { product_id: productId, quantity }]
    })
  }

  return {
    items,
    setItems,
    setProductQuantity,
    loading,
    loadError,
    reload: loadItems,
  }
}
