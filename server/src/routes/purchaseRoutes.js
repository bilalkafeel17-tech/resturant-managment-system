import express from 'express';
import { purchaseController } from '../controllers/purchaseController.js';
import { authenticate, authorize, requireTenant } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate, requireTenant);

router.get('/', purchaseController.getPurchases);
router.post('/', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERADMIN), purchaseController.createPurchase);
router.post('/:id/receive', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERADMIN), purchaseController.receivePurchase);

export default router;
