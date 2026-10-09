import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { Ingredient } from '../models/Ingredient.js';
import { Expense } from '../models/Expense.js';
import { ORDER_STATUS, PAYMENT_STATUS } from '../config/constants.js';

export const reportService = {
  /**
   * Aggregates real-time operational dashboard KPIs
   */
  async getDashboardSummary({ restaurantId, branchId = null, date = new Date() }) {
    const restaurantObjId = new mongoose.Types.ObjectId(restaurantId);
    
    // Start and end of specified date (default today)
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

    const baseMatch = {
      restaurantId: restaurantObjId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    };

    if (branchId) {
      baseMatch.branchId = new mongoose.Types.ObjectId(branchId);
    }

    // 1. Order Aggregation for Today
    const [orderStats] = await Order.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', ORDER_STATUS.COMPLETED] }, 1, 0] },
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', ORDER_STATUS.CANCELLED] }, 1, 0] },
          },
          activeOrders: {
            $sum: {
              $cond: [
                { $in: ['$status', [ORDER_STATUS.PLACED, ORDER_STATUS.IN_KITCHEN, ORDER_STATUS.READY, ORDER_STATUS.SERVED]] },
                1,
                0,
              ],
            },
          },
          grossSales: {
            $sum: {
              $cond: [{ $ne: ['$status', ORDER_STATUS.CANCELLED] }, '$grandTotal', 0],
            },
          },
          totalDiscounts: {
            $sum: {
              $cond: [{ $ne: ['$status', ORDER_STATUS.CANCELLED] }, '$discountAmount', 0],
            },
          },
          totalTax: {
            $sum: {
              $cond: [{ $ne: ['$status', ORDER_STATUS.CANCELLED] }, '$taxAmount', 0],
            },
          },
          totalServiceCharge: {
            $sum: {
              $cond: [{ $ne: ['$status', ORDER_STATUS.CANCELLED] }, '$serviceChargeAmount', 0],
            },
          },
        },
      },
    ]) || [{ totalOrders: 0, completedOrders: 0, cancelledOrders: 0, activeOrders: 0, grossSales: 0, totalDiscounts: 0, totalTax: 0, totalServiceCharge: 0 }];

    const stats = orderStats || {
      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      activeOrders: 0,
      grossSales: 0,
      totalDiscounts: 0,
      totalTax: 0,
      totalServiceCharge: 0,
    };

    // Net sales = Gross Sales - Tax - Service Charge
    const netSales = Math.max(0, Number((stats.grossSales - stats.totalTax - stats.totalServiceCharge).toFixed(2)));
    const avgOrderValue = stats.totalOrders > 0 ? Number((stats.grossSales / stats.totalOrders).toFixed(2)) : 0;

    // 2. Collected Payments (Only strictly successful payments count as collected revenue)
    const paymentMatch = {
      restaurantId: restaurantObjId,
      status: PAYMENT_STATUS.PAID,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    };
    if (branchId) {
      paymentMatch.branchId = new mongoose.Types.ObjectId(branchId);
    }

    const [paymentStats] = await Payment.aggregate([
      { $match: paymentMatch },
      {
        $group: {
          _id: null,
          totalCollected: { $sum: '$amount' },
        },
      },
    ]) || [{ totalCollected: 0 }];

    const collectedRevenue = paymentStats?.totalCollected || 0;

    // 3. Payment Method Breakdown
    const paymentBreakdown = await Payment.aggregate([
      { $match: paymentMatch },
      {
        $group: {
          _id: '$paymentMethod',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          method: '$_id',
          totalAmount: { $round: ['$totalAmount', 2] },
          count: 1,
          _id: 0,
        },
      },
    ]);

    // 4. Popular Items Today
    const popularItems = await Order.aggregate([
      {
        $match: {
          ...baseMatch,
          status: { $ne: ORDER_STATUS.CANCELLED },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItemId',
          name: { $first: '$items.nameSnapshot' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.itemSubtotal' },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 6 },
    ]);

    // 5. 7-Day Sales Trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const trendMatch = {
      restaurantId: restaurantObjId,
      createdAt: { $gte: sevenDaysAgo },
      status: { $ne: ORDER_STATUS.CANCELLED },
    };
    if (branchId) {
      trendMatch.branchId = new mongoose.Types.ObjectId(branchId);
    }

    const salesTrends = await Order.aggregate([
      { $match: trendMatch },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          sales: { $sum: '$grandTotal' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          sales: { $round: ['$sales', 2] },
          orders: 1,
          _id: 0,
        },
      },
    ]);

    // 6. Low Stock Inventory Count & Top Alerts
    const ingredientMatch = {
      restaurantId: restaurantObjId,
      isActive: true,
    };
    if (branchId) {
      ingredientMatch.branchId = new mongoose.Types.ObjectId(branchId);
    }

    const lowStockIngredients = await Ingredient.find({
      ...ingredientMatch,
      $expr: { $lte: ['$currentStock', '$minStockAlert'] },
    })
      .select('name currentStock minStockAlert unit category')
      .limit(8)
      .lean();

    // 7. Recent Orders
    const recentOrders = await Order.find(baseMatch)
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('cashierId', 'name')
      .lean();

    return {
      today: {
        grossSales: Number(stats.grossSales.toFixed(2)),
        netSales,
        collectedRevenue: Number(collectedRevenue.toFixed(2)),
        totalOrders: stats.totalOrders,
        completedOrders: stats.completedOrders,
        activeOrders: stats.activeOrders,
        cancelledOrders: stats.cancelledOrders,
        avgOrderValue,
        totalTax: Number(stats.totalTax.toFixed(2)),
        totalDiscounts: Number(stats.totalDiscounts.toFixed(2)),
      },
      paymentBreakdown,
      popularItems,
      salesTrends,
      lowStockAlerts: {
        count: lowStockIngredients.length,
        items: lowStockIngredients,
      },
      recentOrders,
    };
  },

  /**
   * Detailed Sales Report by Date Range
   */
  async getSalesReport({ restaurantId, branchId = null, startDate, endDate, orderType = null }) {
    const restaurantObjId = new mongoose.Types.ObjectId(restaurantId);
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const matchQuery = {
      restaurantId: restaurantObjId,
      createdAt: { $gte: start, $lte: end },
    };

    if (branchId) {
      matchQuery.branchId = new mongoose.Types.ObjectId(branchId);
    }
    if (orderType) {
      matchQuery.orderType = orderType;
    }

    const orders = await Order.find(matchQuery)
      .populate('branchId', 'name code')
      .populate('cashierId', 'name')
      .populate('tableId', 'tableNumber')
      .sort({ createdAt: -1 })
      .lean();

    // Summary Totals
    let totalGross = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    let totalOrders = orders.length;
    let completedCount = 0;
    let cancelledCount = 0;

    for (const ord of orders) {
      if (ord.status === ORDER_STATUS.CANCELLED) {
        cancelledCount++;
      } else {
        totalGross += ord.grandTotal || 0;
        totalTax += ord.taxAmount || 0;
        totalDiscount += ord.discountAmount || 0;
        if (ord.status === ORDER_STATUS.COMPLETED) {
          completedCount++;
        }
      }
    }

    return {
      summary: {
        totalOrders,
        completedCount,
        cancelledCount,
        totalGross: Number(totalGross.toFixed(2)),
        totalTax: Number(totalTax.toFixed(2)),
        totalDiscount: Number(totalDiscount.toFixed(2)),
        netSales: Number((totalGross - totalTax).toFixed(2)),
      },
      orders,
    };
  },

  /**
   * Inventory Valuation and Usage Report
   */
  async getInventoryReport({ restaurantId, branchId = null }) {
    const matchQuery = {
      restaurantId: new mongoose.Types.ObjectId(restaurantId),
      isActive: true,
    };
    if (branchId) {
      matchQuery.branchId = new mongoose.Types.ObjectId(branchId);
    }

    const ingredients = await Ingredient.find(matchQuery)
      .populate('supplierId', 'name')
      .sort({ category: 1, name: 1 })
      .lean();

    let totalStockValuation = 0;
    let lowStockCount = 0;

    const items = ingredients.map((ing) => {
      const isLow = ing.currentStock <= ing.minStockAlert;
      if (isLow) lowStockCount++;
      const valuation = Number((ing.currentStock * (ing.costPerUnit || 0)).toFixed(2));
      totalStockValuation += valuation;

      return {
        ...ing,
        isLowStock: isLow,
        stockValuation: valuation,
      };
    });

    return {
      totalItems: items.length,
      lowStockCount,
      totalStockValuation: Number(totalStockValuation.toFixed(2)),
      items,
    };
  },
};
