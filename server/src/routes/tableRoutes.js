import express from 'express';
import { tableController } from '../controllers/tableController.js';
import { authenticate, authorize, requireTenant } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate, requireTenant);

router.get('/', tableController.getTables);
router.post('/', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERADMIN), tableController.createTable);
router.put('/:id', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERADMIN), tableController.updateTable);
router.patch('/:id/status', tableController.updateTableStatus);
router.delete('/:id', authorize(ROLES.ADMIN, ROLES.SUPERADMIN), tableController.deleteTable);

export default router;
