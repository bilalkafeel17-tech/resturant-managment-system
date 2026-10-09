import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays,
  Plus,
  Search,
  Clock,
  User,
  Phone,
  Armchair,
  CheckCircle2,
  XCircle,
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

export const Reservations = () => {
  const { restaurant, activeBranch } = useAuth();
  const toast = useToast();

  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    partySize: 4,
    reservationTime: '',
    durationMinutes: 90,
    tableId: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFilter) params.append('date', dateFilter);

      const [resRes, tableRes] = await Promise.all([
        api.get(`/reservations?${params.toString()}`),
        api.get('/tables'),
      ]);

      if (resRes.success) setReservations(resRes.reservations);
      if (tableRes.success) setTables(tableRes.tables);
    } catch (err) {
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  }, [dateFilter, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateReservation = async (e) => {
    e.preventDefault();
    if (!form.customerName || !form.customerPhone || !form.reservationTime) {
      toast.warning('Please enter customer name, phone, and reservation date/time');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/reservations', {
        ...form,
        branchId: activeBranch?._id,
      });

      if (res.success) {
        toast.success('Reservation booked successfully!');
        setModalOpen(false);
        setForm({
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          partySize: 4,
          reservationTime: '',
          durationMinutes: 90,
          tableId: '',
          notes: '',
        });
        loadData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to book reservation');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await api.patch(`/reservations/${id}/status`, { status });
      if (res.success) {
        toast.success(res.message);
        loadData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update reservation');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-ivory-300 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-forest-950 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-forest-800" />
            <span>Table Reservations</span>
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Manage advance table bookings, party sizes, and conflict checks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={loadData} icon={RefreshCw}>
            Refresh
          </Button>

          <Button size="sm" icon={Plus} onClick={() => setModalOpen(true)}>
            Book Reservation
          </Button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white p-3 rounded-2xl border border-ivory-300 shadow-xs flex items-center gap-3">
        <label className="text-xs font-semibold text-charcoal-700">Filter Date:</label>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="text-xs rounded-xl border border-ivory-400 px-3 py-1.5 bg-white text-charcoal-800"
        />
        {dateFilter && (
          <button
            type="button"
            onClick={() => setDateFilter('')}
            className="text-xs text-forest-800 font-bold hover:underline"
          >
            Clear Date
          </button>
        )}
      </div>

      {/* Reservations Table */}
      <div className="bg-white rounded-2xl border border-ivory-300 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading bookings..." />
        ) : reservations.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No reservations found"
            description="Book reservations for walk-ins or advance callers."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory-100/80 border-b border-ivory-300 text-charcoal-600 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Guest Name & Phone</th>
                  <th className="px-4 py-3">Party Size</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Assigned Table</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200">
                {reservations.map((res) => (
                  <tr key={res._id} className="hover:bg-ivory-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-forest-950">{res.customerName}</div>
                      <div className="text-[11px] text-charcoal-500">{res.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-forest-900">
                      {res.partySize} Guests
                    </td>
                    <td className="px-4 py-3.5 text-charcoal-700">
                      <div>{new Date(res.reservationTime).toLocaleDateString()}</div>
                      <div className="text-[11px] text-charcoal-500 font-mono">
                        {new Date(res.reservationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {res.tableId ? (
                        <span className="font-bold text-charcoal-800">
                          Table {res.tableId.tableNumber} ({res.tableId.section})
                        </span>
                      ) : (
                        <span className="text-charcoal-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge size="sm">{res.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {res.status === 'confirmed' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleUpdateStatus(res._id, 'seated')}
                        >
                          Seat Guest
                        </Button>
                      )}
                      {res.status === 'seated' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(res._id, 'completed')}
                        >
                          Complete
                        </Button>
                      )}
                      {res.status !== 'cancelled' && res.status !== 'completed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-600 hover:text-rose-800"
                          onClick={() => handleUpdateStatus(res._id, 'cancelled')}
                        >
                          Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Book Reservation Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Book Table Reservation"
        subtitle="Registers guest party and prevents double bookings"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateReservation} loading={saving}>
              Confirm Booking
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateReservation} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Guest Name"
              placeholder="e.g. Salman Akhtar"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              required
            />
            <Input
              label="Contact Phone"
              placeholder="0300-9876543"
              value={form.customerPhone}
              onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Reservation Date & Time"
              type="datetime-local"
              value={form.reservationTime}
              onChange={(e) => setForm({ ...form, reservationTime: e.target.value })}
              required
            />
            <Input
              label="Party Size (Guests)"
              type="number"
              min="1"
              max="50"
              value={form.partySize}
              onChange={(e) => setForm({ ...form, partySize: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
              Assign Table (Optional)
            </label>
            <select
              value={form.tableId}
              onChange={(e) => setForm({ ...form, tableId: e.target.value })}
              className="w-full rounded-xl border border-ivory-400 p-2.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-forest-600"
            >
              <option value="">Auto Assign / Assign Later</option>
              {tables.map((t) => (
                <option key={t._id} value={t._id}>
                  Table {t.tableNumber} — {t.section} ({t.capacity} Seats)
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Special Requests / Notes"
            placeholder="e.g. Window seat, anniversary dinner"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
};
