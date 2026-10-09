import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { AuditLog } from '../models/AuditLog.js';
import { getPaymentAdapter } from '../services/paymentAdapters/paymentAdapterFactory.js';
import { PAYMENT_METHODS, PAYMENT_STATUS, ORDER_STATUS } from '../config/constants.js';

export const paymentController = {
  /**
   * Initiate Payment Session (Safepay / Cash / Card)
   */
  async initiatePayment(req, res, next) {
    try {
      const { orderId, paymentMethod = PAYMENT_METHODS.CASH, cashGiven = 0 } = req.body;

      const order = await Order.findOne({ _id: orderId, restaurantId: req.restaurantId });
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }

      if (order.paymentStatus === PAYMENT_STATUS.PAID) {
        return res.status(400).json({ success: false, message: 'This order has already been paid.' });
      }

      const adapter = getPaymentAdapter(paymentMethod);
      const sessionResult = await adapter.createPaymentSession({
        order,
        amount: order.grandTotal,
        currency: 'PKR',
        cashGiven,
        customer: order.customerInfo,
      });

      res.status(200).json({
        success: true,
        orderId: order._id,
        orderNumber: order.orderNumber,
        grandTotal: order.grandTotal,
        paymentMethod,
        session: sessionResult,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Confirm Payment (Cash / In-store POS Card / Sandbox Safepay confirmation)
   */
  async confirmPayment(req, res, next) {
    try {
      const {
        orderId,
        paymentMethod = PAYMENT_METHODS.CASH,
        amount,
        cashGiven = 0,
        changeReturned = 0,
        transactionReference = '',
        providerTrackerToken = '',
        idempotencyKey = null,
      } = req.body;

      const order = await Order.findOne({ _id: orderId, restaurantId: req.restaurantId });
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }

      if (order.paymentStatus === PAYMENT_STATUS.PAID) {
        return res.status(400).json({ success: false, message: 'Order has already been paid.' });
      }

      // Check Idempotency Key to prevent double charges
      if (idempotencyKey) {
        const existingPayment = await Payment.findOne({ idempotencyKey });
        if (existingPayment) {
          return res.status(200).json({
            success: true,
            message: 'Payment already processed (idempotent result).',
            payment: existingPayment,
          });
        }
      }

      const paymentAmount = Number(amount) || order.grandTotal;

      const payment = await Payment.create({
        restaurantId: req.restaurantId,
        branchId: order.branchId,
        orderId: order._id,
        amount: paymentAmount,
        currency: 'PKR',
        paymentMethod,
        status: PAYMENT_STATUS.PAID,
        transactionReference: transactionReference || `TXN_${Date.now()}`,
        providerTrackerToken,
        idempotencyKey,
        cashGiven: Number(cashGiven),
        changeReturned: Number(changeReturned),
        processedBy: req.user._id,
        paidAt: new Date(),
      });

      // Update Order payment status
      order.paymentStatus = PAYMENT_STATUS.PAID;
      order.paidAt = new Date();
      await order.save();

      // Audit Log
      await AuditLog.create({
        restaurantId: req.restaurantId,
        userId: req.user._id,
        userName: req.user.name,
        action: 'PAYMENT_RECEIVED',
        resource: 'Payment',
        resourceId: payment._id.toString(),
        details: {
          orderNumber: order.orderNumber,
          amount: paymentAmount,
          method: paymentMethod,
        },
      });

      // Emit Socket.IO Event
      const io = req.app.get('io');
      if (io) {
        const room = `room:${order.restaurantId}:${order.branchId}`;
        io.to(room).emit('payment_completed', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          payment,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Payment processed successfully!',
        payment,
        order,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Webhook handler for Safepay Checkout callbacks
   */
  async handleSafepayWebhook(req, res, next) {
    try {
      const signature = req.headers['x-sfpy-signature'];
      const adapter = getPaymentAdapter(PAYMENT_METHODS.SAFEPAY);

      const isValid = adapter.verifyWebhookSignature({
        payload: req.body,
        signature,
      });

      if (!isValid && process.env.NODE_ENV === 'production') {
        return res.status(401).json({ success: false, message: 'Invalid webhook signature.' });
      }

      const { data, event } = req.body;
      const trackerToken = data?.tracker?.token || data?.token;
      const amount = data?.tracker?.amount;

      if (trackerToken) {
        const existingPayment = await Payment.findOne({ providerTrackerToken: trackerToken });
        if (existingPayment && existingPayment.status === PAYMENT_STATUS.PAID) {
          return res.status(200).json({ success: true, message: 'Notification already processed.' });
        }
      }

      res.status(200).json({ success: true, message: 'Webhook received.' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get payments history
   */
  async getPayments(req, res, next) {
    try {
      const { branchId, paymentMethod, status, startDate, endDate, page = 1, limit = 25 } = req.query;
      const targetBranchId = branchId || req.branchId;

      const query = {
        restaurantId: req.restaurantId,
      };

      if (targetBranchId) query.branchId = targetBranchId;
      if (paymentMethod) query.paymentMethod = paymentMethod;
      if (status) query.status = status;

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          query.createdAt.$lte = end;
        }
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [payments, total] = await Promise.all([
        Payment.find(query)
          .populate('orderId', 'orderNumber customerInfo grandTotal')
          .populate('processedBy', 'name')
          .populate('branchId', 'name code')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Payment.countDocuments(query),
      ]);

      res.status(200).json({
        success: true,
        count: payments.length,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)) || 1,
        payments,
      });
    } catch (error) {
      next(error);
    }
  },
};
