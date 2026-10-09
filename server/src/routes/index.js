import express from 'express';
import authRoutes from './authRoutes.js';
import restaurantRoutes from './restaurantRoutes.js';
import branchRoutes from './branchRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import menuItemRoutes from './menuItemRoutes.js';
import tableRoutes from './tableRoutes.js';
import reservationRoutes from './reservationRoutes.js';
import orderRoutes from './orderRoutes.js';
import kitchenRoutes from './kitchenRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';
import recipeRoutes from './recipeRoutes.js';
import supplierRoutes from './supplierRoutes.js';
import purchaseRoutes from './purchaseRoutes.js';
import expenseRoutes from './expenseRoutes.js';
import reportRoutes from './reportRoutes.js';
import staffRoutes from './staffRoutes.js';
import auditRoutes from './auditRoutes.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    product: 'Servora Restaurant Operations SaaS',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.use('/auth', authRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/branches', branchRoutes);
router.use('/categories', categoryRoutes);
router.use('/menu-items', menuItemRoutes);
router.use('/tables', tableRoutes);
router.use('/reservations', reservationRoutes);
router.use('/orders', orderRoutes);
router.use('/kitchen', kitchenRoutes);
router.use('/payments', paymentRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/recipes', recipeRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/expenses', expenseRoutes);
router.use('/reports', reportRoutes);
router.use('/staff', staffRoutes);
router.use('/audit', auditRoutes);

export default router;
