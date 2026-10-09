import React, { useState, useEffect } from 'react';
import {
  Banknote,
  Globe,
  CreditCard,
  CheckCircle2,
  Printer,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import { Input } from '../common/Input.jsx';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';

export const PaymentModal = ({
  isOpen,
  onClose,
  orderData,
  currencySymbol = 'Rs.',
  onPaymentSuccess,
}) => {
  if (!orderData) return null;

  const toast = useToast();
  const [method, setMethod] = useState('cash'); // 'cash', 'safepay', 'card'
  const [cashGiven, setCashGiven] = useState(orderData.grandTotal);
  const [processing, setProcessing] = useState(false);
  const [completedPayment, setCompletedPayment] = useState(null);
  const [safepaySession, setSafepaySession] = useState(null);

  const grandTotal = orderData.grandTotal || 0;
  const changeReturned = Math.max(0, Number((Number(cashGiven || 0) - grandTotal).toFixed(2)));

  useEffect(() => {
    setCashGiven(grandTotal);
    setCompletedPayment(null);
    setSafepaySession(null);
  }, [grandTotal, isOpen]);

  // Handle Safepay Session Initiation
  const handleInitiateSafepay = async () => {
    setProcessing(true);
    try {
      const res = await api.post('/payments/initiate', {
        orderId: orderData._id,
        paymentMethod: 'safepay',
      });
      if (res.success) {
        setSafepaySession(res.session);
        toast.info('Safepay checkout tracker initialized.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to initiate Safepay session');
    } finally {
      setProcessing(false);
    }
  };

  // Settle Payment
  const handleSettlePayment = async () => {
    if (method === 'cash' && Number(cashGiven) < grandTotal) {
      toast.warning('Cash given cannot be less than the total amount due.');
      return;
    }

    setProcessing(true);
    try {
      const idempotencyKey = `PAY_${orderData._id}_${Date.now()}`;
      const payload = {
        orderId: orderData._id,
        paymentMethod: method,
        amount: grandTotal,
        cashGiven: method === 'cash' ? Number(cashGiven) : grandTotal,
        changeReturned: method === 'cash' ? changeReturned : 0,
        providerTrackerToken: safepaySession?.trackerToken || '',
        idempotencyKey,
      };

      const res = await api.post('/payments/confirm', payload);
      if (res.success) {
        toast.success(`Payment of ${currencySymbol} ${grandTotal.toLocaleString()} confirmed!`);
        setCompletedPayment(res.payment);
        if (onPaymentSuccess) {
          onPaymentSuccess(res.order, res.payment);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Payment confirmation failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={completedPayment ? 'Payment Successful' : `Settle Bill #${orderData.orderNumber}`}
      subtitle={`Total Amount Due: ${currencySymbol} ${grandTotal.toLocaleString()}`}
      maxWidth="max-w-md"
    >
      {completedPayment ? (
        <div className="space-y-5 text-center py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-xl font-bold font-heading text-forest-950">
              Payment Completed!
            </h3>
            <p className="text-xs text-charcoal-500 mt-1">
              Order #{orderData.orderNumber} is marked as PAID via {completedPayment.paymentMethod.toUpperCase()}.
            </p>
          </div>

          {completedPayment.paymentMethod === 'cash' && (
            <div className="p-4 rounded-2xl bg-ivory-100 border border-ivory-300 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-charcoal-600">
                <span>Amount Paid:</span>
                <span>{currencySymbol} {completedPayment.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-charcoal-600">
                <span>Cash Tendered:</span>
                <span>{currencySymbol} {completedPayment.cashGiven.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-forest-900 pt-1 border-t border-ivory-300">
                <span>Change Returned:</span>
                <span>{currencySymbol} {completedPayment.changeReturned.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button
              className="flex-1"
              variant="secondary"
              onClick={() => {
                window.print();
              }}
              icon={Printer}
            >
              Print Receipt
            </Button>
            <Button
              className="flex-1"
              onClick={onClose}
            >
              Done / New Order
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Method Selection Tabs */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setMethod('cash')}
              className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                method === 'cash'
                  ? 'border-forest-800 bg-forest-50 text-forest-950 font-bold shadow-xs'
                  : 'border-ivory-300 bg-white text-charcoal-700 hover:bg-ivory-100'
              }`}
            >
              <Banknote className="w-5 h-5 text-forest-800" />
              <span className="text-xs">Cash</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('safepay')}
              className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                method === 'safepay'
                  ? 'border-forest-800 bg-forest-50 text-forest-950 font-bold shadow-xs'
                  : 'border-ivory-300 bg-white text-charcoal-700 hover:bg-ivory-100'
              }`}
            >
              <Globe className="w-5 h-5 text-terracotta-600" />
              <span className="text-xs">Safepay Online</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('card')}
              className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                method === 'card'
                  ? 'border-forest-800 bg-forest-50 text-forest-950 font-bold shadow-xs'
                  : 'border-ivory-300 bg-white text-charcoal-700 hover:bg-ivory-100'
              }`}
            >
              <CreditCard className="w-5 h-5 text-forest-800" />
              <span className="text-xs">POS Terminal</span>
            </button>
          </div>

          {/* Cash Handling View */}
          {method === 'cash' && (
            <div className="space-y-4">
              <Input
                label="Cash Received from Customer"
                type="number"
                value={cashGiven}
                onChange={(e) => setCashGiven(e.target.value)}
                autoFocus
              />

              {/* Quick Cash Presets */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCashGiven(grandTotal)}
                  className="px-3 py-1.5 rounded-lg border border-ivory-300 bg-ivory-100 hover:bg-ivory-200 text-xs font-bold"
                >
                  Exact ({currencySymbol} {grandTotal})
                </button>
                {[500, 1000, 2000, 5000].map((amt) => {
                  if (amt < grandTotal) return null;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashGiven(amt)}
                      className="px-3 py-1.5 rounded-lg border border-ivory-300 bg-ivory-100 hover:bg-ivory-200 text-xs font-bold font-mono"
                    >
                      {currencySymbol} {amt}
                    </button>
                  );
                })}
              </div>

              {/* Change Box */}
              <div className="p-3.5 rounded-xl bg-forest-50 border border-forest-200 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-forest-800 uppercase tracking-wider">
                    Change to Return
                  </div>
                  <div className="text-xl font-bold font-mono text-forest-950">
                    {currencySymbol} {changeReturned.toLocaleString()}
                  </div>
                </div>
                <Banknote className="w-8 h-8 text-forest-700 opacity-60" />
              </div>
            </div>
          )}

          {/* Safepay Gateway View */}
          {method === 'safepay' && (
            <div className="p-4 rounded-xl bg-ivory-100 border border-ivory-300 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-forest-950 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Safepay Pakistan Hosted Checkout</span>
              </div>
              <p className="text-charcoal-600 leading-relaxed">
                Accepts Pakistani Debit/Credit Cards, Raast QR, and JazzCash/Easypaisa via Safepay's secure PCI-DSS sandbox environment.
              </p>

              {!safepaySession ? (
                <Button
                  size="sm"
                  variant="terracotta"
                  onClick={handleInitiateSafepay}
                  loading={processing}
                  className="w-full"
                >
                  Initialize Safepay Session
                </Button>
              ) : (
                <div className="space-y-2 p-2.5 rounded-lg bg-white border border-ivory-300 font-mono text-[11px]">
                  <div className="text-charcoal-500">Tracker: {safepaySession.trackerToken}</div>
                  <div className="text-emerald-700 font-bold">Sandbox Ready (Simulated Verification)</div>
                </div>
              )}
            </div>
          )}

          {/* Settle Action Button */}
          <div className="pt-2">
            <Button
              className="w-full font-bold shadow-md"
              size="lg"
              onClick={handleSettlePayment}
              loading={processing}
            >
              Complete Payment ({currencySymbol} {grandTotal.toLocaleString()})
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
