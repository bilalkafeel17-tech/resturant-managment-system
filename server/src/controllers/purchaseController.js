import { Purchase } from '../models/Purchase.js';
import { Ingredient } from '../models/Ingredient.js';
import { inventoryService } from '../services/inventoryService.js';

export const purchaseController = {
  async getPurchases(req, res, next) {
    try {
      const { branchId, status, page = 1, limit = 20 } = req.query;
      const targetBranchId = branchId || req.branchId;

      const query = {
        restaurantId: req.restaurantId,
      };

      if (targetBranchId) query.branchId = targetBranchId;
      if (status) query.status = status;

      const skip = (Number(page) - 1) * Number(limit);
      const [purchases, total] = await Promise.all([
        Purchase.find(query)
          .populate('supplierId', 'name phone contactPerson')
          .populate('branchId', 'name code')
          .populate('createdBy', 'name')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Purchase.countDocuments(query),
      ]);

      res.status(200).json({
        success: true,
        count: purchases.length,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)) || 1,
        purchases,
      });
    } catch (error) {
      next(error);
    }
  },

  async createPurchase(req, res, next) {
    try {
      const { supplierId, branchId, invoiceNumber = '', items, notes = '' } = req.body;
      const targetBranchId = branchId || req.branchId;

      if (!supplierId || !targetBranchId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Supplier, branch, and at least one purchase line item are required.',
        });
      }

      let totalAmount = 0;
      const validatedItems = [];

      for (const item of items) {
        const ingredient = await Ingredient.findById(item.ingredientId);
        if (!ingredient) {
          throw new Error(`Ingredient with ID ${item.ingredientId} not found.`);
        }

        const qty = Number(item.quantity) || 1;
        const unitCost = Number(item.unitCost) || ingredient.costPerUnit || 0;
        const lineTotal = Number((qty * unitCost).toFixed(2));
        totalAmount += lineTotal;

        validatedItems.push({
          ingredientId: ingredient._id,
          ingredientNameSnapshot: ingredient.name,
          quantity: qty,
          unit: item.unit || ingredient.unit,
          unitCost,
          totalCost: lineTotal,
        });
      }

      const purchaseCount = await Purchase.countDocuments({ restaurantId: req.restaurantId });
      const purchaseOrderNumber = `PO-${Date.now().toString().slice(-6)}-${purchaseCount + 1}`;

      const purchase = await Purchase.create({
        restaurantId: req.restaurantId,
        branchId: targetBranchId,
        supplierId,
        purchaseOrderNumber,
        invoiceNumber,
        items: validatedItems,
        totalAmount: Number(totalAmount.toFixed(2)),
        status: 'draft',
        paymentStatus: 'unpaid',
        createdBy: req.user._id,
        notes,
      });

      res.status(201).json({
        success: true,
        message: 'Purchase order created successfully!',
        purchase,
      });
    } catch (error) {
      next(error);
    }
  },

  async receivePurchase(req, res, next) {
    try {
      const { id } = req.params;
      const purchase = await Purchase.findOne({ _id: id, restaurantId: req.restaurantId });

      if (!purchase) {
        return res.status(404).json({ success: false, message: 'Purchase order not found.' });
      }

      if (purchase.status === 'received') {
        return res.status(400).json({ success: false, message: 'This purchase order has already been received.' });
      }

      // Automatically add purchased quantities into inventory stock & logs
      await inventoryService.receivePurchaseOrder({
        purchase,
        performedBy: req.user._id,
      });

      purchase.status = 'received';
      purchase.receivedAt = new Date();
      await purchase.save();

      res.status(200).json({
        success: true,
        message: `Purchase Order #${purchase.purchaseOrderNumber} received and stock updated!`,
        purchase,
      });
    } catch (error) {
      next(error);
    }
  },
};
