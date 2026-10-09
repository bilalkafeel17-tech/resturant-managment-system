import express from 'express';
import { kitchenController } from '../controllers/kitchenController.js';
import { authenticate, requireTenant } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate, requireTenant);

router.get('/orders', kitchenController.getActiveKitchenOrders);
router.patch('/orders/:orderId/items/:itemId', kitchenController.updateItemStatus);

export default router;
