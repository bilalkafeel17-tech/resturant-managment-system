import express from 'express';
import { inventoryController } from '../controllers/inventoryController.js';
import { authenticate, authorize, requireTenant } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate, requireTenant);

router.get('/ingredients', inventoryController.getIngredients);
router.post('/ingredients', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERADMIN), inventoryController.createIngredient);
router.put('/ingredients/:id', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERADMIN), inventoryController.updateIngredient);
router.post('/ingredients/:id/adjust', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERADMIN), inventoryController.adjustStock);
router.get('/movements', inventoryController.getMovements);

export default router;
