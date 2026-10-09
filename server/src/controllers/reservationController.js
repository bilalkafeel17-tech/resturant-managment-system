import { Reservation } from '../models/Reservation.js';
import { Table } from '../models/Table.js';
import { RESERVATION_STATUS, TABLE_STATUS } from '../config/constants.js';

export const reservationController = {
  async getReservations(req, res, next) {
    try {
      const { branchId, date, status } = req.query;
      const targetBranchId = branchId || req.branchId;

      const query = {
        restaurantId: req.restaurantId,
      };

      if (targetBranchId) {
        query.branchId = targetBranchId;
      }

      if (status) {
        query.status = status;
      }

      if (date) {
        const target = new Date(date);
        const start = new Date(target.getFullYear(), target.getMonth(), target.getDate());
        const end = new Date(target.getFullYear(), target.getMonth(), target.getDate(), 23, 59, 59, 999);
        query.reservationTime = { $gte: start, $lte: end };
      }

      const reservations = await Reservation.find(query)
        .populate('tableId', 'tableNumber capacity section')
        .populate('branchId', 'name code')
        .sort({ reservationTime: 1 });

      res.status(200).json({ success: true, count: reservations.length, reservations });
    } catch (error) {
      next(error);
    }
  },

  async createReservation(req, res, next) {
    try {
      const {
        customerName,
        customerPhone,
        customerEmail = '',
        partySize = 2,
        reservationTime,
        durationMinutes = 90,
        tableId = null,
        branchId,
        specialRequests = '',
        notes = '',
      } = req.body;

      const targetBranchId = branchId || req.branchId;
      if (!customerName || !customerPhone || !reservationTime || !targetBranchId) {
        return res.status(400).json({
          success: false,
          message: 'Customer name, phone, reservation time, and branch are required.',
        });
      }

      const resTime = new Date(reservationTime);
      if (isNaN(resTime.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid reservation date/time.' });
      }

      // Check table conflict if table is assigned
      if (tableId) {
        const duration = Number(durationMinutes) || 90;
        const endTime = new Date(resTime.getTime() + duration * 60000);
        const startTime = new Date(resTime.getTime() - duration * 60000);

        const conflicting = await Reservation.findOne({
          restaurantId: req.restaurantId,
          tableId,
          status: { $in: [RESERVATION_STATUS.PENDING, RESERVATION_STATUS.CONFIRMED, RESERVATION_STATUS.SEATED] },
          reservationTime: { $gte: startTime, $lte: endTime },
        });

        if (conflicting) {
          return res.status(409).json({
            success: false,
            message: 'This table is already reserved or occupied during the requested time window.',
          });
        }
      }

      const reservation = await Reservation.create({
        restaurantId: req.restaurantId,
        branchId: targetBranchId,
        tableId: tableId || null,
        customerName,
        customerPhone,
        customerEmail,
        partySize: Number(partySize),
        reservationTime: resTime,
        durationMinutes: Number(durationMinutes) || 90,
        specialRequests,
        notes,
        status: RESERVATION_STATUS.CONFIRMED,
      });

      res.status(201).json({
        success: true,
        message: 'Reservation booked successfully!',
        reservation,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateReservationStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!Object.values(RESERVATION_STATUS).includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid reservation status.' });
      }

      const reservation = await Reservation.findOne({ _id: id, restaurantId: req.restaurantId });
      if (!reservation) {
        return res.status(404).json({ success: false, message: 'Reservation not found' });
      }

      reservation.status = status;
      await reservation.save();

      // If seated, mark table as reserved/occupied
      if (status === RESERVATION_STATUS.SEATED && reservation.tableId) {
        await Table.findByIdAndUpdate(reservation.tableId, { status: TABLE_STATUS.OCCUPIED });
      }

      res.status(200).json({
        success: true,
        message: `Reservation status updated to ${status}`,
        reservation,
      });
    } catch (error) {
      next(error);
    }
  },
};
