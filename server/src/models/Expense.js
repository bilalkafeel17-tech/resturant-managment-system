import mongoose from 'mongoose';
import { EXPENSE_CATEGORIES } from '../config/constants.js';

const expenseSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
      maxlength: 120,
    },
    category: {
      type: String,
      enum: Object.values(EXPENSE_CATEGORIES),
      default: EXPENSE_CATEGORIES.OTHER,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    expenseDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    paymentMethod: {
      type: String,
      default: 'cash',
      trim: true,
    },
    referenceNumber: {
      type: String,
      trim: true,
      default: '',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

expenseSchema.index({ restaurantId: 1, expenseDate: -1 });

export const Expense = mongoose.model('Expense', expenseSchema);
