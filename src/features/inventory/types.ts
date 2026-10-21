export type InventoryProduct = {
  id: number
  name: string
  sku: string | null
  description: string | null
  unit: string
  average_cost: number
  is_active: boolean
  created_at: string
  updated_at: string
  quantity_on_hand: number
}

export type InventoryMovement = {
  id: number
  product_id: number
  lead_id: number | null
  movement_type: 'entry' | 'exit' | 'reversal_entry' | 'reversal_exit'
  quantity_delta: number
  unit_cost: number
  total_cost: number
  reason: string
  reference_movement_id: number | null
  created_at: string
  product?: { name: string } | null
}

export type ProductForm = {
  name: string
  sku: string
  description: string
  unit: string
}

export type MovementForm = {
  product_id: string
  quantity: string
  unit_cost: string
  reason: string
}

export const emptyProductForm: ProductForm = {
  name: '',
  sku: '',
  description: '',
  unit: 'un',
}

export const emptyMovementForm: MovementForm = {
  product_id: '',
  quantity: '',
  unit_cost: '',
  reason: '',
}
