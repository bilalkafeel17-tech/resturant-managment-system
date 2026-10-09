import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Receipt,
  Boxes,
  TrendingUp,
  Filter,
  DollarSign,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Button } from '../../components/common/Button.jsx';
import { StatCard } from '../../components/common/StatCard.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';

export const Reports = () => {
  const { restaurant, activeBranch } = useAuth();
  const toast = useToast();

  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSalesReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await api.get(`/reports/sales?${params.toString()}`);
      if (res.success) {
        setSalesData(res);
      }
    } catch (err) {
      toast.error('Failed to generate sales report');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, toast]);

  useEffect(() => {
    fetchSalesReport();
  }, [fetchSalesReport]);

  const handleExportSales = () => {
    window.open(
      `${import.meta.env.VITE_API_URL || '/api'}/reports/export/sales.csv?startDate=${startDate}&endDate=${endDate}`,
      '_blank'
    );
  };

  const handleExportInventory = () => {
    window.open(`${import.meta.env.VITE_API_URL || '/api'}/reports/export/inventory.csv`, '_blank');
  };

  const handleExportExpenses = () => {
    window.open(`${import.meta.env.VITE_API_URL || '/api'}/reports/export/expenses.csv`, '_blank');
  };

  const summary = salesData?.summary || {
    totalOrders: 0,
    completedCount: 0,
    cancelledCount: 0,
    totalGross: 0,
    totalTax: 0,
    totalDiscount: 0,
    netSales: 0,
  };

  const currencySymbol = restaurant?.currencySymbol || 'Rs.';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-ivory-300 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-forest-950 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-forest-800" />
            <span>Financial & Sales Reports</span>
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Audit gross billings, net sales, regional tax collections, and export CSV spreadsheets.
          </p>
        </div>

        {/* CSV Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={handleExportSales} icon={Download}>
            Sales CSV
          </Button>
          <Button size="sm" variant="secondary" onClick={handleExportInventory} icon={Boxes}>
            Inventory CSV
          </Button>
          <Button size="sm" variant="secondary" onClick={handleExportExpenses} icon={Receipt}>
            Expenses CSV
          </Button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-ivory-300 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-charcoal-700">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-ivory-400 px-3 py-1.5 bg-white text-charcoal-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-charcoal-700">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl border border-ivory-400 px-3 py-1.5 bg-white text-charcoal-800"
            />
          </div>

          <Button size="sm" onClick={fetchSalesReport} icon={Filter}>
            Apply Filter
          </Button>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const now = new Date().toISOString().slice(0, 10);
              setStartDate(now);
              setEndDate(now);
            }}
            className="px-2.5 py-1 rounded-lg border border-ivory-300 bg-ivory-100 hover:bg-ivory-200 font-semibold"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => {
              const start = new Date(Date.now() - 7 * 24 * 3600000).toISOString().slice(0, 10);
              const now = new Date().toISOString().slice(0, 10);
              setStartDate(start);
              setEndDate(now);
            }}
            className="px-2.5 py-1 rounded-lg border border-ivory-300 bg-ivory-100 hover:bg-ivory-200 font-semibold"
          >
            Last 7 Days
          </button>
          <button
            type="button"
            onClick={() => {
              const start = new Date(Date.now() - 30 * 24 * 3600000).toISOString().slice(0, 10);
              const now = new Date().toISOString().slice(0, 10);
              setStartDate(start);
              setEndDate(now);
            }}
            className="px-2.5 py-1 rounded-lg border border-ivory-300 bg-ivory-100 hover:bg-ivory-200 font-semibold"
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Gross Sales Volume"
          value={`${currencySymbol} ${summary.totalGross.toLocaleString()}`}
          subtitle={`${summary.totalOrders} total orders placed`}
          icon={DollarSign}
          variant="forest"
        />

        <StatCard
          title="Net Sales (Excl. Tax)"
          value={`${currencySymbol} ${summary.netSales.toLocaleString()}`}
          subtitle="Revenue before GST"
          icon={TrendingUp}
          variant="terracotta"
        />

        <StatCard
          title="Tax Collected (PRA GST)"
          value={`${currencySymbol} ${summary.totalTax.toLocaleString()}`}
          subtitle="Configured regional rate"
          icon={Receipt}
          variant="default"
        />

        <StatCard
          title="Total Discounts Granted"
          value={`${currencySymbol} ${summary.totalDiscount.toLocaleString()}`}
          subtitle="Promotional markdowns"
          icon={BarChart3}
          variant="default"
        />
      </div>

      {/* Orders List in Date Range */}
      <div className="bg-white rounded-2xl border border-ivory-300 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-ivory-200 bg-ivory-50 flex items-center justify-between">
          <h3 className="text-sm font-bold font-heading text-forest-950">
            Itemized Orders ({salesData?.orders?.length || 0})
          </h3>
          <span className="text-xs text-charcoal-500 font-mono">
            {startDate} to {endDate}
          </span>
        </div>

        {loading ? (
          <LoadingSpinner label="Generating sales data..." />
        ) : !salesData?.orders || salesData.orders.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No sales in selected range"
            description="Try selecting a wider date range."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory-100/80 border-b border-ivory-300 text-charcoal-600 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="px-5 py-3">Order #</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Subtotal</th>
                  <th className="px-4 py-3">Tax</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Grand Total</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200 font-mono">
                {salesData.orders.map((ord) => (
                  <tr key={ord._id} className="hover:bg-ivory-50/60">
                    <td className="px-5 py-3 font-bold text-forest-950 font-sans">
                      {ord.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-charcoal-600 font-sans">
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-sans text-charcoal-700">
                      {ord.branchId?.name || 'Main Branch'}
                    </td>
                    <td className="px-4 py-3 capitalize font-sans">
                      {ord.orderType.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-charcoal-700">
                      {currencySymbol} {ord.subtotal?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-charcoal-600">
                      {currencySymbol} {ord.taxAmount?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-terracotta-600">
                      -{currencySymbol} {ord.discountAmount || 0}
                    </td>
                    <td className="px-4 py-3 font-bold text-forest-950">
                      {currencySymbol} {ord.grandTotal?.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right font-sans">
                      <Badge size="sm">{ord.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
