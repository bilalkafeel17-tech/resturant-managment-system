import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g., "Half (500g)", "Full (1kg)", "Regular", "Large"
    priceDelta: { type: Number, required: true, default: 0 }, // Added or subtracted from basePrice
    sku: { type: String, trim: true, default: '' },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const addOnSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g., "Extra Cheese", "Raita & Mint", "Garlic Naan"
    price: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const menuItemSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Restaurant ID is required'],
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Price cannot be negative'],
    },
    costPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    sku: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    preparationTimeMinutes: {
      type: Number,
      default: 15,
      min: 1,
    },
    variants: [variantSchema],
    addOns: [addOnSchema],
    isVegetarian: {
      type: Boolean,
      default: false,
    },
    isSpicy: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    hasRecipe: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

menuItemSchema.index({ restaurantId: 1, categoryId: 1 });
menuItemSchema.index({ restaurantId: 1, name: 1 });
menuItemSchema.index({ restaurantId: 1, isAvailable: 1 });

export const MenuItem = mongoose.model('MenuItem', menuItemSchema);
