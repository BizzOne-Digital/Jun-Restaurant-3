import { z } from 'zod'
import { TIP_OPTIONS } from '@/lib/constants'

// ============================================================
// Order validation schemas
// ============================================================

const tipValues = TIP_OPTIONS.map((t) => t.value) as [number, ...number[]]

export const deliveryAddressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required').trim(),
  phone: z
    .string()
    .min(8, 'Please enter a valid phone number')
    .max(20, 'Phone number is too long')
    .trim(),
  streetAddress: z.string().min(5, 'Street address is required').trim(),
  suburb: z.string().min(2, 'Suburb/city is required').trim(),
  state: z.string().min(2, 'State is required').trim(),
  postcode: z
    .string()
    .min(4, 'Postcode is required')
    .max(10, 'Postcode is too long')
    .trim(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
})

export const orderItemSchema = z.object({
  menuItemId: z.string().min(1, 'Menu item ID is required'),
  nameSnapshot: z.string().min(1, 'Item name is required'),
  priceSnapshot: z.number().min(0, 'Price cannot be negative'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  imageSnapshot: z.string().default(''),
})

export const placeOrderSchema = z
  .object({
    items: z
      .array(orderItemSchema)
      .min(1, 'Order must contain at least one item'),
    orderType: z.enum(['pickup', 'delivery']),
    deliveryAddress: deliveryAddressSchema.nullable().optional(),
    tipPercentage: z.number().refine((v) => tipValues.includes(v), {
      message: 'Tip must be 0, 15, 20, or 25',
    }),
  })
  .refine(
    (data) => {
      // Delivery orders must have a delivery address
      if (data.orderType === 'delivery') {
        return data.deliveryAddress != null
      }
      return true
    },
    {
      message: 'Delivery address is required for delivery orders',
      path: ['deliveryAddress'],
    }
  )

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>
export type DeliveryAddressInput = z.infer<typeof deliveryAddressSchema>
