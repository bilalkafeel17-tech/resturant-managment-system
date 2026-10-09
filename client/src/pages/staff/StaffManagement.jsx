import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Building2,
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

export const StaffManagement = () => {
  const { restaurant, branches, isAdmin } = useAuth();
  const toast = useToast();

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier',
    branchId: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/staff');
      if (res.success) setStaffList(res.staff);
    } catch (err) {
      toast.error('Failed to load staff list');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.warning('Name, email, and password are required');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/staff', form);
      if (res.success) {
        toast.success('Staff member registered!');
        setModalOpen(false);
        setForm({
          name: '',
          email: '',
          password: '',
          role: 'cashier',
          branchId: '',
          phone: '',
        });
        loadStaff();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create staff member');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (staff) => {
    try {
      const res = await api.put(`/staff/${staff._id}`, {
        isActive: !staff.isActive,
      });
      if (res.success) {
        toast.success(`Account ${!staff.isActive ? 'activated' : 'deactivated'}`);
        loadStaff();
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-ivory-300 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-forest-950 flex items-center gap-2">
            <Users className="w-6 h-6 text-forest-800" />
            <span>Staff & Role-Based Access Control</span>
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Manage cashier accounts, kitchen staff, branch managers, and platform permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={loadStaff} icon={RefreshCw}>
            Refresh
          </Button>

          {isAdmin && (
            <Button size="sm" icon={Plus} onClick={() => setModalOpen(true)}>
              Invite Staff Member
            </Button>
          )}
        </div>
      </div>

      {/* Staff Grid / Table */}
      <div className="bg-white rounded-2xl border border-ivory-300 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading staff accounts..." />
        ) : staffList.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No staff members registered"
            description="Invite managers, cashiers, and kitchen team."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory-100/80 border-b border-ivory-300 text-charcoal-600 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Staff Name</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Role Assigned</th>
                  <th className="px-4 py-3">Branch Scope</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200">
                {staffList.map((staff) => (
                  <tr key={staff._id} className="hover:bg-ivory-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-forest-950 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-forest-900 text-ivory-50 flex items-center justify-center font-bold text-xs">
                        {staff.name[0].toUpperCase()}
                      </div>
                      <span>{staff.name}</span>
                    </td>
                    <td className="px-4 py-3.5 text-charcoal-600">{staff.email}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant="forest" size="sm">
                        {staff.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-charcoal-700">
                      {staff.branchId?.name || 'All Branches (Owner)'}
                    </td>
                    <td className="px-4 py-3.5 text-charcoal-500">{staff.phone || '—'}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={staff.isActive ? 'success' : 'danger'} size="sm">
                        {staff.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {isAdmin && staff.role !== 'admin' && staff.role !== 'superadmin' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleActive(staff)}
                        >
                          {staff.isActive ? 'Deactivate' : 'Activate'}
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

      {/* Invite Staff Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Invite New Staff Member"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateStaff} loading={saving}>
              Register Staff
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Asim Raza"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email Address"
              type="email"
              placeholder="asim@lahoregrill.pk"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
                Role & Permissions
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-xl border border-ivory-400 p-2.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-forest-600"
              >
                <option value="cashier">Cashier (POS Billing)</option>
                <option value="kitchen">Kitchen Staff (KDS Display)</option>
                <option value="manager">Branch Manager (Inventory & Reports)</option>
                <option value="admin">Administrator (Full Access)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
                Assigned Branch
              </label>
              <select
                value={form.branchId}
                onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                className="w-full rounded-xl border border-ivory-400 p-2.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-forest-600"
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Phone (Optional)"
            placeholder="0300-1234567"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
};
