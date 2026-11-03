import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type {
  InventoryMovement,
  InventoryProduct,
  MovementForm,
  ProductForm,
} from './types'

type InventoryRpcError = {
  message: string
}

function getErrorMessage(error: InventoryRpcError) {
  if (error.message.includes('Estoque insuficiente')) {
    return error.message
  }

  if (error.message.includes('duplicate key')) {
    return 'Já existe um produto cadastrado com esse SKU.'
  }

  return error.message
}

export function useInventory(
  userId: string | null,
  onError: (message: string) => void,
  onNotice: (message: string) => void,
) {
  const [inventoryState, setInventoryState] = useState<{
    userId: string | null
    products: InventoryProduct[]
    movements: InventoryMovement[]
  }>({ userId: null, products: [], movements: [] })

  const products =
    inventoryState.userId === userId ? inventoryState.products : []
  const movements =
    inventoryState.userId === userId ? inventoryState.movements : []

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const requestId = useRef(0)

  const loadInventory = useCallback(async () => {
    if (!userId) {
      return
    }

    const currentRequestId = ++requestId.current
    setLoading(true)

    try {
      const [productsResult, balancesResult, movementsResult] =
        await Promise.all([
          supabase
            .from('inventory_products')
            .select(
              'id, name, sku, description, unit, average_cost, is_active, created_at, updated_at',
            )
            .order('name'),
          supabase
            .from('inventory_stock_balances')
            .select('product_id, quantity_on_hand'),
          supabase
            .from('inventory_movements')
            .select(
              'id, product_id, lead_id, movement_type, quantity_delta, unit_cost, total_cost, reason, reference_movement_id, created_at',
            )
            .order('created_at', { ascending: false })
            .limit(200),
        ])

      if (currentRequestId !== requestId.current) return

      const loadError =
        productsResult.error || balancesResult.error || movementsResult.error

      if (loadError) {
        onError(`Não foi possível carregar o estoque: ${loadError.message}`)
        return
      }

      const balances = new Map(
        (balancesResult.data ?? []).map((balance) => [
          balance.product_id,
          Number(balance.quantity_on_hand),
        ]),
      )

      const productNames = new Map(
        (productsResult.data ?? []).map((product) => [
          product.id,
          product.name,
        ]),
      )

      setInventoryState({
        userId,
        products: (productsResult.data ?? []).map((product) => ({
          ...product,
          average_cost: Number(product.average_cost),
          quantity_on_hand: balances.get(product.id) ?? 0,
        })),
        movements: (movementsResult.data ?? []).map((movement) => ({
          ...movement,
          quantity_delta: Number(movement.quantity_delta),
          unit_cost: Number(movement.unit_cost),
          total_cost: Number(movement.total_cost),
          product: {
            name: productNames.get(movement.product_id) ?? 'Produto removido',
          },
        })),
      })
    } catch (err) {
      if (currentRequestId !== requestId.current) return
      onError(
        err instanceof Error
          ? `Não foi possível carregar o estoque: ${err.message}`
          : 'Não foi possível carregar o estoque.',
      )
    } finally {
      if (currentRequestId === requestId.current) {
        setLoading(false)
      }
    }
  }, [userId, onError])

  useEffect(() => {
    if (!userId) {
      requestId.current += 1
      return
    }

    const timeoutId = setTimeout(() => {
      void loadInventory()
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      requestId.current += 1
    }
  }, [userId, loadInventory])

  async function saveProduct(
    form: ProductForm,
    productId: number | null,
  ): Promise<boolean> {
    setSaving(true)
    onError('')

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim() || null,
      description: form.description.trim() || null,
      unit: form.unit.trim(),
    }

    const result = productId === null
      ? await supabase.from('inventory_products').insert({
          ...payload,
          created_by: (await supabase.auth.getUser()).data.user?.id ?? null,
        })
      : await supabase
          .from('inventory_products')
          .update(payload)
          .eq('id', productId)

    if (result.error) {
      onError(`Não foi possível salvar o produto: ${getErrorMessage(result.error)}`)
      setSaving(false)
      return false
    }

    await loadInventory()
    onNotice(productId === null ? 'Produto cadastrado.' : 'Produto atualizado.')
    setSaving(false)
    return true
  }

  async function setProductActive(
    productId: number,
    isActive: boolean,
  ): Promise<boolean> {
    setSaving(true)
    onError('')
    onNotice('')

    try {
      const { data, error } = await supabase
        .from('inventory_products')
        .update({
          is_active: isActive,
        })
        .eq('id', productId)
        .select('id')

      if (error) {
        onError(
          isActive
            ? `Não foi possível reativar o produto: ${getErrorMessage(error)}`
            : `Não foi possível desativar o produto: ${getErrorMessage(error)}`,
        )
        return false
      }

      if (!Array.isArray(data) || data.length === 0) {
        onError(
          'Não foi possível atualizar a situação do produto: registro não encontrado ou sem permissão.',
        )
        return false
      }

      await loadInventory()
      onNotice(
        isActive
          ? 'Produto reativado com sucesso.'
          : 'Produto desativado com sucesso.',
      )
      return true
    } catch (err) {
      onError(
        err instanceof Error
          ? `Não foi possível atualizar o produto: ${err.message}`
          : 'Não foi possível atualizar o produto.',
      )
      return false
    } finally {
      setSaving(false)
    }
  }

  async function registerMovement(
    form: MovementForm,
    movementType: 'entry' | 'exit',
  ): Promise<boolean> {
    setSaving(true)
    onError('')

    const quantity = Number(form.quantity)
    const unitCost = Number(form.unit_cost)

    if (!form.product_id || !Number.isFinite(quantity) || quantity <= 0) {
      onError('Selecione um produto e informe uma quantidade válida.')
      setSaving(false)
      return false
    }

    if (!Number.isInteger(quantity * 1000)) {
      onError('A quantidade aceita no máximo três casas decimais.')
      setSaving(false)
      return false
    }

    if (
      movementType === 'entry' &&
      (!Number.isFinite(unitCost) ||
        unitCost < 0 ||
        !Number.isInteger(unitCost * 10000))
    ) {
      onError('Informe um custo unitário válido, com até quatro casas decimais.')
      setSaving(false)
      return false
    }

    const { error } = await supabase.rpc('inventory_register_movement', {
      p_product_id: Number(form.product_id),
      p_quantity: quantity,
      p_movement_type: movementType,
      p_unit_cost: movementType === 'entry' ? unitCost : null,
      p_reason: form.reason.trim() || null,
    })

    if (error) {
      onError(`Não foi possível registrar a movimentação: ${getErrorMessage(error)}`)
      setSaving(false)
      return false
    }

    await loadInventory()
    onNotice(
      movementType === 'entry'
        ? 'Entrada de estoque registrada.'
        : 'Saída de estoque registrada.',
    )
    setSaving(false)
    return true
  }

  async function reverseMovement(
    movementId: number,
    reason: string,
  ): Promise<boolean> {
    if (!reason.trim()) {
      onError('Informe o motivo do estorno.')
      return false
    }

    setSaving(true)
    onError('')

    const { error } = await supabase.rpc('inventory_reverse_movement', {
      p_movement_id: movementId,
      p_reason: reason.trim(),
    })

    if (error) {
      onError(`Não foi possível estornar a movimentação: ${getErrorMessage(error)}`)
      setSaving(false)
      return false
    }

    await loadInventory()
    onNotice('Estorno registrado no histórico.')
    setSaving(false)
    return true
  }

  return {
    products,
    movements,
    loading: userId ? loading : false,
    saving,
    reload: loadInventory,
    saveProduct,
    setProductActive,
    registerMovement,
    reverseMovement,
  }
}
