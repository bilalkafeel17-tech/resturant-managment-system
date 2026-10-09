import express from 'express';
import { restaurantController } from '../controllers/restaurantController.js';
import { authenticate, authorize, requireTenant } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate);

router.get('/settings', requireTenant, restaurantController.getRestaurantSettings);
router.put('/settings', requireTenant, authorize(ROLES.ADMIN, ROLES.SUPERADMIN), restaurantController.updateRestaurantSettings);
router.get('/all', authorize(ROLES.SUPERADMIN), restaurantController.getAllRestaurants);

export default router;
