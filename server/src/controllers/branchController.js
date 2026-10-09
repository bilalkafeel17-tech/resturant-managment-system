import { Branch } from '../models/Branch.js';
import { AuditLog } from '../models/AuditLog.js';

export const branchController = {
  /**
   * Get all branches for current restaurant
   */
  async getBranches(req, res, next) {
    try {
      const branches = await Branch.find({
        restaurantId: req.restaurantId,
        isActive: true,
      }).sort({ isMain: -1, name: 1 });

      res.status(200).json({ success: true, count: branches.length, branches });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create a new branch
   */
  async createBranch(req, res, next) {
    try {
      const { name, code, address, city = 'Lahore', phone, isMain = false } = req.body;

      if (!name || !code || !address || !phone) {
        return res.status(400).json({
          success: false,
          message: 'Branch name, code, address, and phone are required.',
        });
      }

      // Check unique code per restaurant
      const existing = await Branch.findOne({
        restaurantId: req.restaurantId,
        code: code.toUpperCase().trim(),
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Branch code '${code.toUpperCase()}' already exists.`,
        });
      }

      const branch = await Branch.create({
        restaurantId: req.restaurantId,
        name,
        code: code.toUpperCase().trim(),
        address,
        city,
        phone,
        isMain: Boolean(isMain),
      });

      await AuditLog.create({
        restaurantId: req.restaurantId,
        userId: req.user._id,
        userName: req.user.name,
        action: 'BRANCH_CREATED',
        resource: 'Branch',
        resourceId: branch._id.toString(),
        details: { name, code },
      });

      res.status(201).json({
        success: true,
        message: 'Branch created successfully!',
        branch,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update branch
   */
  async updateBranch(req, res, next) {
    try {
      const { id } = req.params;
      const { name, address, city, phone, isMain, isActive } = req.body;

      const branch = await Branch.findOne({ _id: id, restaurantId: req.restaurantId });
      if (!branch) {
        return res.status(404).json({ success: false, message: 'Branch not found.' });
      }

      if (name) branch.name = name;
      if (address) branch.address = address;
      if (city) branch.city = city;
      if (phone) branch.phone = phone;
      if (isMain !== undefined) branch.isMain = isMain;
      if (isActive !== undefined) branch.isActive = isActive;

      await branch.save();

      res.status(200).json({
        success: true,
        message: 'Branch updated successfully!',
        branch,
      });
    } catch (error) {
      next(error);
    }
  },
};
