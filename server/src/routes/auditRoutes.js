import express from 'express';
import { auditController } from '../controllers/auditController.js';
import { authenticate, authorize, requireTenant } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate, requireTenant, authorize(ROLES.ADMIN, ROLES.SUPERADMIN));

router.get('/', auditController.getAuditLogs);

export default router;
