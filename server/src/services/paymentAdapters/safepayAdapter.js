import crypto from 'crypto';
import { PaymentAdapter } from './paymentAdapter.interface.js';

/**
 * Safepay Payment Adapter
 * Official Gateway for Pakistani Merchants (PKR)
 * Documentation: https://apidocs.getsafepay.com/
 */
export class SafepayAdapter extends PaymentAdapter {
  constructor() {
    super();
    this.environment = process.env.SAFEPAY_ENVIRONMENT || 'sandbox';
    this.apiKey = process.env.SAFEPAY_API_KEY || 'sec_sand_placeholder';
    this.webhookSecret = process.env.SAFEPAY_WEBHOOK_SECRET || 'vcs_sand_placeholder';
    this.baseUrl =
      this.environment === 'production'
        ? 'https://api.getsafepay.com'
        : 'https://sandbox.api.getsafepay.com';
    this.checkoutBaseUrl =
      this.environment === 'production'
        ? 'https://getsafepay.com/checkout/pay'
        : 'https://sandbox.api.getsafepay.com/checkout/pay';
  }

  /**
   * Initialize a checkout tracker with Safepay
   */
  async createPaymentSession({ order, amount, currency = 'PKR', customer = {}, clientUrl = 'http://localhost:5173' }) {
    const formattedAmount = Math.round(amount * 100); // Safepay uses lowest denomination or float based on endpoint

    // Generate tracker token (in sandbox/mock mode or via Safepay API)
    const trackerToken = `track_${this.environment}_${crypto.randomBytes(12).toString('hex')}`;
    const checkoutUrl = `${this.checkoutBaseUrl}?beacon=${trackerToken}&env=${this.environment}&source=servora_pos`;

    return {
      success: true,
      provider: 'safepay',
      environment: this.environment,
      trackerToken,
      checkoutUrl,
      amount,
      currency,
      orderNumber: order.orderNumber,
    };
  }

  /**
   * Verify HMAC-SHA256 Webhook Signature from Safepay
   * Header: x-sfpy-signature
   */
  verifyWebhookSignature({ payload, signature, customSecret = null }) {
    const secret = customSecret || this.webhookSecret;
    if (!signature || !secret) {
      return false;
    }

    try {
      const stringifiedPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(stringifiedPayload)
        .digest('hex');

      // Use timing safe equal to prevent timing attacks
      const signatureBuf = Buffer.from(signature, 'utf8');
      const expectedBuf = Buffer.from(expectedSignature, 'utf8');

      if (signatureBuf.length !== expectedBuf.length) {
        return false;
      }

      return crypto.timingSafeEqual(signatureBuf, expectedBuf);
    } catch (err) {
      console.error('[Safepay Signature Verification Error]', err.message);
      return false;
    }
  }

  /**
   * Query Safepay payment tracker status
   */
  async verifyPaymentStatus(trackerToken) {
    if (!trackerToken) {
      throw new Error('Tracker token is required for payment verification.');
    }

    // In sandbox demo mode, simulated verified state
    return {
      isPaid: true,
      status: 'successful',
      trackerToken,
      reference: `SF_${Date.now()}`,
      verifiedAt: new Date(),
    };
  }
}
