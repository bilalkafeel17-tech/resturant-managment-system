import { MenuItem } from '../models/MenuItem.js';
import { Category } from '../models/Category.js';

export const menuItemController = {
  /**
   * Get menu items with search, category filtering, and availability toggles
   */
  async getMenuItems(req, res, next) {
    try {
      const { categoryId, search, isAvailable, isFeatured } = req.query;

      const query = {
        restaurantId: req.restaurantId,
      };

      if (categoryId) {
        query.categoryId = categoryId;
      }

      if (search && search.trim()) {
        query.name = { $regex: search.trim(), $options: 'i' };
      }

      if (isAvailable !== undefined) {
        query.isAvailable = isAvailable === 'true';
      }

      if (isFeatured !== undefined) {
        query.isFeatured = isFeatured === 'true';
      }

      const items = await MenuItem.find(query)
        .populate('categoryId', 'name slug')
        .sort({ sortOrder: 1, name: 1 });

      res.status(200).json({ success: true, count: items.length, items });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get single menu item by ID
   */
  async getMenuItemById(req, res, next) {
    try {
      const item = await MenuItem.findOne({
        _id: req.params.id,
        restaurantId: req.restaurantId,
      }).populate('categoryId', 'name slug');

      if (!item) {
        return res.status(404).json({ success: false, message: 'Menu item not found' });
      }

      res.status(200).json({ success: true, item });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create a new menu item
   */
  async createMenuItem(req, res, next) {
    try {
      const {
        categoryId,
        name,
        description = '',
        basePrice,
        costPrice = 0,
        sku = '',
        imageUrl = '',
        isAvailable = true,
        preparationTimeMinutes = 15,
        variants = [],
        addOns = [],
        isVegetarian = false,
        isSpicy = false,
        isFeatured = false,
        hasRecipe = false,
      } = req.body;

      if (!categoryId || !name || basePrice === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Category, item name, and base price are required.',
        });
      }

      const category = await Category.findOne({ _id: categoryId, restaurantId: req.restaurantId });
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found.' });
      }

      const item = await MenuItem.create({
        restaurantId: req.restaurantId,
        categoryId,
        name,
        description,
        basePrice: Number(basePrice),
        costPrice: Number(costPrice) || 0,
        sku,
        imageUrl,
        isAvailable: Boolean(isAvailable),
        preparationTimeMinutes: Number(preparationTimeMinutes) || 15,
        variants,
        addOns,
        isVegetarian: Boolean(isVegetarian),
        isSpicy: Boolean(isSpicy),
        isFeatured: Boolean(isFeatured),
        hasRecipe: Boolean(hasRecipe),
      });

      res.status(201).json({ success: true, message: 'Menu item created successfully!', item });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update existing menu item
   */
  async updateMenuItem(req, res, next) {
    try {
      const { id } = req.params;
      const {
        categoryId,
        name,
        description,
        basePrice,
        costPrice,
        sku,
        imageUrl,
        isAvailable,
        preparationTimeMinutes,
        variants,
        addOns,
        isVegetarian,
        isSpicy,
        isFeatured,
        hasRecipe,
      } = req.body;

      const item = await MenuItem.findOne({ _id: id, restaurantId: req.restaurantId });
      if (!item) {
        return res.status(404).json({ success: false, message: 'Menu item not found.' });
      }

      if (categoryId) item.categoryId = categoryId;
      if (name) item.name = name;
      if (description !== undefined) item.description = description;
      if (basePrice !== undefined) item.basePrice = Number(basePrice);
      if (costPrice !== undefined) item.costPrice = Number(costPrice);
      if (sku !== undefined) item.sku = sku;
      if (imageUrl !== undefined) item.imageUrl = imageUrl;
      if (isAvailable !== undefined) item.isAvailable = isAvailable;
      if (preparationTimeMinutes !== undefined) item.preparationTimeMinutes = Number(preparationTimeMinutes);
      if (variants !== undefined) item.variants = variants;
      if (addOns !== undefined) item.addOns = addOns;
      if (isVegetarian !== undefined) item.isVegetarian = isVegetarian;
      if (isSpicy !== undefined) item.isSpicy = isSpicy;
      if (isFeatured !== undefined) item.isFeatured = isFeatured;
      if (hasRecipe !== undefined) item.hasRecipe = hasRecipe;

      await item.save();

      res.status(200).json({ success: true, message: 'Menu item updated successfully!', item });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Quick toggle availability for POS
   */
  async toggleAvailability(req, res, next) {
    try {
      const { id } = req.params;
      const item = await MenuItem.findOne({ _id: id, restaurantId: req.restaurantId });
      if (!item) {
        return res.status(404).json({ success: false, message: 'Menu item not found' });
      }

      item.isAvailable = !item.isAvailable;
      await item.save();

      res.status(200).json({
        success: true,
        message: `Item is now ${item.isAvailable ? 'available' : 'marked out of stock'}`,
        item,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete menu item
   */
  async deleteMenuItem(req, res, next) {
    try {
      const { id } = req.params;
      const item = await MenuItem.findOneAndDelete({ _id: id, restaurantId: req.restaurantId });
      if (!item) {
        return res.status(404).json({ success: false, message: 'Menu item not found' });
      }

      res.status(200).json({ success: true, message: 'Menu item deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
