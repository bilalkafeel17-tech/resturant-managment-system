import React, { useState, useEffect, useCallback } from 'react';
import {
  Receipt,
  Plus,
  Trash2,
  Download,
  Calendar,
  DollarSign,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';

export const Expenses = () => {
  const { restaurant, activeBranch, isAdmin } = useAuth();
  const toast = useToast();

  const [expenses, setExpenses] = useState([]);
  const [totalExpenseAmount, setTotalExpenseAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'utilities',
    amount: '',
    paymentMethod: 'cash',
    referenceNumber: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);

      const res = await api.get(`/expenses?${params.toString()}`);
      if (res.success) {
        setExpenses(res.expenses);
        setTotalExpenseAmount(res.totalExpenseAmount || 0);
      }
    } catch (err) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, toast]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount) {
      toast.warning('Title and amount are required');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/expenses', {
        ...form,
        branchId: activeBranch?._id,
      });

      if (res.success) {
        toast.success('Expense recorded successfully!');
        setModalOpen(false);
        setForm({
          title: '',
          category: 'utilities',
          amount: '',
          paymentMethod: 'cash',
          referenceNumber: '',
          notes: '',
        });
        loadExpenses();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to record expense');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this expense record?')) return;
    try {
      const res = await api.delete(`/expenses/${id}`);
      if (res.success) {
        toast.success('Expense deleted');
        loadExpenses();
      }
    } catch (err) {
      toast.error('Failed to delete expense');
    }
  };

  const handleExportCSV = () => {
    window.open(`${import.meta.env.VITE_API_URL || '/api'}/reports/export/expenses.csv`, '_blank');
  };

  const currencySymbol = restaurant?.currencySymbol || 'Rs.';

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-ivory-300 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-forest-950 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-forest-800" />
            <span>Operating Expenses & Overhead</span>
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Log bills, staff salaries, rent, kitchen supplies, and maintenance costs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={handleExportCSV} icon={Download}>
            Export CSV
          </Button>

          {isAdmin && (
            <Button size="sm" icon={Plus} onClick={() => setModalOpen(true)}>
              Record Expense
            </Button>
          )}
        </div>
      </div>

      {/* KPI Card */}
      <div className="bg-forest-950 text-ivory-100 p-5 rounded-2xl border border-forest-900 shadow-md flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-forest-300 uppercase tracking-wider">
            Total Logged Expenses
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-terracotta-400 mt-1">
            {currencySymbol} {totalExpenseAmount.toLocaleString()}
          </div>
        </div>
        <div className="text-right text-xs text-forest-300">
          <div>{expenses.length} Records</div>
          <div>{activeBranch?.name}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-ivory-300 shadow-xs flex items-center gap-3 text-xs">
        <label className="font-semibold text-charcoal-700">Category Filter:</label>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-ivory-400 px-3 py-1.5 bg-white text-charcoal-800"
        >
          <option value="">All Categories</option>
          <option value="utilities">Utilities (Electricity/Gas/Water)</option>
          <option value="rent">Rent</option>
          <option value="supplies">Cleaning & Supplies</option>
          <option value="maintenance">Equipment Maintenance</option>
          <option value="salaries">Staff Salaries</option>
          <option value="marketing">Marketing & Promotions</option>
          <option value="other">Other Expenses</option>
        </select>
      </div>

      {/* Expense Table */}
      <div className="bg-white rounded-2xl border border-ivory-300 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading expenses..." />
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses logged"
            description="Record operating overheads to accurately compute profit & loss."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory-100/80 border-b border-ivory-300 text-charcoal-600 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Expense Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Payment Method</th>
                  <th className="px-4 py-3">Recorded By</th>
                  <th className="px-4 py-3 font-mono">Amount</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200">
                {expenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-ivory-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-forest-950">
                      {exp.title}
                      {exp.referenceNumber && (
                        <span className="block text-[10px] text-charcoal-400 font-mono">
                          Ref: {exp.referenceNumber}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 capitalize font-medium text-charcoal-700">
                      <Badge variant="default" size="sm">
                        {exp.category}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-charcoal-600">
                      {new Date(exp.expenseDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 capitalize text-charcoal-700 font-mono">
                      {exp.paymentMethod.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3.5 text-charcoal-600">
                      {exp.recordedBy?.name || 'Staff'}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-rose-700">
                      {currencySymbol} {exp.amount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(exp._id)}
                          className="p-1 text-rose-600 hover:text-rose-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Expense Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Operating Expense"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateExpense} loading={saving}>
              Record Expense
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <Input
            label="Expense Title"
            placeholder="e.g. Lesco Electricity Bill September"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border border-ivory-400 p-2.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-forest-600"
              >
                <option value="utilities">Utilities</option>
                <option value="rent">Rent</option>
                <option value="supplies">Supplies & Cleaning</option>
                <option value="maintenance">Maintenance</option>
                <option value="salaries">Salaries</option>
                <option value="marketing">Marketing</option>
                <option value="other">Other</option>
              </select>
            </div>

            <Input
              label={`Amount (${currencySymbol})`}
              type="number"
              placeholder="12500"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
                Payment Method
              </label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full rounded-xl border border-ivory-400 p-2.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-forest-600"
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <Input
              label="Invoice / Ref #"
              placeholder="e.g. LESCO-9921"
              value={form.referenceNumber}
              onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
            />
          </div>

          <Input
            label="Notes (Optional)"
            placeholder="Additional details..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
};
