import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    userName: {
      type: String,
      default: 'System',
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true, // e.g. "ORDER_CANCELLED", "REFUND_PROCESSED", "PRICE_MODIFIED", "STAFF_INVITED", "USER_LOGIN"
    },
    resource: {
      type: String,
      required: true,
      trim: true, // e.g. "Order", "Payment", "MenuItem", "User"
    },
    resourceId: {
      type: String,
      trim: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ restaurantId: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
