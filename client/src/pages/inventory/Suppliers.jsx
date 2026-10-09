import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Plus,
  Phone,
  Mail,
  MapPin,
  Edit2,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';

export const Suppliers = () => {
  const toast = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form, setForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    category: 'Meat & Poultry',
    paymentTerms: 'Net 30',
  });
  const [saving, setSaving] = useState(false);

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/suppliers');
      if (res.success) setSuppliers(res.suppliers);
    } catch (err) {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast.warning('Supplier name and phone are required');
      return;
    }

    setSaving(true);
    try {
      if (editingSupplier) {
        const res = await api.put(`/suppliers/${editingSupplier._id}`, form);
        if (res.success) {
          toast.success('Supplier updated!');
          setModalOpen(false);
          loadSuppliers();
        }
      } else {
        const res = await api.post('/suppliers', form);
        if (res.success) {
          toast.success('Supplier added!');
          setModalOpen(false);
          loadSuppliers();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save supplier');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-ivory-300 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-forest-950 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-forest-800" />
            <span>Vendors & Suppliers</span>
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Maintain authorized supplier contacts, categories, and credit terms.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={loadSuppliers} icon={RefreshCw}>
            Refresh
          </Button>

          <Button
            size="sm"
            icon={Plus}
            onClick={() => {
              setEditingSupplier(null);
              setForm({
                name: '',
                contactPerson: '',
                phone: '',
                email: '',
                address: '',
                category: 'Meat & Poultry',
                paymentTerms: 'Net 30',
              });
              setModalOpen(true);
            }}
          >
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Suppliers Grid */}
      {loading ? (
        <LoadingSpinner label="Loading suppliers..." />
      ) : suppliers.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No suppliers found"
          description="Register suppliers to connect purchase orders and ingredient costs."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {suppliers.map((sup) => (
            <div
              key={sup._id}
              className="bg-white rounded-2xl border border-ivory-300 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-forest-950">{sup.name}</h3>
                    <span className="text-[11px] font-semibold text-terracotta-600">
                      {sup.category}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSupplier(sup);
                      setForm({
                        name: sup.name,
                        contactPerson: sup.contactPerson || '',
                        phone: sup.phone || '',
                        email: sup.email || '',
                        address: sup.address || '',
                        category: sup.category || 'General',
                        paymentTerms: sup.paymentTerms || 'Net 30',
                      });
                      setModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-charcoal-500 hover:text-forest-900 hover:bg-ivory-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-charcoal-600">
                  {sup.contactPerson && <div>Contact: <strong>{sup.contactPerson}</strong></div>}
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-charcoal-400" />
                    <span>{sup.phone}</span>
                  </div>
                  {sup.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-charcoal-400" />
                      <span>{sup.email}</span>
                    </div>
                  )}
                  {sup.address && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-charcoal-400" />
                      <span>{sup.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-ivory-200 text-[11px] text-charcoal-500 flex justify-between">
                <span>Terms: <strong>{sup.paymentTerms}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSupplier ? 'Edit Supplier' : 'Register New Supplier'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSupplier} loading={saving}>
              Save Supplier
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveSupplier} className="space-y-4">
          <Input
            label="Supplier Company Name"
            placeholder="e.g. Punjab Halal Meats & Poultry"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Contact Person"
              placeholder="e.g. Malik Shakeel"
              value={form.contactPerson}
              onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
            />
            <Input
              label="Phone Number"
              placeholder="0321-4445555"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email"
              type="email"
              placeholder="orders@supplier.pk"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Supply Category"
              placeholder="e.g. Meat & Poultry"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>

          <Input
            label="Address"
            placeholder="e.g. Wholesale Market, Lahore"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
};
