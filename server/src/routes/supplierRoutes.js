import express from 'express';
import { supplierController } from '../controllers/supplierController.js';
import { authenticate, authorize, requireTenant } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate, requireTenant);

router.get('/', supplierController.getSuppliers);
router.post('/', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERADMIN), supplierController.createSupplier);
router.put('/:id', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERADMIN), supplierController.updateSupplier);

export default router;
