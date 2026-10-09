import express from 'express';
import { orderController } from '../controllers/orderController.js';
import { authenticate, authorize, requireTenant } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate, requireTenant);

router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.post('/', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER, ROLES.SUPERADMIN), orderController.createOrder);
router.patch('/:id/status', orderController.updateOrderStatus);
router.post('/:id/cancel', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERADMIN), orderController.cancelOrder);

export default router;
