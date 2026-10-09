import express from 'express';
import { expenseController } from '../controllers/expenseController.js';
import { authenticate, authorize, requireTenant } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate, requireTenant);

router.get('/', expenseController.getExpenses);
router.post('/', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERADMIN), expenseController.createExpense);
router.delete('/:id', authorize(ROLES.ADMIN, ROLES.SUPERADMIN), expenseController.deleteExpense);

export default router;
