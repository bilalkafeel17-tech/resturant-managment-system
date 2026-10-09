import { PaymentAdapter } from './paymentAdapter.interface.js';

/**
 * Cash Payment Adapter for Register Checkout
 */
export class CashAdapter extends PaymentAdapter {
  async createPaymentSession({ order, amount, cashGiven = 0 }) {
    const parsedCashGiven = Number(cashGiven) || amount;
    const changeReturned = Math.max(0, Number((parsedCashGiven - amount).toFixed(2)));

    return {
      success: true,
      provider: 'cash',
      status: 'successful',
      amount,
      cashGiven: parsedCashGiven,
      changeReturned,
      transactionReference: `CASH_${Date.now()}`,
    };
  }

  verifyWebhookSignature() {
    return true; // Cash transactions do not have webhooks
  }

  async verifyPaymentStatus() {
    return { isPaid: true, status: 'successful' };
  }
}
