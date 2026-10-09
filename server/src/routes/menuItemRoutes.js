import express from 'express';
import { menuItemController } from '../controllers/menuItemController.js';
import { authenticate, authorize, requireTenant } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate, requireTenant);

router.get('/', menuItemController.getMenuItems);
router.get('/:id', menuItemController.getMenuItemById);
router.post('/', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERADMIN), menuItemController.createMenuItem);
router.put('/:id', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERADMIN), menuItemController.updateMenuItem);
router.patch('/:id/toggle-availability', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER, ROLES.SUPERADMIN), menuItemController.toggleAvailability);
router.delete('/:id', authorize(ROLES.ADMIN, ROLES.SUPERADMIN), menuItemController.deleteMenuItem);

export default router;
