import mongoose from 'mongoose';
import { ORDER_TYPES, ORDER_STATUS, ITEM_STATUS, PAYMENT_STATUS } from '../config/constants.js';

const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
    },
    nameSnapshot: {
      type: String,
      required: true,
      trim: true,
    },
    unitPriceSnapshot: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    variantSnapshot: {
      name: { type: String, default: '' },
      priceDelta: { type: Number, default: 0 },
    },
    addOnsSnapshot: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
      },
    ],
    itemSubtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    itemStatus: {
      type: String,
      enum: Object.values(ITEM_STATUS),
      default: ITEM_STATUS.PENDING,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    recipeDeducted: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
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
    orderNumber: {
      type: String,
      required: true,
      trim: true,
    },
    dailySequence: {
      type: Number,
      default: 1,
    },
    orderType: {
      type: String,
      enum: Object.values(ORDER_TYPES),
      default: ORDER_TYPES.DINE_IN,
      required: true,
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      default: null,
    },
    tableNameSnapshot: {
      type: String,
      default: '',
    },
    customerInfo: {
      name: { type: String, default: 'Walk-in Guest', trim: true },
      phone: { type: String, default: '', trim: true },
      address: { type: String, default: '', trim: true },
    },
    items: [orderItemSchema],
    
    // Financial Breakdown
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    discountType: {
      type: String,
      enum: ['none', 'percentage', 'fixed'],
      default: 'none',
    },
    discountValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxRateSnapshot: {
      type: Number,
      default: 16.0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    serviceChargeRateSnapshot: {
      type: Number,
      default: 0,
    },
    serviceChargeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    // Statuses
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PLACED,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.UNPAID,
      index: true,
    },

    cancellationReason: {
      type: String,
      trim: true,
      default: '',
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancelledAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    
    // Attendants
    cashierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    serverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    isDemo: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ restaurantId: 1, branchId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ restaurantId: 1, paymentStatus: 1 });
orderSchema.index({ restaurantId: 1, orderNumber: 1 });

export const Order = mongoose.model('Order', orderSchema);
