import { SafepayAdapter } from './safepayAdapter.js';
import { CashAdapter } from './cashAdapter.js';
import { PAYMENT_METHODS } from '../../config/constants.js';

const adapters = {
  [PAYMENT_METHODS.SAFEPAY]: new SafepayAdapter(),
  [PAYMENT_METHODS.CASH]: new CashAdapter(),
  [PAYMENT_METHODS.CARD]: new CashAdapter(), // In-store POS Card machine adapter
  [PAYMENT_METHODS.BANK_TRANSFER]: new CashAdapter(),
};

/**
 * Factory to get appropriate payment gateway adapter
 */
export const getPaymentAdapter = (method = PAYMENT_METHODS.CASH) => {
  const adapter = adapters[method.toLowerCase()];
  if (!adapter) {
    throw new Error(`Unsupported payment method: '${method}'. Supported methods: [${Object.keys(adapters).join(', ')}]`);
  }
  return adapter;
};
