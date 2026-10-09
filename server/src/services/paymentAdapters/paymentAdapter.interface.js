/**
 * Payment Adapter Interface Definition
 * All payment gateway implementations must adhere to this interface
 */
export class PaymentAdapter {
  /**
   * Initialize payment session with the provider
   * @param {Object} params { order, amount, currency, customer, returnUrl, cancelUrl }
   * @returns {Promise<Object>} { trackerToken, checkoutUrl, providerData }
   */
  async createPaymentSession(params) {
    throw new Error('createPaymentSession() must be implemented by payment adapter.');
  }

  /**
   * Verify webhook notification authenticity using HMAC or provider signature
   * @param {Object} params { rawBody, signature, secret }
   * @returns {Boolean}
   */
  verifyWebhookSignature(params) {
    throw new Error('verifyWebhookSignature() must be implemented by payment adapter.');
  }

  /**
   * Verify payment status directly with provider
   * @param {String} trackerToken
   * @returns {Promise<Object>} { isPaid, status, transactionReference, amount, currency }
   */
  async verifyPaymentStatus(trackerToken) {
    throw new Error('verifyPaymentStatus() must be implemented by payment adapter.');
  }
}
