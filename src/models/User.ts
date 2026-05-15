import mongoose, { Schema, Document, Model } from 'mongoose'
import { USER_ROLE } from '@/lib/constants'

// ============================================================
// User model
// ============================================================

export interface IUserDocument extends Document {
  name: string
  email: string
  passwordHash: string
  role: 'customer' | 'admin'
  addresses: {
    fullName: string
    phone: string
    streetAddress: string
    suburb: string
    state: string
    postcode: string
    notes?: string
  }[]
  isBlocked: boolean
  createdAt: Date
  updatedAt: Date
}

const AddressSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    streetAddress: { type: String, required: true },
    suburb: { type: String, required: true },
    state: { type: String, required: true },
    postcode: { type: String, required: true },
    notes: { type: String },
  },
  { _id: false }
)

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLE),
      default: USER_ROLE.CUSTOMER,
    },
    addresses: {
      type: [AddressSchema],
      default: [],
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// Prevent passwordHash from being returned in JSON responses
UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const r = ret as unknown as Record<string, unknown>
    delete r['passwordHash']
    return r
  },
})

const User: Model<IUserDocument> =
  mongoose.models.User ?? mongoose.model<IUserDocument>('User', UserSchema)

export default User
