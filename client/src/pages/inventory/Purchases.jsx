import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Plus,
  PackageCheck,
  Building2,
  Trash2,
  Receipt,
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

export const Purchases = () => {
  const { restaurant, activeBranch, isAdmin } = useAuth();
  const toast = useToast();

  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([
    { ingredientId: '', quantity: 10, unitCost: 100 },
  ]);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [poRes, supRes, ingRes] = await Promise.all([
        api.get('/purchases'),
        api.get('/suppliers'),
        api.get('/inventory/ingredients'),
      ]);

      if (poRes.success) setPurchases(poRes.purchases);
      if (supRes.success) setSuppliers(supRes.suppliers);
      if (ingRes.success) setIngredients(ingRes.ingredients);
    } catch (err) {
      toast.error('Failed to load purchases data');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddItemRow = () => {
    setPurchaseItems([
      ...purchaseItems,
      { ingredientId: ingredients[0]?._id || '', quantity: 10, unitCost: 100 },
    ]);
  };

  const handleRemoveItemRow = (idx) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, val) => {
    const updated = [...purchaseItems];
    updated[idx][field] = val;
    setPurchaseItems(updated);
  };

  const handleCreatePurchase = async (e) => {
    e.preventDefault();
    if (!selectedSupplierId || purchaseItems.length === 0) {
      toast.warning('Please select a supplier and add at least one line item.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/purchases', {
        supplierId: selectedSupplierId,
        branchId: activeBranch?._id,
        invoiceNumber,
        items: purchaseItems.map((i) => ({
          ingredientId: i.ingredientId,
          quantity: Number(i.quantity),
          unitCost: Number(i.unitCost),
        })),
      });

      if (res.success) {
        toast.success('Purchase Order created in Draft!');
        setModalOpen(false);
        loadData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create purchase order');
    } finally {
      setSaving(false);
    }
  };

  // Receive stock into inventory
  const handleReceivePurchase = async (poId) => {
    if (!window.confirm('Receive goods and update inventory levels?')) return;
    try {
      const res = await api.post(`/purchases/${poId}/receive`);
      if (res.success) {
        toast.success(res.message);
        loadData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to receive purchase order');
    }
  };

  const currencySymbol = restaurant?.currencySymbol || 'Rs.';

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-ivory-300 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-forest-950 flex items-center gap-2">
            <Truck className="w-6 h-6 text-forest-800" />
            <span>Purchase Orders & Receiving</span>
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Procure raw ingredients, receive supplier shipments, and auto-update inventory balances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={loadData} icon={RefreshCw}>
            Refresh
          </Button>

          {isAdmin && (
            <Button
              size="sm"
              icon={Plus}
              onClick={() => {
                setSelectedSupplierId(suppliers[0]?._id || '');
                setInvoiceNumber('');
                setPurchaseItems([
                  { ingredientId: ingredients[0]?._id || '', quantity: 10, unitCost: 100 },
                ]);
                setModalOpen(true);
              }}
            >
              New Purchase Order
            </Button>
          )}
        </div>
      </div>

      {/* PO Table */}
      <div className="bg-white rounded-2xl border border-ivory-300 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading purchase records..." />
        ) : purchases.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No purchase orders"
            description="Create purchase orders to restock ingredients from suppliers."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory-100/80 border-b border-ivory-300 text-charcoal-600 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">PO Number</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Items Count</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200">
                {purchases.map((po) => (
                  <tr key={po._id} className="hover:bg-ivory-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-forest-950">
                      {po.purchaseOrderNumber}
                      {po.invoiceNumber && (
                        <span className="block text-[10px] text-charcoal-400">
                          Inv: {po.invoiceNumber}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-charcoal-600">
                      {new Date(po.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-charcoal-800">
                      {po.supplierId?.name || 'Supplier'}
                    </td>
                    <td className="px-4 py-3.5 text-charcoal-600">
                      {po.items?.length || 0} Ingredients
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-forest-900">
                      {currencySymbol} {po.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={po.status === 'received' ? 'success' : 'warning'} size="sm">
                        {po.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {po.status !== 'received' ? (
                        <Button
                          size="sm"
                          icon={PackageCheck}
                          onClick={() => handleReceivePurchase(po._id)}
                        >
                          Receive Stock
                        </Button>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-bold">
                          Stock Updated
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Purchase Order Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Purchase Order"
        maxWidth="max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePurchase} loading={saving}>
              Create PO
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreatePurchase} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
                Supplier
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full rounded-xl border border-ivory-400 p-2.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-forest-600"
                required
              >
                <option value="">Select Supplier...</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Supplier Invoice # (Optional)"
              placeholder="e.g. INV-90481"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700">
                Purchased Ingredients
              </label>
              <Button size="sm" variant="secondary" onClick={handleAddItemRow} icon={Plus}>
                Add Item
              </Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {purchaseItems.map((row, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-xl bg-ivory-100 border border-ivory-300 text-xs"
                >
                  <select
                    value={row.ingredientId}
                    onChange={(e) => handleItemChange(idx, 'ingredientId', e.target.value)}
                    className="flex-1 rounded-lg border border-ivory-400 p-1.5 bg-white"
                    required
                  >
                    <option value="">Select Ingredient...</option>
                    {ingredients.map((ing) => (
                      <option key={ing._id} value={ing._id}>
                        {ing.name} ({ing.unit})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    step="0.1"
                    placeholder="Qty"
                    value={row.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    className="w-20 rounded-lg border border-ivory-400 p-1.5 bg-white font-mono"
                    required
                  />

                  <input
                    type="number"
                    placeholder="Cost"
                    value={row.unitCost}
                    onChange={(e) => handleItemChange(idx, 'unitCost', e.target.value)}
                    className="w-24 rounded-lg border border-ivory-400 p-1.5 bg-white font-mono"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveItemRow(idx)}
                    className="p-1 text-rose-600 hover:text-rose-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
