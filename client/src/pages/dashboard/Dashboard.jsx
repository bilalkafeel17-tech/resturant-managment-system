import React, { useEffect, useState, useCallback } from 'react';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Receipt,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  RefreshCw,
  Store,
  CookingPot,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { StatCard } from '../../components/common/StatCard.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';

const PIE_COLORS = ['#173b30', '#c85a32', '#3a8b6e', '#d3c9af'];

export const Dashboard = () => {
  const { restaurant, activeBranch } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await api.get('/reports/dashboard');
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboard();

    const handleBranchChange = () => fetchDashboard(true);
    window.addEventListener('branch-changed', handleBranchChange);
    return () => window.removeEventListener('branch-changed', handleBranchChange);
  }, [fetchDashboard]);

  if (loading) {
    return <LoadingSpinner label="Loading operational analytics..." size="lg" />;
  }

  const today = data?.today || {
    grossSales: 0,
    netSales: 0,
    collectedRevenue: 0,
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    avgOrderValue: 0,
  };

  const currencySymbol = restaurant?.currencySymbol || 'Rs.';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-ivory-300 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-forest-950">
              Operations Overview
            </h1>
            <Badge variant="forest">{activeBranch?.name || 'All Branches'}</Badge>
          </div>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Real-time live performance, order statuses, and stock monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchDashboard(true)}
            loading={refreshing}
            icon={RefreshCw}
          >
            Refresh
          </Button>

          <Link to="/pos">
            <Button size="sm" icon={Plus}>
              New Order (POS)
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Gross Sales"
          value={`${currencySymbol} ${today.grossSales.toLocaleString()}`}
          subtitle={`${today.totalOrders} total orders today`}
          icon={DollarSign}
          variant="forest"
          trend={{ value: `${today.completedOrders} completed`, isPositive: true }}
        />

        <StatCard
          title="Net Collected Revenue"
          value={`${currencySymbol} ${today.collectedRevenue.toLocaleString()}`}
          subtitle="Settled & verified payments"
          icon={Receipt}
          variant="terracotta"
        />

        <StatCard
          title="Active Live Orders"
          value={today.activeOrders}
          subtitle="Cooking or ready in kitchen"
          icon={CookingPot}
          variant="default"
        />

        <StatCard
          title="Average Ticket (AOV)"
          value={`${currencySymbol} ${today.avgOrderValue.toLocaleString()}`}
          subtitle="Per dining customer"
          icon={TrendingUp}
          variant="default"
        />
      </div>

      {/* Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Sales Trend Chart */}
        <Card
          className="lg:col-span-2"
          header={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-forest-800" />
                <h3 className="text-sm font-bold font-heading text-forest-950">
                  7-Day Sales Trends
                </h3>
              </div>
              <span className="text-xs text-charcoal-400">Daily Gross Volume</span>
            </div>
          }
        >
          {data?.salesTrends && data.salesTrends.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.salesTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6d7382' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6d7382' }} />
                  <Tooltip
                    formatter={(val) => [`${currencySymbol} ${val}`, 'Sales']}
                    contentStyle={{
                      backgroundColor: '#173b30',
                      borderColor: '#1d4739',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="sales" fill="#173b30" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No historical trend data" description="Sales charts will appear as orders are processed." />
          )}
        </Card>

        {/* Payment Breakdown Pie */}
        <Card
          header={
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-terracotta-500" />
              <h3 className="text-sm font-bold font-heading text-forest-950">
                Payment Breakdown
              </h3>
            </div>
          }
        >
          {data?.paymentBreakdown && data.paymentBreakdown.length > 0 ? (
            <div className="space-y-4">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.paymentBreakdown}
                      dataKey="totalAmount"
                      nameKey="method"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={4}
                    >
                      {data.paymentBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => [`${currencySymbol} ${val}`, 'Collected']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 border-t border-ivory-200 pt-3">
                {data.paymentBreakdown.map((item, idx) => (
                  <div key={item.method} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                      <span className="capitalize font-medium text-charcoal-700">{item.method}</span>
                    </div>
                    <span className="font-bold text-forest-950 font-mono">
                      {currencySymbol} {item.totalAmount.toLocaleString()} ({item.count})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState title="No payments recorded today" description="Settled cash and online payments will display here." />
          )}
        </Card>
      </div>

      {/* Lower Row: Popular Items, Low Stock, Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Popular Menu Items */}
        <Card
          header={
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-terracotta-500" />
              <h3 className="text-sm font-bold font-heading text-forest-950">
                Top Selling Items
              </h3>
            </div>
          }
        >
          {data?.popularItems && data.popularItems.length > 0 ? (
            <div className="space-y-3">
              {data.popularItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl hover:bg-ivory-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-forest-100 text-forest-900 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-forest-950 truncate max-w-[150px]">{item.name}</div>
                      <div className="text-[11px] text-charcoal-500">{item.totalQuantity} portions sold</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold font-mono text-forest-900">
                    {currencySymbol} {item.totalRevenue.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No top items yet" description="Items will rank as orders are placed." />
          )}
        </Card>

        {/* Low Stock Alerts */}
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold font-heading text-forest-950">
                  Stock Alerts
                </h3>
              </div>
              {data?.lowStockAlerts?.count > 0 && (
                <Badge variant="warning">{data.lowStockAlerts.count} Low</Badge>
              )}
            </div>
          }
          footer={
            <Link to="/inventory" className="text-xs font-bold text-forest-800 hover:underline flex items-center justify-center gap-1">
              <span>View Inventory Manager</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          {data?.lowStockAlerts?.items && data.lowStockAlerts.items.length > 0 ? (
            <div className="space-y-2.5">
              {data.lowStockAlerts.items.map((ing) => (
                <div key={ing._id} className="flex items-center justify-between p-2 rounded-xl bg-amber-50/50 border border-amber-200 text-xs">
                  <div>
                    <div className="font-bold text-charcoal-900">{ing.name}</div>
                    <div className="text-[10px] text-amber-800 font-medium">
                      Min threshold: {ing.minStockAlert} {ing.unit}
                    </div>
                  </div>
                  <Badge variant="warning">
                    {ing.currentStock} {ing.unit} Left
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-charcoal-500">
              ✅ All ingredient inventory levels are above alert thresholds.
            </div>
          )}
        </Card>

        {/* Recent Orders Ticker */}
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-forest-800" />
                <h3 className="text-sm font-bold font-heading text-forest-950">
                  Recent Orders
                </h3>
              </div>
              <Link to="/orders" className="text-xs font-bold text-forest-800 hover:underline">
                View All
              </Link>
            </div>
          }
        >
          {data?.recentOrders && data.recentOrders.length > 0 ? (
            <div className="space-y-2.5">
              {data.recentOrders.map((ord) => (
                <div
                  key={ord._id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-ivory-300 bg-white hover:bg-ivory-50 transition-colors text-xs"
                >
                  <div>
                    <div className="font-bold text-forest-950 font-mono">{ord.orderNumber}</div>
                    <div className="text-[11px] text-charcoal-500 capitalize">
                      {ord.orderType.replace('_', ' ')} • {ord.customerInfo?.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-mono text-forest-900">
                      {currencySymbol} {ord.grandTotal.toLocaleString()}
                    </div>
                    <Badge size="sm">{ord.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No orders yet" description="Orders placed via POS will appear here." />
          )}
        </Card>
      </div>
    </div>
  );
};
