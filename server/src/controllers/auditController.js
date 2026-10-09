import { AuditLog } from '../models/AuditLog.js';

export const auditController = {
  async getAuditLogs(req, res, next) {
    try {
      const { page = 1, limit = 30 } = req.query;
      const query = { restaurantId: req.restaurantId };

      const skip = (Number(page) - 1) * Number(limit);
      const [logs, total] = await Promise.all([
        AuditLog.find(query)
          .populate('userId', 'name email role')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        AuditLog.countDocuments(query),
      ]);

      res.status(200).json({
        success: true,
        count: logs.length,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)) || 1,
        logs,
      });
    } catch (error) {
      next(error);
    }
  },
};
