import express from 'express';
import { categoryController } from '../controllers/categoryController.js';
import { authenticate, authorize, requireTenant } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate, requireTenant);

router.get('/', categoryController.getCategories);
router.post('/', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERADMIN), categoryController.createCategory);
router.put('/:id', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERADMIN), categoryController.updateCategory);
router.delete('/:id', authorize(ROLES.ADMIN, ROLES.SUPERADMIN), categoryController.deleteCategory);

export default router;
