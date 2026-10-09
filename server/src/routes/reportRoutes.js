import express from 'express';
import { reportController } from '../controllers/reportController.js';
import { authenticate, authorize, requireTenant } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate, requireTenant);

router.get('/dashboard', reportController.getDashboardSummary);
router.get('/sales', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERADMIN), reportController.getSalesReport);
router.get('/inventory', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERADMIN), reportController.getInventoryReport);

// CSV Export endpoints
router.get('/export/sales.csv', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERADMIN), reportController.exportSalesCSV);
router.get('/export/inventory.csv', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERADMIN), reportController.exportInventoryCSV);
router.get('/export/expenses.csv', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERADMIN), reportController.exportExpensesCSV);

export default router;
