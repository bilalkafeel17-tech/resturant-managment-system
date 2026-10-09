import { Order } from '../models/Order.js';
import { ORDER_STATUS, ITEM_STATUS } from '../config/constants.js';

export const kitchenController = {
  /**
   * Get all active kitchen orders for live KDS
   */
  async getActiveKitchenOrders(req, res, next) {
    try {
      const { branchId } = req.query;
      const targetBranchId = branchId || req.branchId;

      const query = {
        restaurantId: req.restaurantId,
        status: { $in: [ORDER_STATUS.PLACED, ORDER_STATUS.IN_KITCHEN, ORDER_STATUS.READY] },
      };

      if (targetBranchId) {
        query.branchId = targetBranchId;
      }

      const orders = await Order.find(query)
        .populate('tableId', 'tableNumber section')
        .populate('branchId', 'name code')
        .sort({ createdAt: 1 })
        .lean();

      // Attach elapsed time in minutes for visual cooking timer
      const now = new Date();
      const enrichedOrders = orders.map((o) => {
        const elapsedMinutes = Math.floor((now - new Date(o.createdAt)) / 60000);
        return {
          ...o,
          elapsedMinutes,
        };
      });

      res.status(200).json({
        success: true,
        count: enrichedOrders.length,
        orders: enrichedOrders,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update preparation status of a specific item within an order
   */
  async updateItemStatus(req, res, next) {
    try {
      const { orderId, itemId } = req.params;
      const { status } = req.body;

      if (!Object.values(ITEM_STATUS).includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid item status' });
      }

      const order = await Order.findOne({ _id: orderId, restaurantId: req.restaurantId });
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      const item = order.items.id(itemId);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Item not found in order' });
      }

      item.itemStatus = status;

      // If any item starts cooking, order moves to in_kitchen
      if (status === ITEM_STATUS.COOKING && order.status === ORDER_STATUS.PLACED) {
        order.status = ORDER_STATUS.IN_KITCHEN;
      }

      // If all items ready, auto mark order as ready
      const allReady = order.items.every(
        (i) => i.itemStatus === ITEM_STATUS.READY || i.itemStatus === ITEM_STATUS.SERVED || i.itemStatus === ITEM_STATUS.CANCELLED
      );
      if (allReady && order.status === ORDER_STATUS.IN_KITCHEN) {
        order.status = ORDER_STATUS.READY;
      }

      await order.save();

      // Emit Socket.IO broadcast
      const io = req.app.get('io');
      if (io) {
        const room = `room:${order.restaurantId}:${order.branchId}`;
        io.to(room).emit('order_item_updated', {
          orderId: order._id,
          itemId,
          newStatus: status,
          orderStatus: order.status,
          order,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Item status updated',
        order,
      });
    } catch (error) {
      next(error);
    }
  },
};
