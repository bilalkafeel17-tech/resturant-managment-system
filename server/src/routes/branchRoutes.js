import express from 'express';
import { branchController } from '../controllers/branchController.js';
import { authenticate, authorize, requireTenant } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate, requireTenant);

router.get('/', branchController.getBranches);
router.post('/', authorize(ROLES.ADMIN, ROLES.SUPERADMIN), branchController.createBranch);
router.put('/:id', authorize(ROLES.ADMIN, ROLES.SUPERADMIN), branchController.updateBranch);

export default router;
