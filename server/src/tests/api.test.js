import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { seedDatabase } from '../utils/seeder.js';

let authToken = '';
let restaurantId = '';
let branchId = '';
let karahiItemId = '';
let cashierToken = '';

beforeAll(async () => {
  await connectDB();
  await seedDatabase();
});

afterAll(async () => {
  await disconnectDB();
});

describe('1. Health Check Endpoint', () => {
  it('should return 200 OK and healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.product).toContain('Servora');
  });
});

describe('2. Authentication & RBAC', () => {
  it('should log in as Restaurant Owner Admin successfully', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@lahoregrill.pk',
        password: 'Admin@1234',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('admin');

    authToken = res.body.token;
    restaurantId = res.body.restaurant._id;
    branchId = res.body.branches[0]._id;
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@lahoregrill.pk',
        password: 'WrongPassword!',
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should log in as Cashier', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'cashier@lahoregrill.pk',
        password: 'Cashier@1234',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.role).toBe('cashier');
    cashierToken = res.body.token;
  });

  it('should return current authenticated user profile via /auth/me', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('admin@lahoregrill.pk');
  });
});

describe('3. Menu & Categories Management', () => {
  it('should fetch categories with item counts', async () => {
    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.categories.length).toBeGreaterThan(0);
  });

  it('should fetch menu items and find Mutton Karahi', async () => {
    const res = await request(app)
      .get('/api/menu-items')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);

    const karahi = res.body.items.find((i) => i.name.includes('Mutton Desi Ghee Karahi'));
    expect(karahi).toBeDefined();
    expect(karahi.basePrice).toBe(1950);
    karahiItemId = karahi._id;
  });

  it('should toggle item availability', async () => {
    const res = await request(app)
      .patch(`/api/menu-items/${karahiItemId}/toggle-availability`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.item.isAvailable).toBe(false);

    // Toggle back to true
    const res2 = await request(app)
      .patch(`/api/menu-items/${karahiItemId}/toggle-availability`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res2.statusCode).toBe(200);
    expect(res2.body.item.isAvailable).toBe(true);
  });
});

describe('4. POS Order Creation & Server Validation', () => {
  let createdOrderId = '';

  it('should create an order with accurate server-side tax and total calculation', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        branchId,
        orderType: 'takeaway',
        customerInfo: { name: 'Test Customer', phone: '0300-1112233' },
        items: [
          {
            menuItemId: karahiItemId,
            quantity: 2,
            variantName: 'Half (500g)',
          },
        ],
        discountType: 'percentage',
        discountValue: 10, // 10% discount on (1950 * 2 = 3900) -> 390 discount -> 3510 subtotal
        notes: 'Less spicy please',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    const order = res.body.order;

    expect(order.subtotal).toBe(3900);
    expect(order.discountAmount).toBe(390);
    // Tax at 16% on 3510 = 561.6
    expect(order.taxAmount).toBe(561.6);
    // Grand total = 3510 + 561.6 = 4071.6
    expect(order.grandTotal).toBe(4071.6);
    expect(order.status).toBe('placed');

    createdOrderId = order._id;
  });

  it('should reject invalid status transition (placed -> completed directly)', async () => {
    const res = await request(app)
      .patch(`/api/orders/${createdOrderId}/status`)
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        status: 'completed',
      });

    expect(res.statusCode).toBe(500); // Or 400 from transition validator
    expect(res.body.message).toContain('Invalid status transition');
  });

  it('should advance order through valid lifecycle: placed -> in_kitchen -> ready', async () => {
    const res1 = await request(app)
      .patch(`/api/orders/${createdOrderId}/status`)
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({ status: 'in_kitchen' });
    expect(res1.statusCode).toBe(200);
    expect(res1.body.order.status).toBe('in_kitchen');

    const res2 = await request(app)
      .patch(`/api/orders/${createdOrderId}/status`)
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({ status: 'ready' });
    expect(res2.statusCode).toBe(200);
    expect(res2.body.order.status).toBe('ready');
  });

  it('should process payment for the order idempotently', async () => {
    const idempotencyKey = `PAY_IDEMP_${Date.now()}`;
    const res = await request(app)
      .post('/api/payments/confirm')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        orderId: createdOrderId,
        paymentMethod: 'cash',
        amount: 4071.6,
        cashGiven: 5000,
        changeReturned: 928.4,
        idempotencyKey,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.payment.status).toBe('paid');
  });
});

describe('5. Real-Time Kitchen Display and Dashboard Reports', () => {
  it('should fetch active kitchen orders', async () => {
    const res = await request(app)
      .get('/api/kitchen/orders')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.orders)).toBe(true);
  });

  it('should fetch dashboard KPI statistics computed from DB', async () => {
    const res = await request(app)
      .get('/api/reports/dashboard')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.today.grossSales).toBeGreaterThan(0);
    expect(res.body.today.totalOrders).toBeGreaterThan(0);
    expect(Array.isArray(res.body.salesTrends)).toBe(true);
  });
});
