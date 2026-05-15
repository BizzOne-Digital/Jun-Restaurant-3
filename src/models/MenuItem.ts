import mongoose, { Schema, Document, Model, Types } from 'mongoose'

// ============================================================
// MenuItem model
// orderedCount is incremented each time an order is placed
// discount fields are controlled by admin only
// isPopular is auto-set when orderedCount >= popularThreshold,
//   but can be overridden manually by admin via isPopularOverride
// ============================================================

export interface IMenuItemDocument extends Document {
  categoryId: Types.ObjectId
  name: string
  slug: string
  description: string
  price: number
  currency: 'AUD'
  imageUrl: string
  isAvailable: boolean
  orderedCount: number
  tags: string[]
  // Discount — admin-controlled only
  discountActive: boolean
  discountPercentage: number | null  // e.g. 20 means 20% off
  discountPrice: number | null       // explicit sale price (takes precedence over percentage)
  // Popular — auto-computed or admin override
  isPopularOverride: boolean | null  // null = auto, true = force popular, false = force not popular
  createdAt: Date
  updatedAt: Date
}

const MenuItemSchema = new Schema<IMenuItemDocument>(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'MenuCategory',
      required: [true, 'Category is required'],
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Item slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'AUD',
      enum: ['AUD'],
    },
    imageUrl: {
      type: String,
      default: '/images/menu/placeholder-default.svg',
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    orderedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    // Discount fields — set by admin only, never hardcoded
    discountActive: {
      type: Boolean,
      default: false,
    },
    discountPercentage: {
      type: Number,
      default: null,
      min: [1, 'Discount must be at least 1%'],
      max: [99, 'Discount cannot exceed 99%'],
    },
    discountPrice: {
      type: Number,
      default: null,
      min: [0, 'Discount price cannot be negative'],
    },
    // Popular override — null means auto-compute from orderedCount
    isPopularOverride: {
      type: Boolean,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for efficient queries
MenuItemSchema.index({ categoryId: 1, isAvailable: 1 })
MenuItemSchema.index({ orderedCount: -1 })       // for popular item queries
MenuItemSchema.index({ discountActive: 1 })       // for "Save on Select Items" queries

const MenuItem: Model<IMenuItemDocument> =
  mongoose.models.MenuItem ??
  mongoose.model<IMenuItemDocument>('MenuItem', MenuItemSchema)

export default MenuItem
