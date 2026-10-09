import { User } from '../models/User.js';
import { ROLES } from '../config/constants.js';

export const staffController = {
  async getStaff(req, res, next) {
    try {
      const { branchId, role } = req.query;
      const query = {
        restaurantId: req.restaurantId,
      };

      if (branchId) query.branchId = branchId;
      if (role) query.role = role;

      const staff = await User.find(query)
        .populate('branchId', 'name code')
        .sort({ role: 1, name: 1 });

      res.status(200).json({ success: true, count: staff.length, staff });
    } catch (error) {
      next(error);
    }
  },

  async createStaff(req, res, next) {
    try {
      const { name, email, password, role = ROLES.CASHIER, branchId, phone = '' } = req.body;

      if (!name || !email || !password || !role) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, password, and role are required.',
        });
      }

      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists.',
        });
      }

      const staff = await User.create({
        restaurantId: req.restaurantId,
        branchId: branchId || null,
        name,
        email: email.toLowerCase(),
        password,
        role,
        phone,
      });

      res.status(201).json({
        success: true,
        message: 'Staff member created successfully!',
        staff: staff.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  },

  async updateStaff(req, res, next) {
    try {
      const { id } = req.params;
      const { name, role, branchId, phone, password, isActive } = req.body;

      const staff = await User.findOne({ _id: id, restaurantId: req.restaurantId }).select('+password');
      if (!staff) {
        return res.status(404).json({ success: false, message: 'Staff member not found.' });
      }

      if (name) staff.name = name;
      if (role) staff.role = role;
      if (branchId !== undefined) staff.branchId = branchId || null;
      if (phone !== undefined) staff.phone = phone;
      if (password) staff.password = password;
      if (isActive !== undefined) staff.isActive = isActive;

      await staff.save();

      res.status(200).json({
        success: true,
        message: 'Staff member updated successfully!',
        staff: staff.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  },
};
