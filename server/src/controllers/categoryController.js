import { Category } from '../models/Category.js';
import { MenuItem } from '../models/MenuItem.js';

export const categoryController = {
  async getCategories(req, res, next) {
    try {
      const categories = await Category.find({
        restaurantId: req.restaurantId,
        isActive: true,
      }).sort({ sortOrder: 1, name: 1 });

      // Attach item counts
      const categoryIds = categories.map((c) => c._id);
      const counts = await MenuItem.aggregate([
        { $match: { restaurantId: req.restaurantId, categoryId: { $in: categoryIds } } },
        { $group: { _id: '$categoryId', count: { $sum: 1 } } },
      ]);

      const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));
      const categoriesWithCount = categories.map((cat) => ({
        ...cat.toObject(),
        itemCount: countMap.get(cat._id.toString()) || 0,
      }));

      res.status(200).json({ success: true, count: categoriesWithCount.length, categories: categoriesWithCount });
    } catch (error) {
      next(error);
    }
  },

  async createCategory(req, res, next) {
    try {
      const { name, description = '', iconName = 'Utensils', sortOrder = 0 } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, message: 'Category name is required' });
      }

      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      const category = await Category.create({
        restaurantId: req.restaurantId,
        name,
        slug,
        description,
        iconName,
        sortOrder: Number(sortOrder) || 0,
      });

      res.status(201).json({ success: true, message: 'Category created successfully!', category });
    } catch (error) {
      next(error);
    }
  },

  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, iconName, sortOrder, isActive } = req.body;

      const category = await Category.findOne({ _id: id, restaurantId: req.restaurantId });
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      if (name) {
        category.name = name;
        category.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }
      if (description !== undefined) category.description = description;
      if (iconName) category.iconName = iconName;
      if (sortOrder !== undefined) category.sortOrder = Number(sortOrder);
      if (isActive !== undefined) category.isActive = isActive;

      await category.save();

      res.status(200).json({ success: true, message: 'Category updated successfully!', category });
    } catch (error) {
      next(error);
    }
  },

  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      const category = await Category.findOneAndDelete({ _id: id, restaurantId: req.restaurantId });
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
