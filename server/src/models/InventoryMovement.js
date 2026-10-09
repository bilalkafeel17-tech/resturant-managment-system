import mongoose from 'mongoose';
import { STOCK_MOVEMENT_TYPES, INVENTORY_UNITS } from '../config/constants.js';

const inventoryMovementSchema = new mongoose.Schema(
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
    ingredientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ingredient',
      required: [true, 'Ingredient ID is required'],
      index: true,
    },
    ingredientName: {
      type: String,
      required: true,
      trim: true,
    },
    movementType: {
      type: String,
      enum: Object.values(STOCK_MOVEMENT_TYPES),
      required: true,
      index: true,
    },
    quantityChange: {
      type: Number,
      required: true, // positive for stock added, negative for stock consumed/waste
    },
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      enum: Object.values(INVENTORY_UNITS),
      required: true,
    },
    unitCost: {
      type: Number,
      default: 0,
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    referenceOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      index: true,
    },
    referencePurchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
      default: null,
      index: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

inventoryMovementSchema.index({ restaurantId: 1, createdAt: -1 });

export const InventoryMovement = mongoose.model('InventoryMovement', inventoryMovementSchema);
