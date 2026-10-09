import { Ingredient } from '../models/Ingredient.js';
import { Recipe } from '../models/Recipe.js';
import { InventoryMovement } from '../models/InventoryMovement.js';
import { STOCK_MOVEMENT_TYPES } from '../config/constants.js';

/**
 * Inventory Automation Service
 * Handles recipe-driven automatic stock deductions, restorations, and adjustments
 */
export const inventoryService = {
  /**
   * Deduct ingredients for an order's items based on configured recipes
   */
  async deductIngredientsForOrder({ order, performedBy = null }) {
    if (!order || !order.items || order.items.length === 0) return;

    for (const item of order.items) {
      if (item.recipeDeducted) continue; // Prevent double deduction

      // Find recipe for this menu item (and specific variant if matched)
      let recipe = null;
      if (item.variantSnapshot && item.variantSnapshot.name) {
        recipe = await Recipe.findOne({
          restaurantId: order.restaurantId,
          menuItemId: item.menuItemId,
          variantName: item.variantSnapshot.name,
        });
      }

      if (!recipe) {
        // Fallback to base recipe
        recipe = await Recipe.findOne({
          restaurantId: order.restaurantId,
          menuItemId: item.menuItemId,
        });
      }

      if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
        continue;
      }

      const yieldPortions = recipe.yieldQuantity || 1;
      const multiplier = item.quantity / yieldPortions;

      for (const ingredientReq of recipe.ingredients) {
        const totalNeeded = Number((ingredientReq.quantity * multiplier).toFixed(4));
        
        const ingredient = await Ingredient.findOne({
          _id: ingredientReq.ingredientId,
          restaurantId: order.restaurantId,
          branchId: order.branchId,
        });

        if (!ingredient) continue;

        const previousStock = ingredient.currentStock;
        const newStock = Math.max(0, Number((previousStock - totalNeeded).toFixed(4)));

        // Update ingredient current stock
        ingredient.currentStock = newStock;
        await ingredient.save();

        // Record immutable inventory movement log
        await InventoryMovement.create({
          restaurantId: order.restaurantId,
          branchId: order.branchId,
          ingredientId: ingredient._id,
          ingredientName: ingredient.name,
          movementType: STOCK_MOVEMENT_TYPES.ORDER_CONSUMPTION,
          quantityChange: -totalNeeded,
          previousStock,
          newStock,
          unit: ingredient.unit,
          unitCost: ingredient.costPerUnit || 0,
          reason: `Order #${order.orderNumber} consumption (${item.nameSnapshot} x${item.quantity})`,
          referenceOrderId: order._id,
          performedBy,
        });
      }

      item.recipeDeducted = true;
    }

    await order.save();
  },

  /**
   * Restore ingredients if an order is cancelled after ingredients were deducted
   */
  async restoreIngredientsForOrder({ order, performedBy = null, reason = 'Order cancelled' }) {
    if (!order || !order.items) return;

    for (const item of order.items) {
      if (!item.recipeDeducted) continue;

      let recipe = await Recipe.findOne({
        restaurantId: order.restaurantId,
        menuItemId: item.menuItemId,
      });

      if (!recipe || !recipe.ingredients) continue;

      const yieldPortions = recipe.yieldQuantity || 1;
      const multiplier = item.quantity / yieldPortions;

      for (const ingredientReq of recipe.ingredients) {
        const totalToRestore = Number((ingredientReq.quantity * multiplier).toFixed(4));

        const ingredient = await Ingredient.findOne({
          _id: ingredientReq.ingredientId,
          restaurantId: order.restaurantId,
          branchId: order.branchId,
        });

        if (!ingredient) continue;

        const previousStock = ingredient.currentStock;
        const newStock = Number((previousStock + totalToRestore).toFixed(4));

        ingredient.currentStock = newStock;
        await ingredient.save();

        await InventoryMovement.create({
          restaurantId: order.restaurantId,
          branchId: order.branchId,
          ingredientId: ingredient._id,
          ingredientName: ingredient.name,
          movementType: STOCK_MOVEMENT_TYPES.CANCELLATION_RESTOCK,
          quantityChange: totalToRestore,
          previousStock,
          newStock,
          unit: ingredient.unit,
          unitCost: ingredient.costPerUnit || 0,
          reason: `Restock due to cancelled Order #${order.orderNumber}: ${reason}`,
          referenceOrderId: order._id,
          performedBy,
        });
      }

      item.recipeDeducted = false;
    }

    await order.save();
  },

  /**
   * Process manual stock adjustments (waste, manual count corrections)
   */
  async adjustStock({ restaurantId, branchId, ingredientId, quantityChange, movementType, reason, performedBy }) {
    const ingredient = await Ingredient.findOne({ _id: ingredientId, restaurantId, branchId });
    if (!ingredient) {
      throw new Error('Ingredient not found in the selected restaurant branch.');
    }

    const previousStock = ingredient.currentStock;
    const newStock = Math.max(0, Number((previousStock + quantityChange).toFixed(4)));

    ingredient.currentStock = newStock;
    await ingredient.save();

    const movement = await InventoryMovement.create({
      restaurantId,
      branchId,
      ingredientId: ingredient._id,
      ingredientName: ingredient.name,
      movementType: movementType || STOCK_MOVEMENT_TYPES.MANUAL_ADJUSTMENT,
      quantityChange,
      previousStock,
      newStock,
      unit: ingredient.unit,
      unitCost: ingredient.costPerUnit || 0,
      reason: reason || 'Manual stock adjustment',
      performedBy,
    });

    return { ingredient, movement };
  },

  /**
   * Receive purchase order goods into inventory
   */
  async receivePurchaseOrder({ purchase, performedBy }) {
    for (const item of purchase.items) {
      const ingredient = await Ingredient.findOne({
        _id: item.ingredientId,
        restaurantId: purchase.restaurantId,
        branchId: purchase.branchId,
      });

      if (!ingredient) continue;

      const previousStock = ingredient.currentStock;
      const newStock = Number((previousStock + item.quantity).toFixed(4));

      // Update unit cost if provided
      if (item.unitCost > 0) {
        ingredient.costPerUnit = item.unitCost;
      }
      ingredient.currentStock = newStock;
      await ingredient.save();

      await InventoryMovement.create({
        restaurantId: purchase.restaurantId,
        branchId: purchase.branchId,
        ingredientId: ingredient._id,
        ingredientName: ingredient.name,
        movementType: STOCK_MOVEMENT_TYPES.PURCHASE,
        quantityChange: item.quantity,
        previousStock,
        newStock,
        unit: ingredient.unit,
        unitCost: item.unitCost,
        reason: `Purchase Order received #${purchase.purchaseOrderNumber}`,
        referencePurchaseId: purchase._id,
        performedBy,
      });
    }
  },
};
