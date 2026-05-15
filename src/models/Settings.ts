import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISettingsDocument extends Document {
  restaurantName: string
  address: string
  phone: string
  email: string
  openingHours: string
  pickupPrepTime: number  // minutes
  deliveryEnabled: boolean
  updatedAt: Date
}

const SettingsSchema = new Schema<ISettingsDocument>(
  {
    restaurantName: { type: String, default: 'Mascot Chinese Cuisine' },
    address:        { type: String, default: '19-33 Kent Rd, 1 Floor, Mascot NSW 2020' },
    phone:          { type: String, default: '' },
    email:          { type: String, default: '' },
    openingHours:   { type: String, default: 'Mon–Sun: 11:00 AM – 9:30 PM' },
    pickupPrepTime: { type: Number, default: 20 },
    deliveryEnabled:{ type: Boolean, default: true },
  },
  { timestamps: true }
)

const Settings: Model<ISettingsDocument> =
  mongoose.models.Settings ?? mongoose.model<ISettingsDocument>('Settings', SettingsSchema)

export default Settings
