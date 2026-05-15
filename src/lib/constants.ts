// ============================================================
// Application-wide constants
// Never hardcode these values elsewhere in the codebase
// ============================================================

export const CURRENCY = 'AUD' as const

export const RESTAURANT_INFO = {
  name: 'Mascot Chinese Cuisine',
  address: '19-33 Kent Rd, 1 Floor, Mascot, APAC 2020',
  suburb: 'Mascot',
  state: 'NSW',
  postcode: '2020',
  country: 'Australia',
  phone: '', // TODO: Add verified phone number
  email: '', // TODO: Add verified email
  openingHours: [
    { day: 'Monday', hours: '11:00 AM – 9:30 PM' },
    { day: 'Tuesday', hours: '11:00 AM – 9:30 PM' },
    { day: 'Wednesday', hours: '11:00 AM – 9:30 PM' },
    { day: 'Thursday', hours: '11:00 AM – 9:30 PM' },
    { day: 'Friday', hours: '11:00 AM – 10:00 PM' },
    { day: 'Saturday', hours: '11:00 AM – 10:00 PM' },
    { day: 'Sunday', hours: '11:00 AM – 9:30 PM' },
  ],
} as const

// Tip options — exactly these four, in this order
export const TIP_OPTIONS = [
  { label: 'No Tip', value: 0 },
  { label: '15%', value: 15 },
  { label: '20%', value: 20 },
  { label: '25%', value: 25 },
] as const

export type TipPercentage = (typeof TIP_OPTIONS)[number]['value']

// Order status values
export const ORDER_STATUS = {
  PLACED: 'placed',
  PREPARING: 'preparing',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

// Payment status values
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  PAY_AT_STORE: 'pay_at_store',
} as const

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS]

// Order type values
export const ORDER_TYPE = {
  PICKUP: 'pickup',
  DELIVERY: 'delivery',
} as const

export type OrderType = (typeof ORDER_TYPE)[keyof typeof ORDER_TYPE]

// User roles
export const USER_ROLE = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
} as const

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE]

// Popular threshold — items ordered this many times or more get the Popular badge automatically
// Admin can override per-item via isPopularOverride
export const POPULAR_ORDER_THRESHOLD = 10

// Default placeholder image path — easy to replace with real images
// Replace these SVGs with actual restaurant-provided photos before launch
export const DEFAULT_FOOD_IMAGE = '/images/menu/placeholder-default.svg'

// Category placeholder images — map category slug to image
export const CATEGORY_IMAGES: Record<string, string> = {
  'featured-items': '/images/menu/placeholder-default.svg',
  'solo-meal-combo': '/images/menu/placeholder-rice.svg',
  'northeastern-classic-dishes': '/images/menu/placeholder-pork.svg',
  'northeastern-cold-dishes': '/images/menu/placeholder-vegetable.svg',
  'chicken-specialties': '/images/menu/placeholder-chicken.svg',
  'beef-lamb-specialties': '/images/menu/placeholder-beef.svg',
  'pork-specialties': '/images/menu/placeholder-pork.svg',
  'seafood-specialist': '/images/menu/placeholder-seafood.svg',
  'vegetables-specialties': '/images/menu/placeholder-vegetable.svg',
  'spicy-specialties': '/images/menu/placeholder-default.svg',
  'braised-dish': '/images/menu/placeholder-pork.svg',
  'spring-pancake-set': '/images/menu/placeholder-default.svg',
  'soup-specialties': '/images/menu/placeholder-soup.svg',
  'fried-rice-dumplings': '/images/menu/placeholder-rice.svg',
  'rice-bowl-specialties': '/images/menu/placeholder-rice.svg',
  'rice-noodle-specialties': '/images/menu/placeholder-noodle.svg',
  'handmade-noodle': '/images/menu/placeholder-noodle.svg',
}
