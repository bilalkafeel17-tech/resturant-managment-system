import { reportService } from '../services/reportService.js';
import { Expense } from '../models/Expense.js';

export const reportController = {
  /**
   * Real-time dashboard KPI summary
   */
  async getDashboardSummary(req, res, next) {
    try {
      const { branchId, date } = req.query;
      const targetBranchId = branchId || req.branchId;

      const summary = await reportService.getDashboardSummary({
        restaurantId: req.restaurantId,
        branchId: targetBranchId,
        date: date || new Date(),
      });

      res.status(200).json({ success: true, ...summary });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Sales report with date range & branch filters
   */
  async getSalesReport(req, res, next) {
    try {
      const { branchId, startDate, endDate, orderType } = req.query;
      const targetBranchId = branchId || req.branchId;

      const report = await reportService.getSalesReport({
        restaurantId: req.restaurantId,
        branchId: targetBranchId,
        startDate,
        endDate,
        orderType,
      });

      res.status(200).json({ success: true, ...report });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Inventory valuation & stock report
   */
  async getInventoryReport(req, res, next) {
    try {
      const { branchId } = req.query;
      const targetBranchId = branchId || req.branchId;

      const report = await reportService.getInventoryReport({
        restaurantId: req.restaurantId,
        branchId: targetBranchId,
      });

      res.status(200).json({ success: true, ...report });
    } catch (error) {
      next(error);
    }
  },

  /**
   * CSV Export: Sales Orders
   */
  async exportSalesCSV(req, res, next) {
    try {
      const { branchId, startDate, endDate } = req.query;
      const targetBranchId = branchId || req.branchId;

      const report = await reportService.getSalesReport({
        restaurantId: req.restaurantId,
        branchId: targetBranchId,
        startDate,
        endDate,
      });

      const headers = ['Order Number', 'Date', 'Type', 'Status', 'Payment Status', 'Subtotal', 'Tax', 'Discount', 'Grand Total'];
      const rows = report.orders.map((o) => [
        `"${o.orderNumber}"`,
        `"${new Date(o.createdAt).toISOString().slice(0, 19).replace('T', ' ')}"`,
        `"${o.orderType}"`,
        `"${o.status}"`,
        `"${o.paymentStatus}"`,
        o.subtotal || 0,
        o.taxAmount || 0,
        o.discountAmount || 0,
        o.grandTotal || 0,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="servora_sales_${Date.now()}.csv"`);
      res.status(200).send(csvContent);
    } catch (error) {
      next(error);
    }
  },

  /**
   * CSV Export: Inventory Valuation & Stock
   */
  async exportInventoryCSV(req, res, next) {
    try {
      const { branchId } = req.query;
      const targetBranchId = branchId || req.branchId;

      const report = await reportService.getInventoryReport({
        restaurantId: req.restaurantId,
        branchId: targetBranchId,
      });

      const headers = ['Ingredient Name', 'Category', 'Unit', 'Current Stock', 'Min Alert Level', 'Cost Per Unit', 'Total Valuation', 'Status'];
      const rows = report.items.map((i) => [
        `"${i.name.replace(/"/g, '""')}"`,
        `"${i.category}"`,
        `"${i.unit}"`,
        i.currentStock,
        i.minStockAlert,
        i.costPerUnit,
        i.stockValuation,
        `"${i.isLowStock ? 'LOW STOCK' : 'IN STOCK'}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="servora_inventory_${Date.now()}.csv"`);
      res.status(200).send(csvContent);
    } catch (error) {
      next(error);
    }
  },

  /**
   * CSV Export: Expenses
   */
  async exportExpensesCSV(req, res, next) {
    try {
      const { branchId, startDate, endDate } = req.query;
      const targetBranchId = branchId || req.branchId;

      const query = { restaurantId: req.restaurantId };
      if (targetBranchId) query.branchId = targetBranchId;

      const expenses = await Expense.find(query).populate('recordedBy', 'name').sort({ expenseDate: -1 });

      const headers = ['Title', 'Category', 'Amount', 'Date', 'Payment Method', 'Reference', 'Recorded By'];
      const rows = expenses.map((e) => [
        `"${e.title.replace(/"/g, '""')}"`,
        `"${e.category}"`,
        e.amount,
        `"${new Date(e.expenseDate).toISOString().slice(0, 10)}"`,
        `"${e.paymentMethod}"`,
        `"${e.referenceNumber || ''}"`,
        `"${e.recordedBy?.name || 'Staff'}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="servora_expenses_${Date.now()}.csv"`);
      res.status(200).send(csvContent);
    } catch (error) {
      next(error);
    }
  },
};
