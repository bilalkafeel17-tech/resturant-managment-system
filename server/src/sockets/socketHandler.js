import { Order } from '../models/Order.js';
import { Table } from '../models/Table.js';
import { ITEM_STATUS, ORDER_STATUS } from '../config/constants.js';

/**
 * Socket.IO Real-Time Event Gateway for KDS and Live POS Sync
 */
export const setupSockets = (io) => {
  io.on('connection', (socket) => {
    // Client joins a restaurant and branch room
    socket.on('join_branch', ({ restaurantId, branchId }) => {
      if (!restaurantId) return;
      const room = branchId ? `room:${restaurantId}:${branchId}` : `room:${restaurantId}`;
      socket.join(room);
      console.log(`[Socket.IO] Client ${socket.id} joined room: ${room}`);
    });

    // Kitchen staff updates preparation status of a specific item
    socket.on('update_item_status', async ({ orderId, itemId, newStatus, restaurantId, branchId }) => {
      try {
        if (!Object.values(ITEM_STATUS).includes(newStatus)) {
          return socket.emit('error_message', { message: 'Invalid item status' });
        }

        const order = await Order.findOne({ _id: orderId, restaurantId });
        if (!order) {
          return socket.emit('error_message', { message: 'Order not found' });
        }

        const item = order.items.id(itemId);
        if (item) {
          item.itemStatus = newStatus;

          // If all items are ready, auto update order to ready
          const allReady = order.items.every((i) => i.itemStatus === ITEM_STATUS.READY || i.itemStatus === ITEM_STATUS.SERVED || i.itemStatus === ITEM_STATUS.CANCELLED);
          if (allReady && order.status === ORDER_STATUS.IN_KITCHEN) {
            order.status = ORDER_STATUS.READY;
          }

          await order.save();

          const room = branchId ? `room:${restaurantId}:${branchId}` : `room:${restaurantId}`;
          io.to(room).emit('order_item_updated', {
            orderId,
            itemId,
            newStatus,
            orderStatus: order.status,
            order,
          });
        }
      } catch (err) {
        console.error('[Socket Error] update_item_status failed:', err.message);
        socket.emit('error_message', { message: err.message });
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return io;
};
