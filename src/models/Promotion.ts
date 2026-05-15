import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IPromotionDocument extends Document {
  code: string
  type: 'percentage' | 'fixed'
  value: number
  expiresAt: Date | null
  maxUses: number
  usedCount: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const PromotionSchema = new Schema<IPromotionDocument>(
  {
    code:      { type: String, required: true, unique: true, uppercase: true, trim: true },
    type:      { type: String, enum: ['percentage', 'fixed'], required: true },
    value:     { type: Number, required: true, min: 0 },
    expiresAt: { type: Date, default: null },
    maxUses:   { type: Number, default: 0 },   // 0 = unlimited
    usedCount: { type: Number, default: 0 },
    isActive:  { type: Boolean, default: true },
  },
  { timestamps: true }
)

const Promotion: Model<IPromotionDocument> =
  mongoose.models.Promotion ?? mongoose.model<IPromotionDocument>('Promotion', PromotionSchema)

export default Promotion
