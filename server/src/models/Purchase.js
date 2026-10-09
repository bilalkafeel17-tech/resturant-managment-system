import mongoose from 'mongoose';

const purchaseItemSchema = new mongoose.Schema(
  {
    ingredientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ingredient',
      required: true,
    },
    ingredientNameSnapshot: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.01,
    },
    unit: {
      type: String,
      required: true,
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

const purchaseSchema = new mongoose.Schema(
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
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier is required'],
      index: true,
    },
    purchaseOrderNumber: {
      type: String,
      required: true,
      trim: true,
    },
    invoiceNumber: {
      type: String,
      trim: true,
      default: '',
    },
    items: [purchaseItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'ordered', 'received', 'cancelled'],
      default: 'draft',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partially_paid', 'paid'],
      default: 'unpaid',
    },
    receivedAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

purchaseSchema.index({ restaurantId: 1, purchaseOrderNumber: 1 });

export const Purchase = mongoose.model('Purchase', purchaseSchema);
