import { Order } from '../models/Order.js';
import { MenuItem } from '../models/MenuItem.js';
import { Restaurant } from '../models/Restaurant.js';
import { Table } from '../models/Table.js';
import { ORDER_STATUS, TABLE_STATUS, VALID_ORDER_TRANSITIONS, ORDER_TYPES } from '../config/constants.js';
import { inventoryService } from './inventoryService.js';

/**
 * Generates human-friendly sequential order number: ORD-YYYYMMDD-XXXX
 */
const generateOrderNumber = async (restaurantId) => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const countToday = await Order.countDocuments({
    restaurantId,
    createdAt: { $gte: startOfDay },
  });
  const seq = String(countToday + 1).padStart(3, '0');
  return `ORD-${dateStr}-${seq}`;
};

export const orderService = {
  /**
   * Calculate and validate order financials strictly on server
   */
  async calculateOrderFinancials({ restaurantId, items, discountType = 'none', discountValue = 0, orderType = ORDER_TYPES.DINE_IN }) {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('An order must contain at least one item.');
    }

    let subtotal = 0;
    const validatedItems = [];

    // Fetch all menu items referenced in the request
    const menuItemIds = items.map((i) => i.menuItemId);
    const dbMenuItems = await MenuItem.find({
      _id: { $in: menuItemIds },
      restaurantId,
      isAvailable: true,
    });

    const menuMap = new Map(dbMenuItems.map((m) => [m._id.toString(), m]));

    for (const clientItem of items) {
      const dbItem = menuMap.get(clientItem.menuItemId.toString());
      if (!dbItem) {
        throw new Error(`Item with ID ${clientItem.menuItemId} is either unavailable or does not exist.`);
      }

      let unitPrice = dbItem.basePrice;
      let variantSnapshot = { name: '', priceDelta: 0 };

      // Validate variant if provided
      if (clientItem.variantName) {
        const foundVariant = dbItem.variants?.find((v) => v.name === clientItem.variantName);
        if (foundVariant) {
          unitPrice += foundVariant.priceDelta;
          variantSnapshot = { name: foundVariant.name, priceDelta: foundVariant.priceDelta };
        }
      }

      // Validate add-ons
      const addOnsSnapshot = [];
      if (Array.isArray(clientItem.addOns) && clientItem.addOns.length > 0) {
        for (const addOnReq of clientItem.addOns) {
          const foundAddOn = dbItem.addOns?.find((a) => a.name === addOnReq.name);
          if (foundAddOn) {
            unitPrice += foundAddOn.price;
            addOnsSnapshot.push({ name: foundAddOn.name, price: foundAddOn.price });
          }
        }
      }

      const quantity = Math.max(1, parseInt(clientItem.quantity, 10) || 1);
      const itemSubtotal = Number((unitPrice * quantity).toFixed(2));
      subtotal += itemSubtotal;

      validatedItems.push({
        menuItemId: dbItem._id,
        nameSnapshot: dbItem.name,
        unitPriceSnapshot: Number(unitPrice.toFixed(2)),
        quantity,
        variantSnapshot,
        addOnsSnapshot,
        itemSubtotal,
        notes: clientItem.notes || '',
        itemStatus: 'pending',
        recipeDeducted: false,
      });
    }

    subtotal = Number(subtotal.toFixed(2));

    // Calculate Discount
    let discountAmount = 0;
    const parsedDiscountValue = Number(discountValue) || 0;
    if (discountType === 'percentage' && parsedDiscountValue > 0) {
      discountAmount = Number(((subtotal * Math.min(100, parsedDiscountValue)) / 100).toFixed(2));
    } else if (discountType === 'fixed' && parsedDiscountValue > 0) {
      discountAmount = Number(Math.min(subtotal, parsedDiscountValue).toFixed(2));
    }

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);

    // Calculate Tax based on Restaurant Configuration
    const taxRate = restaurant.taxRate || 0;
    const taxAmount = Number(((discountedSubtotal * taxRate) / 100).toFixed(2));

    // Service charge (only for dine-in if configured)
    let serviceChargeRate = 0;
    let serviceChargeAmount = 0;
    if (orderType === ORDER_TYPES.DINE_IN && restaurant.serviceChargeRate > 0) {
      serviceChargeRate = restaurant.serviceChargeRate;
      serviceChargeAmount = Number(((discountedSubtotal * serviceChargeRate) / 100).toFixed(2));
    }

    const grandTotal = Number((discountedSubtotal + taxAmount + serviceChargeAmount).toFixed(2));

    return {
      restaurant,
      validatedItems,
      subtotal,
      discountType,
      discountValue: parsedDiscountValue,
      discountAmount,
      taxRateSnapshot: taxRate,
      taxAmount,
      serviceChargeRateSnapshot: serviceChargeRate,
      serviceChargeAmount,
      grandTotal,
    };
  },

  /**
   * Create an order with full validation and table status updates
   */
  async createOrder({
    restaurantId,
    branchId,
    orderType = ORDER_TYPES.DINE_IN,
    tableId = null,
    customerInfo = {},
    items,
    discountType = 'none',
    discountValue = 0,
    notes = '',
    cashierId = null,
    serverId = null,
    autoDeductStock = true,
  }) {
    const financials = await this.calculateOrderFinancials({
      restaurantId,
      items,
      discountType,
      discountValue,
      orderType,
    });

    let tableNameSnapshot = '';
    if (orderType === ORDER_TYPES.DINE_IN && tableId) {
      const table = await Table.findOne({ _id: tableId, restaurantId, branchId });
      if (!table) {
        throw new Error('Selected table does not exist in this branch.');
      }
      tableNameSnapshot = `Table ${table.tableNumber} (${table.section})`;
    }

    const orderNumber = await generateOrderNumber(restaurantId);

    const newOrder = new Order({
      restaurantId,
      branchId,
      orderNumber,
      orderType,
      tableId: orderType === ORDER_TYPES.DINE_IN ? tableId : null,
      tableNameSnapshot,
      customerInfo: {
        name: customerInfo.name || (orderType === ORDER_TYPES.DINE_IN ? 'Dine-in Guest' : 'Walk-in Customer'),
        phone: customerInfo.phone || '',
        address: customerInfo.address || '',
      },
      items: financials.validatedItems,
      subtotal: financials.subtotal,
      discountType: financials.discountType,
      discountValue: financials.discountValue,
      discountAmount: financials.discountAmount,
      taxRateSnapshot: financials.taxRateSnapshot,
      taxAmount: financials.taxAmount,
      serviceChargeRateSnapshot: financials.serviceChargeRateSnapshot,
      serviceChargeAmount: financials.serviceChargeAmount,
      grandTotal: financials.grandTotal,
      status: ORDER_STATUS.PLACED,
      paymentStatus: 'unpaid',
      cashierId,
      serverId,
      notes,
    });

    await newOrder.save();

    // If dine-in, mark table as occupied and assign active order
    if (tableId && orderType === ORDER_TYPES.DINE_IN) {
      await Table.findByIdAndUpdate(tableId, {
        status: TABLE_STATUS.OCCUPIED,
        activeOrderId: newOrder._id,
      });
    }

    // Auto-deduct recipe stock
    if (autoDeductStock) {
      try {
        await inventoryService.deductIngredientsForOrder({
          order: newOrder,
          performedBy: cashierId,
        });
      } catch (err) {
        console.warn(`[Inventory] Recipe stock deduction warning for Order #${newOrder.orderNumber}:`, err.message);
      }
    }

    return newOrder;
  },

  /**
   * Update order status with validation against permitted lifecycle transitions
   */
  async transitionOrderStatus({ orderId, newStatus, user, reason = '' }) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found.');
    }

    // Validate transition
    const allowedTransitions = VALID_ORDER_TRANSITIONS[order.status] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from '${order.status}' to '${newStatus}'. Permitted transitions: [${allowedTransitions.join(', ')}]`
      );
    }

    order.status = newStatus;

    if (newStatus === ORDER_STATUS.CANCELLED) {
      order.cancellationReason = reason || 'No reason specified';
      order.cancelledBy = user?._id || null;
      order.cancelledAt = new Date();

      // Free table if dine-in
      if (order.tableId) {
        await Table.findByIdAndUpdate(order.tableId, {
          status: TABLE_STATUS.AVAILABLE,
          activeOrderId: null,
        });
      }

      // Restore recipe ingredients
      await inventoryService.restoreIngredientsForOrder({
        order,
        performedBy: user?._id,
        reason,
      });
    }

    if (newStatus === ORDER_STATUS.COMPLETED) {
      order.completedAt = new Date();
      // Free table if dine-in
      if (order.tableId) {
        await Table.findByIdAndUpdate(order.tableId, {
          status: TABLE_STATUS.AVAILABLE,
          activeOrderId: null,
        });
      }
    }

    await order.save();
    return order;
  },
};
