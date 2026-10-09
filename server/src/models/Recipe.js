import mongoose from 'mongoose';
import { INVENTORY_UNITS } from '../config/constants.js';

const recipeItemSchema = new mongoose.Schema(
  {
    ingredientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ingredient',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.0001,
    },
    unit: {
      type: String,
      enum: Object.values(INVENTORY_UNITS),
      required: true,
    },
  },
  { _id: true }
);

const recipeSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Restaurant ID is required'],
      index: true,
    },
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: [true, 'Menu Item ID is required'],
      index: true,
    },
    variantName: {
      type: String,
      trim: true,
      default: '', // empty means applies to base item / all variants
    },
    yieldQuantity: {
      type: Number,
      default: 1, // Number of portions this recipe produces
      min: 1,
    },
    ingredients: [recipeItemSchema],
    instructions: {
      type: String,
      trim: true,
      default: '',
    },
    prepNotes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

recipeSchema.index({ restaurantId: 1, menuItemId: 1, variantName: 1 }, { unique: true });

export const Recipe = mongoose.model('Recipe', recipeSchema);
