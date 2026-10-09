import React, { useState, useEffect, useCallback } from 'react';
import {
  ReceiptText,
  Search,
  Filter,
  Calendar,
  Eye,
  XCircle,
  Printer,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { Input } from '../../components/common/Input.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { ThermalReceiptModal } from '../../components/pos/ThermalReceiptModal.jsx';

export const Orders = () => {
  const { restaurant, activeBranch, isAdmin } = useAuth();
  const toast = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (paymentFilter) params.append('paymentStatus', paymentFilter);
      if (orderTypeFilter) params.append('orderType', orderTypeFilter);
      params.append('page', page);
      params.append('limit', 20);

      const res = await api.get(`/orders?${params.toString()}`);
      if (res.success) {
        setOrders(res.orders);
        setTotalPages(res.pages);
      }
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, paymentFilter, orderTypeFilter, page, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCancelOrder = async () => {
    if (!cancelModalOrder) return;
    setCancelling(true);
    try {
      const res = await api.post(`/orders/${cancelModalOrder._id}/cancel`, {
        reason: cancelReason || 'Customer requested cancellation',
      });
      if (res.success) {
        toast.success(`Order #${cancelModalOrder.orderNumber} cancelled successfully`);
        setCancelModalOrder(null);
        setCancelReason('');
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const currencySymbol = restaurant?.currencySymbol || 'Rs.';

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-ivory-300 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-forest-950 flex items-center gap-2">
            <ReceiptText className="w-6 h-6 text-forest-800" />
            <span>Order History & Management</span>
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Audit live and completed transactions, guest details, and receipts.
          </p>
        </div>

        <Button size="sm" variant="secondary" onClick={fetchOrders} icon={RefreshCw}>
          Refresh
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-ivory-300 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
          <input
            type="text"
            placeholder="Search Order # or Guest..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-ivory-400 focus:outline-none focus:ring-1 focus:ring-forest-600"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-ivory-400 px-3 py-2 bg-white text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-forest-600"
        >
          <option value="">All Order Statuses</option>
          <option value="placed">Placed / New</option>
          <option value="in_kitchen">In Kitchen</option>
          <option value="ready">Ready</option>
          <option value="served">Served</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => {
            setPaymentFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-ivory-400 px-3 py-2 bg-white text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-forest-600"
        >
          <option value="">All Payment Statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
        </select>

        <select
          value={orderTypeFilter}
          onChange={(e) => {
            setOrderTypeFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-ivory-400 px-3 py-2 bg-white text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-forest-600"
        >
          <option value="">All Order Types</option>
          <option value="dine_in">Dine-In</option>
          <option value="takeaway">Takeaway</option>
          <option value="delivery">Delivery</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-ivory-300 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading orders..." />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No orders found"
            description="No orders match your filter criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory-100/80 border-b border-ivory-300 text-charcoal-600 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Order Number</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Type / Table</th>
                  <th className="px-4 py-3">Guest</th>
                  <th className="px-4 py-3">Grand Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-ivory-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-forest-950">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3.5 text-charcoal-600">
                      {new Date(order.createdAt).toLocaleDateString()}{' '}
                      <span className="text-[10px] text-charcoal-400">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 capitalize text-charcoal-800 font-medium">
                      {order.orderType.replace('_', ' ')}
                      {order.tableId && (
                        <div className="text-[10px] text-terracotta-600">
                          Table {order.tableId.tableNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-charcoal-700">
                      {order.customerInfo?.name || 'Walk-in'}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-forest-900">
                      {currencySymbol} {order.grandTotal.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge size="sm">{order.status}</Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge size="sm">{order.paymentStatus}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 rounded-lg text-charcoal-600 hover:text-forest-900 hover:bg-ivory-200 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setReceiptOrder(order)}
                        className="p-1.5 rounded-lg text-charcoal-600 hover:text-forest-900 hover:bg-ivory-200 transition-colors"
                        title="Print Receipt"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {isAdmin && order.status !== 'cancelled' && order.status !== 'completed' && (
                        <button
                          type="button"
                          onClick={() => setCancelModalOrder(order)}
                          className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors"
                          title="Cancel Order"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-ivory-200 bg-ivory-50 flex items-center justify-between text-xs">
            <span className="text-charcoal-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order #${selectedOrder.orderNumber}`}
          subtitle={`Placed on ${new Date(selectedOrder.createdAt).toLocaleString()}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-ivory-100 border border-ivory-300">
              <div>
                <span className="text-charcoal-500 block text-[10px]">Type</span>
                <span className="font-bold capitalize">{selectedOrder.orderType.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-charcoal-500 block text-[10px]">Status</span>
                <Badge size="sm">{selectedOrder.status}</Badge>
              </div>
              <div>
                <span className="text-charcoal-500 block text-[10px]">Payment</span>
                <Badge size="sm">{selectedOrder.paymentStatus}</Badge>
              </div>
              <div>
                <span className="text-charcoal-500 block text-[10px]">Total</span>
                <span className="font-mono font-bold text-forest-900">
                  {currencySymbol} {selectedOrder.grandTotal}
                </span>
              </div>
            </div>

            {/* Items List */}
            <div>
              <h4 className="font-bold text-forest-950 uppercase tracking-wider text-[11px] mb-2">
                Order Line Items
              </h4>
              <div className="space-y-2">
                {selectedOrder.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-ivory-200 bg-white flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-forest-950">
                        {item.quantity}x {item.nameSnapshot}
                      </div>
                      {item.variantSnapshot?.name && (
                        <div className="text-[10px] text-terracotta-600">{item.variantSnapshot.name}</div>
                      )}
                    </div>
                    <span className="font-mono font-bold">
                      {currencySymbol} {item.itemSubtotal}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-300 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{currencySymbol} {selectedOrder.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-{currencySymbol} {selectedOrder.discountAmount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({selectedOrder.taxRateSnapshot}%):</span>
                <span>+{currencySymbol} {selectedOrder.taxAmount}</span>
              </div>
              {selectedOrder.serviceChargeAmount > 0 && (
                <div className="flex justify-between">
                  <span>Service Charge ({selectedOrder.serviceChargeRateSnapshot}%):</span>
                  <span>+{currencySymbol} {selectedOrder.serviceChargeAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-forest-950 pt-1 border-t border-ivory-300">
                <span>Grand Total:</span>
                <span>{currencySymbol} {selectedOrder.grandTotal}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Order Modal */}
      {cancelModalOrder && (
        <Modal
          isOpen={!!cancelModalOrder}
          onClose={() => setCancelModalOrder(null)}
          title={`Cancel Order #${cancelModalOrder.orderNumber}`}
          subtitle="Restores recipe ingredients back into inventory stock."
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setCancelModalOrder(null)}>
                Dismiss
              </Button>
              <Button variant="danger" onClick={handleCancelOrder} loading={cancelling}>
                Confirm Cancellation
              </Button>
            </div>
          }
        >
          <Input
            label="Cancellation Reason"
            placeholder="e.g. Guest changed mind, incorrect bill"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            required
            autoFocus
          />
        </Modal>
      )}

      {/* Receipt Modal */}
      {receiptOrder && (
        <ThermalReceiptModal
          isOpen={!!receiptOrder}
          onClose={() => setReceiptOrder(null)}
          order={receiptOrder}
        />
      )}
    </div>
  );
};
