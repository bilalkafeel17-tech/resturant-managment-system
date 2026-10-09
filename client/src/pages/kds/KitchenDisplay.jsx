import React, { useState, useEffect, useCallback } from 'react';
import {
  CookingPot,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Flame,
  Utensils,
  Check,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useSocket } from '../../context/SocketContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';

export const KitchenDisplay = () => {
  const { restaurant, activeBranch } = useAuth();
  const { socket, isConnected } = useSocket();
  const toast = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'placed', 'in_kitchen', 'ready'
  const [elapsedTick, setElapsedTick] = useState(0);

  // Fetch active kitchen orders
  const loadKitchenOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/kitchen/orders');
      if (res.success) {
        setOrders(res.orders);
      }
    } catch (err) {
      toast.error('Failed to load kitchen display orders');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadKitchenOrders();

    // 1-minute interval to update elapsed timers
    const timer = setInterval(() => {
      setElapsedTick((prev) => prev + 1);
    }, 30000);

    return () => clearInterval(timer);
  }, [loadKitchenOrders]);

  // Socket.IO Real-time listeners
  useEffect(() => {
    if (!socket) return;

    const handleOrderCreated = (data) => {
      toast.info(`New Order #${data.order?.orderNumber} queued!`, 'Kitchen Alert');
      loadKitchenOrders(true);
    };

    const handleStatusUpdated = () => {
      loadKitchenOrders(true);
    };

    const handleItemUpdated = () => {
      loadKitchenOrders(true);
    };

    socket.on('order_created', handleOrderCreated);
    socket.on('order_status_updated', handleStatusUpdated);
    socket.on('order_item_updated', handleItemUpdated);

    return () => {
      socket.off('order_created', handleOrderCreated);
      socket.off('order_status_updated', handleStatusUpdated);
      socket.off('order_item_updated', handleItemUpdated);
    };
  }, [socket, loadKitchenOrders, toast]);

  // Update item preparation status
  const handleItemStatusChange = async (orderId, itemId, currentStatus) => {
    let nextStatus = 'cooking';
    if (currentStatus === 'pending') nextStatus = 'cooking';
    else if (currentStatus === 'cooking') nextStatus = 'ready';
    else if (currentStatus === 'ready') nextStatus = 'served';

    try {
      const res = await api.patch(`/kitchen/orders/${orderId}/items/${itemId}`, {
        status: nextStatus,
      });
      if (res.success) {
        loadKitchenOrders(true);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update item status');
    }
  };

  // Update whole order status
  const handleOrderAdvance = async (orderId, targetStatus) => {
    try {
      const res = await api.patch(`/orders/${orderId}/status`, {
        status: targetStatus,
      });
      if (res.success) {
        toast.success(`Order advanced to ${targetStatus.toUpperCase()}`);
        loadKitchenOrders(true);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to advance order');
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'all') return true;
    return o.status === filterStatus;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* KDS Header Banner */}
      <div className="bg-forest-950 text-ivory-100 p-4 sm:p-5 rounded-2xl border border-forest-900 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-forest-800 text-terracotta-400">
              <CookingPot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-heading tracking-wide">
                Live Kitchen Display System (KDS)
              </h1>
              <p className="text-xs text-forest-300">
                {activeBranch?.name || 'Main Kitchen'} • {orders.length} Active Orders in Queue
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'placed', 'in_kitchen', 'ready'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors border ${
                filterStatus === st
                  ? 'bg-terracotta-500 text-white border-terracotta-400 shadow-sm'
                  : 'bg-forest-900/80 text-forest-200 border-forest-800 hover:bg-forest-800'
              }`}
            >
              {st === 'all' ? 'All Orders' : st.replace('_', ' ')}
            </button>
          ))}

          <Button
            size="sm"
            variant="secondary"
            onClick={() => loadKitchenOrders(false)}
            icon={RefreshCw}
            className="text-xs"
          >
            Sync
          </Button>
        </div>
      </div>

      {/* Orders Grid */}
      {loading ? (
        <LoadingSpinner label="Loading active orders in kitchen..." size="lg" />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={CookingPot}
          title="Kitchen queue is clear"
          description="All incoming dine-in, takeaway, and delivery orders will appear here in real-time."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filteredOrders.map((order) => {
            const elapsed = Math.max(
              0,
              Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)
            );

            let timerColor = 'bg-emerald-50 text-emerald-800 border-emerald-300';
            if (elapsed >= 15 && elapsed < 25) {
              timerColor = 'bg-amber-50 text-amber-900 border-amber-300';
            } else if (elapsed >= 25) {
              timerColor = 'bg-rose-50 text-rose-900 border-rose-400 animate-pulse';
            }

            return (
              <div
                key={order._id}
                className="bg-white rounded-2xl border border-ivory-300 shadow-sm overflow-hidden flex flex-col justify-between"
              >
                {/* Card Header */}
                <div className="p-4 border-b border-ivory-200 bg-ivory-50 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-sm text-forest-950">
                        {order.orderNumber}
                      </span>
                      <Badge size="sm">{order.status}</Badge>
                    </div>
                    <div className="text-[11px] text-charcoal-500 capitalize mt-0.5">
                      {order.orderType.replace('_', ' ')}
                      {order.tableNameSnapshot ? ` • ${order.tableNameSnapshot}` : ''}
                    </div>
                  </div>

                  {/* Elapsed Timer */}
                  <div
                    className={`px-2.5 py-1 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 ${timerColor}`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{elapsed}m</span>
                  </div>
                </div>

                {/* Items Preparation Checklist */}
                <div className="p-4 flex-1 space-y-2.5 overflow-y-auto max-h-72">
                  {order.items.map((item) => {
                    let itemBadge = 'bg-ivory-200 text-charcoal-700';
                    if (item.itemStatus === 'cooking') itemBadge = 'bg-amber-100 text-amber-900';
                    if (item.itemStatus === 'ready') itemBadge = 'bg-emerald-100 text-emerald-900 font-bold';

                    return (
                      <div
                        key={item._id}
                        onClick={() => handleItemStatusChange(order._id, item._id, item.itemStatus)}
                        className="p-2.5 rounded-xl border border-ivory-300 hover:border-forest-600 bg-ivory-50/50 hover:bg-white transition-all cursor-pointer flex items-start justify-between gap-2 select-none"
                      >
                        <div className="flex-1">
                          <div className="text-xs font-bold text-forest-950 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-forest-900 text-white flex items-center justify-center text-[10px] font-mono">
                              {item.quantity}x
                            </span>
                            <span>{item.nameSnapshot}</span>
                          </div>

                          {item.variantSnapshot?.name && (
                            <div className="text-[10px] text-terracotta-600 font-semibold pl-7">
                              {item.variantSnapshot.name}
                            </div>
                          )}

                          {item.addOnsSnapshot?.length > 0 && (
                            <div className="text-[10px] text-charcoal-500 pl-7">
                              + {item.addOnsSnapshot.map((a) => a.name).join(', ')}
                            </div>
                          )}

                          {item.notes && (
                            <div className="text-[10px] italic text-rose-600 font-medium pl-7 mt-0.5">
                              ⚠️ "{item.notes}"
                            </div>
                          )}
                        </div>

                        {/* Status Checkbox Pill */}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold ${itemBadge}`}>
                          {item.itemStatus}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Order Notes */}
                {order.notes && (
                  <div className="px-4 py-2 bg-amber-50/60 border-t border-amber-200 text-[11px] text-amber-900">
                    <strong>Order Note:</strong> {order.notes}
                  </div>
                )}

                {/* Actions Footer */}
                <div className="p-3 border-t border-ivory-200 bg-ivory-50 flex items-center gap-2">
                  {order.status === 'placed' && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleOrderAdvance(order._id, 'in_kitchen')}
                      icon={Flame}
                    >
                      Start Cooking
                    </Button>
                  )}

                  {order.status === 'in_kitchen' && (
                    <Button
                      size="sm"
                      variant="terracotta"
                      className="w-full"
                      onClick={() => handleOrderAdvance(order._id, 'ready')}
                      icon={CheckCircle2}
                    >
                      Mark All Ready
                    </Button>
                  )}

                  {order.status === 'ready' && (
                    <Button
                      size="sm"
                      className="w-full bg-emerald-700 hover:bg-emerald-800"
                      onClick={() => handleOrderAdvance(order._id, 'served')}
                      icon={Check}
                    >
                      Serve to Table / Guest
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
