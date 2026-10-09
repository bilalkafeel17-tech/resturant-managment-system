import mongoose from 'mongoose';
import { RESTAURANT_TYPES } from '../config/constants.js';

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(RESTAURANT_TYPES),
      default: RESTAURANT_TYPES.CASUAL_DINING,
    },
    logoUrl: {
      type: String,
      default: '',
    },
    tagline: {
      type: String,
      default: 'Delicious food served with care',
      trim: true,
    },
    currency: {
      type: String,
      default: 'PKR',
      uppercase: true,
      trim: true,
    },
    currencySymbol: {
      type: String,
      default: 'Rs.',
      trim: true,
    },
    // Tax & Service Charge Settings
    taxRate: {
      type: Number,
      default: 16.0, // Default 16% GST (PRA/SRB/FBR standard in Pakistan)
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%'],
    },
    taxName: {
      type: String,
      default: 'GST',
      trim: true,
    },
    taxNumber: {
      type: String, // NTN / STRN / FBR POS Registration #
      default: '',
      trim: true,
    },
    serviceChargeRate: {
      type: Number,
      default: 0.0,
      min: [0, 'Service charge cannot be negative'],
      max: [100, 'Service charge cannot exceed 100%'],
    },
    // Receipt Configuration
    receiptSettings: {
      headerText: { type: String, default: 'Thank you for dining with us!' },
      footerText: { type: String, default: 'Please visit us again soon.' },
      showTaxNumber: { type: Boolean, default: true },
      showWifiDetails: { type: Boolean, default: false },
      wifiDetails: { type: String, default: '' },
      paperSize: { type: String, enum: ['80mm', '58mm'], default: '80mm' },
    },
    contact: {
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, trim: true },
      website: { type: String, trim: true },
      address: { type: String, trim: true },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

restaurantSchema.index({ isActive: 1 });

export const Restaurant = mongoose.model('Restaurant', restaurantSchema);
