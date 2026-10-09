import express from 'express';
import { staffController } from '../controllers/staffController.js';
import { authenticate, authorize, requireTenant } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate, requireTenant);

router.get('/', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERADMIN), staffController.getStaff);
router.post('/', authorize(ROLES.ADMIN, ROLES.SUPERADMIN), staffController.createStaff);
router.put('/:id', authorize(ROLES.ADMIN, ROLES.SUPERADMIN), staffController.updateStaff);

export default router;
