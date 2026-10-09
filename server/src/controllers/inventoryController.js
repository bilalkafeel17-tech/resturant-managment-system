import { Ingredient } from '../models/Ingredient.js';
import { InventoryMovement } from '../models/InventoryMovement.js';
import { inventoryService } from '../services/inventoryService.js';

export const inventoryController = {
  async getIngredients(req, res, next) {
    try {
      const { branchId, category, search, lowStockOnly } = req.query;
      const targetBranchId = branchId || req.branchId;

      const query = {
        restaurantId: req.restaurantId,
        isActive: true,
      };

      if (targetBranchId) query.branchId = targetBranchId;
      if (category) query.category = category;
      if (search && search.trim()) {
        query.name = { $regex: search.trim(), $options: 'i' };
      }
      if (lowStockOnly === 'true') {
        query.$expr = { $lte: ['$currentStock', '$minStockAlert'] };
      }

      const ingredients = await Ingredient.find(query)
        .populate('supplierId', 'name phone')
        .populate('branchId', 'name code')
        .sort({ category: 1, name: 1 });

      res.status(200).json({ success: true, count: ingredients.length, ingredients });
    } catch (error) {
      next(error);
    }
  },

  async createIngredient(req, res, next) {
    try {
      const {
        branchId,
        name,
        sku = '',
        category = 'General',
        unit = 'kg',
        currentStock = 0,
        minStockAlert = 5,
        costPerUnit = 0,
        supplierId = null,
      } = req.body;

      const targetBranchId = branchId || req.branchId;
      if (!name || !targetBranchId) {
        return res.status(400).json({ success: false, message: 'Ingredient name and Branch are required.' });
      }

      const ingredient = await Ingredient.create({
        restaurantId: req.restaurantId,
        branchId: targetBranchId,
        name,
        sku,
        category,
        unit,
        currentStock: Number(currentStock) || 0,
        minStockAlert: Number(minStockAlert) || 5,
        costPerUnit: Number(costPerUnit) || 0,
        supplierId: supplierId || null,
      });

      res.status(201).json({ success: true, message: 'Ingredient created successfully!', ingredient });
    } catch (error) {
      next(error);
    }
  },

  async updateIngredient(req, res, next) {
    try {
      const { id } = req.params;
      const { name, sku, category, unit, minStockAlert, costPerUnit, supplierId, isActive } = req.body;

      const ingredient = await Ingredient.findOne({ _id: id, restaurantId: req.restaurantId });
      if (!ingredient) {
        return res.status(404).json({ success: false, message: 'Ingredient not found.' });
      }

      if (name) ingredient.name = name;
      if (sku !== undefined) ingredient.sku = sku;
      if (category) ingredient.category = category;
      if (unit) ingredient.unit = unit;
      if (minStockAlert !== undefined) ingredient.minStockAlert = Number(minStockAlert);
      if (costPerUnit !== undefined) ingredient.costPerUnit = Number(costPerUnit);
      if (supplierId !== undefined) ingredient.supplierId = supplierId || null;
      if (isActive !== undefined) ingredient.isActive = isActive;

      await ingredient.save();

      res.status(200).json({ success: true, message: 'Ingredient updated successfully!', ingredient });
    } catch (error) {
      next(error);
    }
  },

  async adjustStock(req, res, next) {
    try {
      const { id } = req.params;
      const { quantityChange, movementType, reason } = req.body;

      if (quantityChange === undefined || isNaN(Number(quantityChange))) {
        return res.status(400).json({ success: false, message: 'Valid quantityChange is required.' });
      }

      const ingredient = await Ingredient.findOne({ _id: id, restaurantId: req.restaurantId });
      if (!ingredient) {
        return res.status(404).json({ success: false, message: 'Ingredient not found.' });
      }

      const result = await inventoryService.adjustStock({
        restaurantId: req.restaurantId,
        branchId: ingredient.branchId,
        ingredientId: ingredient._id,
        quantityChange: Number(quantityChange),
        movementType,
        reason,
        performedBy: req.user._id,
      });

      res.status(200).json({
        success: true,
        message: 'Stock adjusted successfully!',
        ingredient: result.ingredient,
        movement: result.movement,
      });
    } catch (error) {
      next(error);
    }
  },

  async getMovements(req, res, next) {
    try {
      const { ingredientId, branchId, page = 1, limit = 30 } = req.query;
      const targetBranchId = branchId || req.branchId;

      const query = {
        restaurantId: req.restaurantId,
      };

      if (targetBranchId) query.branchId = targetBranchId;
      if (ingredientId) query.ingredientId = ingredientId;

      const skip = (Number(page) - 1) * Number(limit);
      const [movements, total] = await Promise.all([
        InventoryMovement.find(query)
          .populate('performedBy', 'name')
          .populate('referenceOrderId', 'orderNumber')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        InventoryMovement.countDocuments(query),
      ]);

      res.status(200).json({
        success: true,
        count: movements.length,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)) || 1,
        movements,
      });
    } catch (error) {
      next(error);
    }
  },
};
