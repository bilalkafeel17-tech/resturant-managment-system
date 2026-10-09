import mongoose from 'mongoose';
import { INVENTORY_UNITS } from '../config/constants.js';

const ingredientSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: [true, 'Ingredient name is required'],
      trim: true,
      maxlength: 100,
    },
    sku: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: 'General', // e.g. Meat & Poultry, Dairy, Produce, Spices, Bakery, Beverages, Packaging
    },
    unit: {
      type: String,
      enum: Object.values(INVENTORY_UNITS),
      default: INVENTORY_UNITS.KG,
      required: true,
    },
    currentStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    minStockAlert: {
      type: Number,
      default: 5,
      min: 0,
    },
    costPerUnit: {
      type: Number,
      default: 0,
      min: 0,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
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

ingredientSchema.index({ restaurantId: 1, branchId: 1, name: 1 });
ingredientSchema.index({ restaurantId: 1, currentStock: 1 });

export const Ingredient = mongoose.model('Ingredient', ingredientSchema);
