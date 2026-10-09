import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Restaurant ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true,
      maxlength: 120,
    },
    contactPerson: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    phone: {
      type: String,
      required: [true, 'Supplier phone is required'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: 'General Supplies',
    },
    paymentTerms: {
      type: String,
      trim: true,
      default: 'Net 30',
    },
    outstandingBalance: {
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
);

supplierSchema.index({ restaurantId: 1, name: 1 });

export const Supplier = mongoose.model('Supplier', supplierSchema);
