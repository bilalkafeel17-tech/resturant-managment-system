import { Order } from '../models/Order.js';
import { orderService } from '../services/orderService.js';
import { AuditLog } from '../models/AuditLog.js';
import { ORDER_STATUS } from '../config/constants.js';

export const orderController = {
  /**
   * List orders with filtering, date range, pagination
   */
  async getOrders(req, res, next) {
    try {
      const {
        branchId,
        status,
        paymentStatus,
        orderType,
        search,
        startDate,
        endDate,
        page = 1,
        limit = 25,
      } = req.query;

      const targetBranchId = branchId || req.branchId;
      const query = {
        restaurantId: req.restaurantId,
      };

      if (targetBranchId) {
        query.branchId = targetBranchId;
      }
      if (status) {
        query.status = status;
      }
      if (paymentStatus) {
        query.paymentStatus = paymentStatus;
      }
      if (orderType) {
        query.orderType = orderType;
      }
      if (search && search.trim()) {
        query.$or = [
          { orderNumber: { $regex: search.trim(), $options: 'i' } },
          { 'customerInfo.name': { $regex: search.trim(), $options: 'i' } },
          { 'customerInfo.phone': { $regex: search.trim(), $options: 'i' } },
        ];
      }

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
          query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          query.createdAt.$lte = end;
        }
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [orders, total] = await Promise.all([
        Order.find(query)
          .populate('branchId', 'name code')
          .populate('cashierId', 'name')
          .populate('tableId', 'tableNumber section')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Order.countDocuments(query),
      ]);

      res.status(200).json({
        success: true,
        count: orders.length,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)) || 1,
        orders,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get single order by ID
   */
  async getOrderById(req, res, next) {
    try {
      const order = await Order.findOne({
        _id: req.params.id,
        restaurantId: req.restaurantId,
      })
        .populate('branchId', 'name code address phone')
        .populate('cashierId', 'name email')
        .populate('tableId', 'tableNumber section capacity')
        .populate('cancelledBy', 'name');

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      res.status(200).json({ success: true, order });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create POS Order with server-authoritative calculations
   */
  async createOrder(req, res, next) {
    try {
      const {
        branchId,
        orderType,
        tableId,
        customerInfo,
        items,
        discountType,
        discountValue,
        notes,
      } = req.body;

      const targetBranchId = branchId || req.branchId;
      if (!targetBranchId) {
        return res.status(400).json({ success: false, message: 'Branch ID is required to place an order.' });
      }

      const order = await orderService.createOrder({
        restaurantId: req.restaurantId,
        branchId: targetBranchId,
        orderType,
        tableId,
        customerInfo,
        items,
        discountType,
        discountValue,
        notes,
        cashierId: req.user._id,
      });

      // Emit Socket.IO event to kitchen & branch rooms
      const io = req.app.get('io');
      if (io) {
        const room = `room:${req.restaurantId}:${targetBranchId}`;
        io.to(room).emit('order_created', {
          order,
          message: `New order #${order.orderNumber} placed!`,
        });
      }

      res.status(201).json({
        success: true,
        message: 'Order created successfully!',
        order,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update Order Status (placed -> in_kitchen -> ready -> served -> completed)
   */
  async updateOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required.' });
      }

      const order = await orderService.transitionOrderStatus({
        orderId: id,
        newStatus: status,
        user: req.user,
        reason,
      });

      // Emit Socket.IO event
      const io = req.app.get('io');
      if (io) {
        const room = `room:${order.restaurantId}:${order.branchId}`;
        io.to(room).emit('order_status_updated', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          order,
        });
      }

      res.status(200).json({
        success: true,
        message: `Order #${order.orderNumber} status updated to ${order.status}`,
        order,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Cancel Order with Audit Log
   */
  async cancelOrder(req, res, next) {
    try {
      const { id } = req.params;
      const { reason = 'Cancelled by staff' } = req.body;

      const order = await orderService.transitionOrderStatus({
        orderId: id,
        newStatus: ORDER_STATUS.CANCELLED,
        user: req.user,
        reason,
      });

      await AuditLog.create({
        restaurantId: req.restaurantId,
        userId: req.user._id,
        userName: req.user.name,
        action: 'ORDER_CANCELLED',
        resource: 'Order',
        resourceId: order._id.toString(),
        details: { orderNumber: order.orderNumber, reason },
      });

      const io = req.app.get('io');
      if (io) {
        const room = `room:${order.restaurantId}:${order.branchId}`;
        io.to(room).emit('order_cancelled', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          reason,
        });
      }

      res.status(200).json({
        success: true,
        message: `Order #${order.orderNumber} has been cancelled.`,
        order,
      });
    } catch (error) {
      next(error);
    }
  },
};
