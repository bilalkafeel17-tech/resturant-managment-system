import express from 'express';
import { reservationController } from '../controllers/reservationController.js';
import { authenticate, requireTenant } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate, requireTenant);

router.get('/', reservationController.getReservations);
router.post('/', reservationController.createReservation);
router.patch('/:id/status', reservationController.updateReservationStatus);

export default router;
