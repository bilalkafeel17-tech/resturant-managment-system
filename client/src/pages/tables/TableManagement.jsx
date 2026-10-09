import React, { useState, useEffect, useCallback } from 'react';
import {
  Armchair,
  Plus,
  Users,
  Utensils,
  Receipt,
  Sparkles,
  CheckCircle2,
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

export const TableManagement = () => {
  const { restaurant, activeBranch, isAdmin } = useAuth();
  const toast = useToast();

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sectionFilter, setSectionFilter] = useState('all');

  // Add Table Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    tableNumber: '',
    capacity: 4,
    section: 'Main Dining',
  });
  const [saving, setSaving] = useState(false);

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/tables');
      if (res.success) {
        setTables(res.tables);
      }
    } catch (err) {
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTables();
    const handleBranchChange = () => fetchTables();
    window.addEventListener('branch-changed', handleBranchChange);
    return () => window.removeEventListener('branch-changed', handleBranchChange);
  }, [fetchTables]);

  const handleUpdateStatus = async (tableId, newStatus) => {
    try {
      const res = await api.patch(`/tables/${tableId}/status`, { status: newStatus });
      if (res.success) {
        toast.success(res.message);
        fetchTables();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update table status');
    }
  };

  const handleCreateTable = async (e) => {
    e.preventDefault();
    if (!form.tableNumber) {
      toast.warning('Table number is required');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/tables', form);
      if (res.success) {
        toast.success('Table created successfully!');
        setModalOpen(false);
        setForm({ tableNumber: '', capacity: 4, section: 'Main Dining' });
        fetchTables();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create table');
    } finally {
      setSaving(false);
    }
  };

  const sections = ['all', ...new Set(tables.map((t) => t.section))];
  const filteredTables = tables.filter((t) => {
    if (sectionFilter === 'all') return true;
    return t.section === sectionFilter;
  });

  const currencySymbol = restaurant?.currencySymbol || 'Rs.';

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-ivory-300 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-forest-950 flex items-center gap-2">
            <Armchair className="w-6 h-6 text-forest-800" />
            <span>Floor Plan & Dining Tables</span>
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Monitor live table occupancy, seated parties, and turn-over states for {activeBranch?.name}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={fetchTables} icon={RefreshCw}>
            Sync
          </Button>

          {isAdmin && (
            <Button size="sm" icon={Plus} onClick={() => setModalOpen(true)}>
              Add Dining Table
            </Button>
          )}
        </div>
      </div>

      {/* Section Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {sections.map((sec) => (
          <button
            key={sec}
            type="button"
            onClick={() => setSectionFilter(sec)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors border ${
              sectionFilter === sec
                ? 'bg-forest-900 text-white border-forest-900 shadow-xs'
                : 'bg-white text-charcoal-700 border-ivory-300 hover:bg-ivory-100'
            }`}
          >
            {sec === 'all' ? 'All Floor Sections' : sec}
          </button>
        ))}
      </div>

      {/* Tables Grid */}
      {loading ? (
        <LoadingSpinner label="Loading floor layout..." />
      ) : filteredTables.length === 0 ? (
        <EmptyState
          icon={Armchair}
          title="No dining tables found"
          description="Create tables to manage dine-in guests."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredTables.map((table) => {
            let statusBg = 'border-emerald-300 bg-emerald-50/50 text-emerald-900';
            if (table.status === 'occupied') {
              statusBg = 'border-rose-300 bg-rose-50/60 text-rose-950';
            } else if (table.status === 'reserved') {
              statusBg = 'border-terracotta-300 bg-terracotta-50/60 text-terracotta-950';
            } else if (table.status === 'cleaning') {
              statusBg = 'border-blue-300 bg-blue-50/60 text-blue-950';
            }

            return (
              <div
                key={table._id}
                className={`p-4 rounded-2xl border-2 transition-all shadow-xs flex flex-col justify-between ${statusBg}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-heading font-extrabold text-base">
                      {table.tableNumber}
                    </span>
                    <Badge size="sm">{table.status}</Badge>
                  </div>

                  <div className="text-[11px] opacity-80 flex items-center gap-1 mb-2">
                    <Users className="w-3.5 h-3.5" />
                    <span>{table.capacity} Seats • {table.section}</span>
                  </div>

                  {/* Active Order snippet if occupied */}
                  {table.activeOrderId && (
                    <div className="p-2 rounded-xl bg-white/90 border border-ivory-300 text-[10px] space-y-0.5 mt-2">
                      <div className="font-mono font-bold text-forest-950">
                        {table.activeOrderId.orderNumber}
                      </div>
                      <div className="font-bold text-forest-900">
                        {currencySymbol} {table.activeOrderId.grandTotal?.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Toggle Actions */}
                <div className="mt-4 pt-2 border-t border-black/10 flex items-center justify-between text-[10px]">
                  {table.status === 'occupied' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(table._id, 'cleaning')}
                      className="font-bold text-blue-700 hover:underline"
                    >
                      Clear & Clean
                    </button>
                  )}
                  {table.status === 'cleaning' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(table._id, 'available')}
                      className="font-bold text-emerald-700 hover:underline"
                    >
                      Ready for Seating
                    </button>
                  )}
                  {table.status === 'available' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(table._id, 'occupied')}
                      className="font-bold text-rose-700 hover:underline"
                    >
                      Occupy Table
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Table Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Dining Table"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTable} loading={saving}>
              Create Table
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateTable} className="space-y-4">
          <Input
            label="Table Number / Name"
            placeholder="e.g. T-09 or VIP-01"
            value={form.tableNumber}
            onChange={(e) => setForm({ ...form, tableNumber: e.target.value })}
            required
            autoFocus
          />

          <Input
            label="Seating Capacity"
            type="number"
            min="1"
            max="30"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
              Floor Section
            </label>
            <select
              value={form.section}
              onChange={(e) => setForm({ ...form, section: e.target.value })}
              className="w-full rounded-xl border border-ivory-400 p-2.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-forest-600"
            >
              <option value="Main Dining">Main Dining</option>
              <option value="Family Hall">Family Hall</option>
              <option value="Outdoor Patio">Outdoor Patio</option>
              <option value="Rooftop">Rooftop Lounge</option>
              <option value="Executive Private Room">Executive Private Room</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};
