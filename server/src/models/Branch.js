import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Restaurant ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true,
      maxlength: [100, 'Branch name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    address: {
      type: String,
      required: [true, 'Branch address is required'],
      trim: true,
    },
    city: {
      type: String,
      default: 'Lahore',
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Branch phone is required'],
      trim: true,
    },
    isMain: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    openingHours: {
      open: { type: String, default: '11:00' },
      close: { type: String, default: '23:30' },
    }
  },
  {
    timestamps: true,
  }
);

branchSchema.index({ restaurantId: 1, code: 1 }, { unique: true });
branchSchema.index({ restaurantId: 1, isActive: 1 });

export const Branch = mongoose.model('Branch', branchSchema);
