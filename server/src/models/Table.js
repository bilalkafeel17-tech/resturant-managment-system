import mongoose from 'mongoose';
import { TABLE_STATUS } from '../config/constants.js';

const tableSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Restaurant ID is required'],
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch ID is required'],
      index: true,
    },
    tableNumber: {
      type: String,
      required: [true, 'Table number/name is required'],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Table capacity is required'],
      min: [1, 'Capacity must be at least 1 person'],
      default: 4,
    },
    section: {
      type: String,
      trim: true,
      default: 'Main Dining', // e.g. "Main Dining", "Outdoor Patio", "Family Hall", "Rooftop"
    },
    status: {
      type: String,
      enum: Object.values(TABLE_STATUS),
      default: TABLE_STATUS.AVAILABLE,
      index: true,
    },
    activeOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    }
  },
  {
    timestamps: true,
  }
);

tableSchema.index({ restaurantId: 1, branchId: 1, tableNumber: 1 }, { unique: true });

export const Table = mongoose.model('Table', tableSchema);
