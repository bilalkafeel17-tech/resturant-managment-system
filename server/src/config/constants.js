/**
 * Servora Domain Constants & Enumerations
 */

export const ROLES = {
  SUPERADMIN: 'superadmin',       // Platform Administrator
  ADMIN: 'admin',                 // Restaurant Owner / Administrator
  MANAGER: 'manager',             // Branch / General Manager
  CASHIER: 'cashier',             // Front Desk / POS Cashier
  KITCHEN: 'kitchen',             // Kitchen Display Staff
};

export const ROLE_HIERARCHY = {
  [ROLES.SUPERADMIN]: 100,
  [ROLES.ADMIN]: 80,
  [ROLES.MANAGER]: 60,
  [ROLES.CASHIER]: 40,
  [ROLES.KITCHEN]: 20,
};

export const ORDER_TYPES = {
  DINE_IN: 'dine_in',
  TAKEAWAY: 'takeaway',
  DELIVERY: 'delivery',
};

export const ORDER_STATUS = {
  DRAFT: 'draft',
  PLACED: 'placed',
  IN_KITCHEN: 'in_kitchen',
  READY: 'ready',
  SERVED: 'served',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Permitted Order Status Transitions
export const VALID_ORDER_TRANSITIONS = {
  [ORDER_STATUS.DRAFT]: [ORDER_STATUS.PLACED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PLACED]: [ORDER_STATUS.IN_KITCHEN, ORDER_STATUS.READY, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.IN_KITCHEN]: [ORDER_STATUS.READY, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.READY]: [ORDER_STATUS.SERVED, ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SERVED]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.COMPLETED]: [], // Terminal state
  [ORDER_STATUS.CANCELLED]: [], // Terminal state
};

export const ITEM_STATUS = {
  PENDING: 'pending',
  COOKING: 'cooking',
  READY: 'ready',
  SERVED: 'served',
  CANCELLED: 'cancelled',
};

export const PAYMENT_STATUS = {
  UNPAID: 'unpaid',
  PARTIALLY_PAID: 'partially_paid',
  PAID: 'paid',
  REFUNDED: 'refunded',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

export const PAYMENT_METHODS = {
  CASH: 'cash',
  SAFEPAY: 'safepay',
  CARD: 'card',
  BANK_TRANSFER: 'bank_transfer',
};

export const TABLE_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
  CLEANING: 'cleaning',
};

export const RESERVATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  SEATED: 'seated',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show',
};

export const INVENTORY_UNITS = {
  KG: 'kg',
  G: 'g',
  LTR: 'ltr',
  ML: 'ml',
  PCS: 'pcs',
  PACK: 'pack',
  PORTION: 'portion',
};

export const STOCK_MOVEMENT_TYPES = {
  PURCHASE: 'purchase',
  ORDER_CONSUMPTION: 'order_consumption',
  WASTE: 'waste',
  MANUAL_ADJUSTMENT: 'manual_adjustment',
  RETURN: 'return',
  CANCELLATION_RESTOCK: 'cancellation_restock',
};

export const EXPENSE_CATEGORIES = {
  UTILITIES: 'utilities',
  RENT: 'rent',
  SUPPLIES: 'supplies',
  MAINTENANCE: 'maintenance',
  SALARIES: 'salaries',
  MARKETING: 'marketing',
  INVENTORY_PURCHASE: 'inventory_purchase',
  OTHER: 'other',
};

export const RESTAURANT_TYPES = {
  CASUAL_DINING: 'casual_dining',
  CAFE: 'cafe',
  FAST_FOOD: 'fast_food',
  FINE_DINING: 'fine_dining',
  TAKEAWAY: 'takeaway',
  DELIVERY_ONLY: 'delivery_only',
};
