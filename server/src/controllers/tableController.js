import { Table } from '../models/Table.js';
import { TABLE_STATUS } from '../config/constants.js';

export const tableController = {
  async getTables(req, res, next) {
    try {
      const { branchId, section, status } = req.query;
      const targetBranchId = branchId || req.branchId;

      const query = {
        restaurantId: req.restaurantId,
        isActive: true,
      };

      if (targetBranchId) {
        query.branchId = targetBranchId;
      }
      if (section) {
        query.section = section;
      }
      if (status) {
        query.status = status;
      }

      const tables = await Table.find(query)
        .populate({
          path: 'activeOrderId',
          select: 'orderNumber grandTotal status items customerInfo createdAt',
        })
        .populate('branchId', 'name code')
        .sort({ section: 1, tableNumber: 1 });

      res.status(200).json({ success: true, count: tables.length, tables });
    } catch (error) {
      next(error);
    }
  },

  async createTable(req, res, next) {
    try {
      const { tableNumber, capacity = 4, section = 'Main Dining', branchId } = req.body;
      const targetBranchId = branchId || req.branchId;

      if (!tableNumber || !targetBranchId) {
        return res.status(400).json({
          success: false,
          message: 'Table number and Branch are required.',
        });
      }

      const existing = await Table.findOne({
        restaurantId: req.restaurantId,
        branchId: targetBranchId,
        tableNumber: tableNumber.trim(),
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Table number '${tableNumber}' already exists in this branch.`,
        });
      }

      const table = await Table.create({
        restaurantId: req.restaurantId,
        branchId: targetBranchId,
        tableNumber: tableNumber.trim(),
        capacity: Number(capacity) || 4,
        section,
        status: TABLE_STATUS.AVAILABLE,
      });

      res.status(201).json({ success: true, message: 'Table created successfully!', table });
    } catch (error) {
      next(error);
    }
  },

  async updateTable(req, res, next) {
    try {
      const { id } = req.params;
      const { tableNumber, capacity, section, status, isActive } = req.body;

      const table = await Table.findOne({ _id: id, restaurantId: req.restaurantId });
      if (!table) {
        return res.status(404).json({ success: false, message: 'Table not found' });
      }

      if (tableNumber) table.tableNumber = tableNumber.trim();
      if (capacity) table.capacity = Number(capacity);
      if (section) table.section = section;
      if (status) table.status = status;
      if (isActive !== undefined) table.isActive = isActive;

      await table.save();

      res.status(200).json({ success: true, message: 'Table updated successfully!', table });
    } catch (error) {
      next(error);
    }
  },

  async updateTableStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!Object.values(TABLE_STATUS).includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid table status.' });
      }

      const table = await Table.findOne({ _id: id, restaurantId: req.restaurantId });
      if (!table) {
        return res.status(404).json({ success: false, message: 'Table not found' });
      }

      table.status = status;
      if (status === TABLE_STATUS.AVAILABLE) {
        table.activeOrderId = null;
      }
      await table.save();

      res.status(200).json({ success: true, message: `Table status changed to ${status}`, table });
    } catch (error) {
      next(error);
    }
  },

  async deleteTable(req, res, next) {
    try {
      const { id } = req.params;
      const table = await Table.findOneAndDelete({ _id: id, restaurantId: req.restaurantId });
      if (!table) {
        return res.status(404).json({ success: false, message: 'Table not found' });
      }
      res.status(200).json({ success: true, message: 'Table deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
