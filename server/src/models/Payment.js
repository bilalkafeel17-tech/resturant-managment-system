import mongoose from 'mongoose';
import { PAYMENT_METHODS, PAYMENT_STATUS } from '../config/constants.js';

const paymentSchema = new mongoose.Schema(
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
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order ID is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Payment amount must be greater than zero'],
    },
    currency: {
      type: String,
      default: 'PKR',
      uppercase: true,
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      default: PAYMENT_METHODS.CASH,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },
    transactionReference: {
      type: String,
      trim: true,
      default: '',
    },
    providerTrackerToken: {
      type: String,
      trim: true,
      default: '',
    },
    idempotencyKey: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    providerMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    cashGiven: {
      type: Number,
      default: 0,
    },
    changeReturned: {
      type: Number,
      default: 0,
    },
    refundDetails: {
      isRefunded: { type: Boolean, default: false },
      refundReference: { type: String, default: '' },
      refundAmount: { type: Number, default: 0 },
      refundReason: { type: String, default: '' },
      refundedAt: { type: Date },
      refundedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    paidAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ restaurantId: 1, createdAt: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);
