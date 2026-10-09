import express from 'express';
import { recipeController } from '../controllers/recipeController.js';
import { authenticate, authorize, requireTenant } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate, requireTenant);

router.get('/', recipeController.getRecipes);
router.get('/menu-item/:menuItemId', recipeController.getRecipeByMenuItem);
router.post('/', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERADMIN), recipeController.saveRecipe);
router.delete('/:id', authorize(ROLES.ADMIN, ROLES.SUPERADMIN), recipeController.deleteRecipe);

export default router;
