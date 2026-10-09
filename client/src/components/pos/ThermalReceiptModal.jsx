import React from 'react';
import { Printer, X } from 'lucide-react';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export const ThermalReceiptModal = ({ isOpen, onClose, order, payment }) => {
  const { restaurant, activeBranch } = useAuth();

  if (!order) return null;

  const currencySymbol = restaurant?.currencySymbol || 'Rs.';
  const receiptSettings = restaurant?.receiptSettings || {};

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thermal Receipt Preview"
      subtitle="Standard 80mm POS Thermal Layout"
      maxWidth="max-w-sm"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handlePrint} icon={Printer}>
            Print Receipt
          </Button>
        </div>
      }
    >
      {/* 80mm Printable Receipt Container */}
      <div
        id="printable-receipt"
        className="bg-white text-black p-4 rounded-xl border border-dashed border-charcoal-400 font-mono text-[11px] leading-tight space-y-3 shadow-inner"
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <h2 className="text-base font-extrabold uppercase tracking-wider font-heading">
            {restaurant?.name || 'SERVORA RESTAURANT'}
          </h2>
          <div className="text-[10px]">{activeBranch?.name}</div>
          <div className="text-[10px]">{activeBranch?.address}</div>
          <div className="text-[10px]">Tel: {activeBranch?.phone}</div>
          {receiptSettings.showTaxNumber && restaurant?.taxNumber && (
            <div className="text-[10px] font-bold">NTN / GST #: {restaurant.taxNumber}</div>
          )}
        </div>

        {/* Order Details */}
        <div className="border-t border-b border-dashed border-charcoal-800 py-2 space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span>Order #: <strong>{order.orderNumber}</strong></span>
            <span className="capitalize">[{order.orderType?.replace('_', ' ')}]</span>
          </div>
          <div className="flex justify-between">
            <span>Date: {new Date(order.createdAt || Date.now()).toLocaleDateString()}</span>
            <span>Time: {new Date(order.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {order.tableNameSnapshot && (
            <div>Table: <strong>{order.tableNameSnapshot}</strong></div>
          )}
          {order.customerInfo?.name && (
            <div>Guest: {order.customerInfo.name}</div>
          )}
        </div>

        {/* Itemized Table */}
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-charcoal-800 text-[10px]">
              <th className="py-1">Item</th>
              <th className="text-center py-1">Qty</th>
              <th className="text-right py-1">Price</th>
              <th className="text-right py-1">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dotted divide-charcoal-300">
            {order.items?.map((item, idx) => (
              <tr key={idx}>
                <td className="py-1 max-w-[130px] pr-1">
                  <div className="font-bold">{item.nameSnapshot}</div>
                  {item.variantSnapshot?.name && (
                    <div className="text-[9px] text-charcoal-600">{item.variantSnapshot.name}</div>
                  )}
                  {item.addOnsSnapshot?.map((a, i) => (
                    <div key={i} className="text-[9px] text-charcoal-600">+ {a.name}</div>
                  ))}
                </td>
                <td className="py-1 text-center font-bold align-top">{item.quantity}</td>
                <td className="py-1 text-right align-top">{item.unitPriceSnapshot}</td>
                <td className="py-1 text-right font-bold align-top">{item.itemSubtotal}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Financial Summary */}
        <div className="border-t border-charcoal-800 pt-2 space-y-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{currencySymbol} {order.subtotal?.toLocaleString()}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between">
              <span>Discount ({order.discountValue}{order.discountType === 'percentage' ? '%' : ''}):</span>
              <span>-{currencySymbol} {order.discountAmount?.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>PRA GST ({order.taxRateSnapshot}%):</span>
            <span>+{currencySymbol} {order.taxAmount?.toLocaleString()}</span>
          </div>
          {order.serviceChargeAmount > 0 && (
            <div className="flex justify-between">
              <span>Service Charge ({order.serviceChargeRateSnapshot}%):</span>
              <span>+{currencySymbol} {order.serviceChargeAmount?.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold border-t border-b border-dashed border-charcoal-800 py-1 my-1">
            <span>GRAND TOTAL:</span>
            <span>{currencySymbol} {order.grandTotal?.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment Details */}
        {payment && (
          <div className="space-y-1 text-[10px] pt-1">
            <div className="flex justify-between">
              <span className="capitalize">Payment Method:</span>
              <span className="font-bold uppercase">{payment.paymentMethod}</span>
            </div>
            {payment.paymentMethod === 'cash' && (
              <>
                <div className="flex justify-between">
                  <span>Cash Given:</span>
                  <span>{currencySymbol} {payment.cashGiven?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Change:</span>
                  <span>{currencySymbol} {payment.changeReturned?.toLocaleString()}</span>
                </div>
              </>
            )}
            <div className="text-[9px] text-charcoal-500 truncate">
              Txn: {payment.transactionReference}
            </div>
          </div>
        )}

        {/* Footer Greetings */}
        <div className="text-center pt-3 border-t border-dashed border-charcoal-400 space-y-1 text-[10px]">
          <div className="font-bold">{receiptSettings.headerText || 'Thank you for your visit!'}</div>
          <div className="text-[9px] text-charcoal-600">{receiptSettings.footerText || 'Please come again.'}</div>
          {receiptSettings.showWifiDetails && receiptSettings.wifiDetails && (
            <div className="mt-1 text-[9px] p-1 bg-ivory-200 rounded border border-charcoal-300">
              WiFi: {receiptSettings.wifiDetails}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
