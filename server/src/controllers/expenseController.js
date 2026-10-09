import { Expense } from '../models/Expense.js';

export const expenseController = {
  async getExpenses(req, res, next) {
    try {
      const { branchId, category, startDate, endDate, page = 1, limit = 25 } = req.query;
      const targetBranchId = branchId || req.branchId;

      const query = {
        restaurantId: req.restaurantId,
      };

      if (targetBranchId) query.branchId = targetBranchId;
      if (category) query.category = category;

      if (startDate || endDate) {
        query.expenseDate = {};
        if (startDate) query.expenseDate.$gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          query.expenseDate.$lte = end;
        }
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [expenses, total] = await Promise.all([
        Expense.find(query)
          .populate('recordedBy', 'name')
          .populate('branchId', 'name code')
          .sort({ expenseDate: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Expense.countDocuments(query),
      ]);

      const [stats] = await Expense.aggregate([
        { $match: query },
        { $group: { _id: null, totalExpenseAmount: { $sum: '$amount' } } },
      ]) || [{ totalExpenseAmount: 0 }];

      res.status(200).json({
        success: true,
        count: expenses.length,
        total,
        totalExpenseAmount: stats?.totalExpenseAmount || 0,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)) || 1,
        expenses,
      });
    } catch (error) {
      next(error);
    }
  },

  async createExpense(req, res, next) {
    try {
      const { title, category, amount, branchId, expenseDate = new Date(), paymentMethod = 'cash', referenceNumber = '', notes = '' } = req.body;
      const targetBranchId = branchId || req.branchId;

      if (!title || !amount || !targetBranchId) {
        return res.status(400).json({
          success: false,
          message: 'Expense title, amount, and branch are required.',
        });
      }

      const expense = await Expense.create({
        restaurantId: req.restaurantId,
        branchId: targetBranchId,
        title,
        category: category || 'other',
        amount: Number(amount),
        expenseDate,
        paymentMethod,
        referenceNumber,
        recordedBy: req.user._id,
        notes,
      });

      res.status(201).json({
        success: true,
        message: 'Expense recorded successfully!',
        expense,
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteExpense(req, res, next) {
    try {
      const { id } = req.params;
      const expense = await Expense.findOneAndDelete({ _id: id, restaurantId: req.restaurantId });
      if (!expense) {
        return res.status(404).json({ success: false, message: 'Expense not found' });
      }

      res.status(200).json({ success: true, message: 'Expense deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
