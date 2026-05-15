import mongoose, { Schema, Document, Model } from 'mongoose'

// ============================================================
// MenuCategory model
// ============================================================

export interface IMenuCategoryDocument extends Document {
  name: string
  slug: string
  displayOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const MenuCategorySchema = new Schema<IMenuCategoryDocument>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

// Index for efficient sorted queries
MenuCategorySchema.index({ displayOrder: 1, isActive: 1 })

const MenuCategory: Model<IMenuCategoryDocument> =
  mongoose.models.MenuCategory ??
  mongoose.model<IMenuCategoryDocument>('MenuCategory', MenuCategorySchema)

export default MenuCategory
