import React, { useState } from 'react';
import {
  Trash2,
  Minus,
  Plus,
  Tag,
  Receipt,
  User,
  Phone,
  Armchair,
  ShoppingBag,
  Bike,
  Utensils,
  CreditCard,
  Send,
} from 'lucide-react';
import { Button } from '../common/Button.jsx';
import { Modal } from '../common/Modal.jsx';
import { Input } from '../common/Input.jsx';

export const CartDrawer = ({
  cart,
  tables,
  orderType,
  setOrderType,
  selectedTableId,
  setSelectedTableId,
  customerInfo,
  setCustomerInfo,
  discount,
  setDiscount,
  notes,
  setNotes,
  currencySymbol = 'Rs.',
  taxRate = 16,
  serviceChargeRate = 5,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  loading = false,
}) => {
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [tempDiscountType, setTempDiscountType] = useState(discount.type);
  const [tempDiscountValue, setTempDiscountValue] = useState(discount.value);

  // Financial Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  let discountAmount = 0;
  if (discount.type === 'percentage' && discount.value > 0) {
    discountAmount = Number(((subtotal * Math.min(100, discount.value)) / 100).toFixed(2));
  } else if (discount.type === 'fixed' && discount.value > 0) {
    discountAmount = Number(Math.min(subtotal, discount.value).toFixed(2));
  }

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const taxAmount = Number(((discountedSubtotal * taxRate) / 100).toFixed(2));
  const serviceChargeAmount =
    orderType === 'dine_in' && serviceChargeRate > 0
      ? Number(((discountedSubtotal * serviceChargeRate) / 100).toFixed(2))
      : 0;
  const grandTotal = Number((discountedSubtotal + taxAmount + serviceChargeAmount).toFixed(2));

  const applyDiscount = () => {
    setDiscount({
      type: tempDiscountType,
      value: Number(tempDiscountValue) || 0,
    });
    setDiscountModalOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-ivory-300 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header / Order Type Toggle */}
      <div className="p-4 border-b border-ivory-200 bg-ivory-50/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold font-heading text-forest-950 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-forest-800" />
            <span>Active Cart ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
          </h3>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={onClearCart}
              className="text-[11px] font-semibold text-rose-700 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

        {/* Order Type Pills */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-ivory-200/70 rounded-xl border border-ivory-300 text-xs">
          <button
            type="button"
            onClick={() => setOrderType('dine_in')}
            className={`py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
              orderType === 'dine_in'
                ? 'bg-forest-900 text-white shadow-xs'
                : 'text-charcoal-700 hover:text-forest-900'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Dine-In</span>
          </button>

          <button
            type="button"
            onClick={() => setOrderType('takeaway')}
            className={`py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
              orderType === 'takeaway'
                ? 'bg-forest-900 text-white shadow-xs'
                : 'text-charcoal-700 hover:text-forest-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Takeaway</span>
          </button>

          <button
            type="button"
            onClick={() => setOrderType('delivery')}
            className={`py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
              orderType === 'delivery'
                ? 'bg-forest-900 text-white shadow-xs'
                : 'text-charcoal-700 hover:text-forest-900'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Delivery</span>
          </button>
        </div>

        {/* Dine-in Table Selection */}
        {orderType === 'dine_in' && (
          <div className="mt-3">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-600 mb-1">
              Assign Table
            </label>
            <select
              value={selectedTableId || ''}
              onChange={(e) => setSelectedTableId(e.target.value || null)}
              className="w-full text-xs font-semibold rounded-xl border border-ivory-400 bg-white px-3 py-2 text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-100"
            >
              <option value="">Select Dining Table...</option>
              {tables.map((t) => (
                <option key={t._id} value={t._id}>
                  Table {t.tableNumber} — {t.section} ({t.capacity} Seats) [
                  {t.status.toUpperCase()}]
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Customer Info (Name / Phone) */}
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Guest Name"
            value={customerInfo.name}
            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
            className="w-full text-xs rounded-xl border border-ivory-300 bg-white px-2.5 py-1.5 text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-600"
          />
          <input
            type="text"
            placeholder="Phone #"
            value={customerInfo.phone}
            onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
            className="w-full text-xs rounded-xl border border-ivory-300 bg-white px-2.5 py-1.5 text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-600"
          />
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-charcoal-400">
            <ShoppingBag className="w-10 h-10 opacity-30 mb-2 text-forest-900" />
            <div className="text-xs font-bold text-charcoal-700">Order is currently empty</div>
            <div className="text-[11px] text-charcoal-500 mt-0.5">
              Click menu items on the left to begin building order.
            </div>
          </div>
        ) : (
          cart.map((cartItem, idx) => (
            <div
              key={`${cartItem.item._id}-${idx}`}
              className="p-2.5 rounded-xl border border-ivory-300 bg-ivory-50/40 space-y-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-forest-950 truncate">
                    {cartItem.item.name}
                  </div>
                  {cartItem.variant && (
                    <div className="text-[10px] text-terracotta-600 font-semibold">
                      {cartItem.variant.name}
                    </div>
                  )}
                  {cartItem.addOns && cartItem.addOns.length > 0 && (
                    <div className="text-[10px] text-charcoal-500">
                      + {cartItem.addOns.map((a) => a.name).join(', ')}
                    </div>
                  )}
                  {cartItem.notes && (
                    <div className="text-[10px] italic text-charcoal-400">
                      Note: "{cartItem.notes}"
                    </div>
                  )}
                </div>

                <div className="text-right font-mono font-bold text-xs text-forest-950">
                  {currencySymbol} {(cartItem.unitPrice * cartItem.quantity).toLocaleString()}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-ivory-200">
                <span className="text-[11px] text-charcoal-500 font-mono">
                  {currencySymbol} {cartItem.unitPrice} each
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(idx, cartItem.quantity - 1)}
                    className="w-6 h-6 rounded-lg bg-white border border-ivory-300 flex items-center justify-center text-charcoal-700 hover:bg-ivory-100"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center text-xs font-bold font-mono">
                    {cartItem.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(idx, cartItem.quantity + 1)}
                    className="w-6 h-6 rounded-lg bg-white border border-ivory-300 flex items-center justify-center text-charcoal-700 hover:bg-ivory-100"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(idx)}
                    className="p-1 text-rose-600 hover:text-rose-800 ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bill Breakdown & Actions Footer */}
      <div className="p-4 border-t border-ivory-300 bg-ivory-50/80 space-y-2 text-xs">
        <div className="space-y-1 text-charcoal-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-mono font-semibold">
              {currencySymbol} {subtotal.toLocaleString()}
            </span>
          </div>

          {/* Discount Trigger */}
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setDiscountModalOpen(true)}
              className="text-terracotta-600 font-bold flex items-center gap-1 hover:underline text-[11px]"
            >
              <Tag className="w-3 h-3" />
              <span>
                Discount {discount.value > 0 ? `(${discount.value}${discount.type === 'percentage' ? '%' : ' ' + currencySymbol})` : ''}
              </span>
            </button>
            <span className="font-mono text-terracotta-600 font-semibold">
              -{currencySymbol} {discountAmount.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Tax ({taxRate}% PRA GST)</span>
            <span className="font-mono font-semibold">
              +{currencySymbol} {taxAmount.toLocaleString()}
            </span>
          </div>

          {serviceChargeAmount > 0 && (
            <div className="flex justify-between">
              <span>Service Charge ({serviceChargeRate}%)</span>
              <span className="font-mono font-semibold">
                +{currencySymbol} {serviceChargeAmount.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Grand Total */}
        <div className="pt-2 border-t border-ivory-300 flex justify-between items-baseline">
          <span className="text-sm font-extrabold font-heading text-forest-950">Grand Total</span>
          <span className="text-lg font-bold font-mono text-forest-950">
            {currencySymbol} {grandTotal.toLocaleString()}
          </span>
        </div>

        {/* Checkout Button */}
        <div className="pt-2">
          <Button
            size="lg"
            className="w-full font-bold shadow-md"
            disabled={cart.length === 0 || loading}
            loading={loading}
            onClick={() => onCheckout({ grandTotal, subtotal, taxAmount, discountAmount, serviceChargeAmount })}
            icon={CreditCard}
          >
            Charge & Settle ({currencySymbol} {grandTotal.toLocaleString()})
          </Button>
        </div>
      </div>

      {/* Discount Configuration Modal */}
      <Modal
        isOpen={discountModalOpen}
        onClose={() => setDiscountModalOpen(false)}
        title="Apply Bill Discount"
        subtitle="Authorize fixed amount or percentage markdown"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDiscountModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyDiscount}>Apply Discount</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTempDiscountType('percentage')}
              className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                tempDiscountType === 'percentage'
                  ? 'border-forest-800 bg-forest-50 text-forest-900'
                  : 'border-ivory-300 bg-white text-charcoal-700'
              }`}
            >
              Percentage (%)
            </button>
            <button
              type="button"
              onClick={() => setTempDiscountType('fixed')}
              className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                tempDiscountType === 'fixed'
                  ? 'border-forest-800 bg-forest-50 text-forest-900'
                  : 'border-ivory-300 bg-white text-charcoal-700'
              }`}
            >
              Fixed Amount ({currencySymbol})
            </button>
          </div>

          <Input
            label="Discount Value"
            type="number"
            min="0"
            max={tempDiscountType === 'percentage' ? '100' : subtotal}
            value={tempDiscountValue}
            onChange={(e) => setTempDiscountValue(e.target.value)}
          />

          {/* Quick presets */}
          {tempDiscountType === 'percentage' && (
            <div className="flex gap-2">
              {[5, 10, 15, 20].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTempDiscountValue(p)}
                  className="flex-1 py-1.5 rounded-lg border border-ivory-300 bg-ivory-100 hover:bg-ivory-200 text-xs font-bold font-mono"
                >
                  {p}%
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
