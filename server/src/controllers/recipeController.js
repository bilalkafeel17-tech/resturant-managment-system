import { Recipe } from '../models/Recipe.js';
import { MenuItem } from '../models/MenuItem.js';

export const recipeController = {
  async getRecipes(req, res, next) {
    try {
      const recipes = await Recipe.find({ restaurantId: req.restaurantId })
        .populate('menuItemId', 'name basePrice imageUrl categoryId')
        .populate('ingredients.ingredientId', 'name unit costPerUnit currentStock')
        .sort({ createdAt: -1 });

      res.status(200).json({ success: true, count: recipes.length, recipes });
    } catch (error) {
      next(error);
    }
  },

  async getRecipeByMenuItem(req, res, next) {
    try {
      const { menuItemId } = req.params;
      const recipes = await Recipe.find({
        restaurantId: req.restaurantId,
        menuItemId,
      }).populate('ingredients.ingredientId', 'name unit costPerUnit currentStock');

      res.status(200).json({ success: true, recipes });
    } catch (error) {
      next(error);
    }
  },

  async saveRecipe(req, res, next) {
    try {
      const { menuItemId, variantName = '', yieldQuantity = 1, ingredients, instructions = '', prepNotes = '' } = req.body;

      if (!menuItemId || !ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Menu item ID and at least one recipe ingredient are required.',
        });
      }

      // Upsert recipe for this menu item + variant
      let recipe = await Recipe.findOne({
        restaurantId: req.restaurantId,
        menuItemId,
        variantName: variantName.trim(),
      });

      if (recipe) {
        recipe.yieldQuantity = Number(yieldQuantity) || 1;
        recipe.ingredients = ingredients;
        recipe.instructions = instructions;
        recipe.prepNotes = prepNotes;
        await recipe.save();
      } else {
        recipe = await Recipe.create({
          restaurantId: req.restaurantId,
          menuItemId,
          variantName: variantName.trim(),
          yieldQuantity: Number(yieldQuantity) || 1,
          ingredients,
          instructions,
          prepNotes,
        });
      }

      // Mark menu item as having a recipe
      await MenuItem.findByIdAndUpdate(menuItemId, { hasRecipe: true });

      const populatedRecipe = await Recipe.findById(recipe._id)
        .populate('menuItemId', 'name basePrice')
        .populate('ingredients.ingredientId', 'name unit costPerUnit');

      res.status(200).json({
        success: true,
        message: 'Recipe saved successfully!',
        recipe: populatedRecipe,
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteRecipe(req, res, next) {
    try {
      const { id } = req.params;
      const recipe = await Recipe.findOneAndDelete({ _id: id, restaurantId: req.restaurantId });
      if (!recipe) {
        return res.status(404).json({ success: false, message: 'Recipe not found' });
      }

      // Check if other recipes exist for this item
      const remaining = await Recipe.countDocuments({
        restaurantId: req.restaurantId,
        menuItemId: recipe.menuItemId,
      });
      if (remaining === 0) {
        await MenuItem.findByIdAndUpdate(recipe.menuItemId, { hasRecipe: false });
      }

      res.status(200).json({ success: true, message: 'Recipe deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
