import React, { useState, useEffect, useCallback } from 'react';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  SlidersHorizontal,
  History,
  TrendingDown,
  RefreshCw,
  Download,
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

export const Inventory = () => {
  const { restaurant, activeBranch, isAdmin } = useAuth();
  const toast = useToast();

  const [ingredients, setIngredients] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [adjustModalItem, setAdjustModalItem] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const [addForm, setAddForm] = useState({
    name: '',
    category: 'Meat',
    unit: 'kg',
    currentStock: 0,
    minStockAlert: 5,
    costPerUnit: 0,
  });

  const [adjustForm, setAdjustForm] = useState({
    quantityChange: 0,
    movementType: 'manual_adjustment',
    reason: '',
  });

  const [saving, setSaving] = useState(false);

  const loadIngredients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      if (lowStockOnly) params.append('lowStockOnly', 'true');

      const res = await api.get(`/inventory/ingredients?${params.toString()}`);
      if (res.success) {
        setIngredients(res.ingredients);
      }
    } catch (err) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, lowStockOnly, toast]);

  useEffect(() => {
    loadIngredients();
  }, [loadIngredients]);

  const loadMovements = async () => {
    try {
      const res = await api.get('/inventory/movements');
      if (res.success) {
        setMovements(res.movements);
        setHistoryModalOpen(true);
      }
    } catch (err) {
      toast.error('Failed to load stock movements');
    }
  };

  const handleAddIngredient = async (e) => {
    e.preventDefault();
    if (!addForm.name) {
      toast.warning('Ingredient name is required');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/inventory/ingredients', {
        ...addForm,
        branchId: activeBranch?._id,
      });

      if (res.success) {
        toast.success('Ingredient added to stock!');
        setAddModalOpen(false);
        setAddForm({
          name: '',
          category: 'Meat',
          unit: 'kg',
          currentStock: 0,
          minStockAlert: 5,
          costPerUnit: 0,
        });
        loadIngredients();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to add ingredient');
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!adjustModalItem) return;

    setSaving(true);
    try {
      const res = await api.post(`/inventory/ingredients/${adjustModalItem._id}/adjust`, adjustForm);
      if (res.success) {
        toast.success('Stock adjusted successfully!');
        setAdjustModalItem(null);
        setAdjustForm({ quantityChange: 0, movementType: 'manual_adjustment', reason: '' });
        loadIngredients();
      }
    } catch (err) {
      toast.error(err.message || 'Stock adjustment failed');
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    window.open(`${import.meta.env.VITE_API_URL || '/api'}/reports/export/inventory.csv`, '_blank');
  };

  const categories = [...new Set(ingredients.map((i) => i.category))];
  const currencySymbol = restaurant?.currencySymbol || 'Rs.';

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-ivory-300 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-forest-950 flex items-center gap-2">
            <Boxes className="w-6 h-6 text-forest-800" />
            <span>Inventory & Stock Management</span>
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Track live ingredient levels, portion units, threshold alerts, and movement logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={loadMovements} icon={History}>
            Movement Audit Log
          </Button>

          <Button size="sm" variant="secondary" onClick={handleExportCSV} icon={Download}>
            Export CSV
          </Button>

          {isAdmin && (
            <Button size="sm" icon={Plus} onClick={() => setAddModalOpen(true)}>
              Add Ingredient
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-ivory-300 shadow-xs flex flex-col sm:flex-row items-center gap-3 text-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
          <input
            type="text"
            placeholder="Search ingredient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-ivory-400 focus:outline-none focus:ring-1 focus:ring-forest-600"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full sm:w-48 rounded-xl border border-ivory-400 px-3 py-2 bg-white text-charcoal-800 focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={`px-3.5 py-2 rounded-xl border font-bold flex items-center gap-1.5 transition-colors ${
            lowStockOnly
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-white text-charcoal-700 border-ivory-300 hover:bg-ivory-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Low Stock Only</span>
        </button>
      </div>

      {/* Ingredients Table */}
      <div className="bg-white rounded-2xl border border-ivory-300 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading ingredient inventory..." />
        ) : ingredients.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title="No inventory items found"
            description="Add ingredients to enable automatic recipe deductions."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory-100/80 border-b border-ivory-300 text-charcoal-600 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Ingredient</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Current Stock</th>
                  <th className="px-4 py-3">Alert Threshold</th>
                  <th className="px-4 py-3">Cost / Unit</th>
                  <th className="px-4 py-3">Stock Valuation</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200">
                {ingredients.map((ing) => {
                  const isLow = ing.currentStock <= ing.minStockAlert;
                  const valuation = (ing.currentStock * (ing.costPerUnit || 0)).toFixed(2);

                  return (
                    <tr
                      key={ing._id}
                      className={`hover:bg-ivory-50/60 transition-colors ${
                        isLow ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5 font-bold text-forest-950">
                        {ing.name}
                        {ing.sku && (
                          <span className="block text-[10px] text-charcoal-400 font-mono">
                            SKU: {ing.sku}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-charcoal-700 font-medium">
                        {ing.category}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-forest-950">
                        {ing.currentStock} {ing.unit}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-charcoal-600">
                        {ing.minStockAlert} {ing.unit}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-charcoal-700">
                        {currencySymbol} {ing.costPerUnit || 0}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-forest-900">
                        {currencySymbol} {Number(valuation).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={isLow ? 'warning' : 'success'} size="sm">
                          {isLow ? 'LOW STOCK' : 'IN STOCK'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setAdjustModalItem(ing);
                            setAdjustForm({
                              quantityChange: 0,
                              movementType: 'manual_adjustment',
                              reason: '',
                            });
                          }}
                        >
                          Adjust Stock
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Ingredient Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New Inventory Ingredient"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddIngredient} loading={saving}>
              Add Ingredient
            </Button>
          </div>
        }
      >
        <form onSubmit={handleAddIngredient} className="space-y-4">
          <Input
            label="Ingredient Name"
            placeholder="e.g. Fresh Chicken Boneless"
            value={addForm.name}
            onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
                Category
              </label>
              <select
                value={addForm.category}
                onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                className="w-full rounded-xl border border-ivory-400 p-2.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-forest-600"
              >
                <option value="Meat">Meat & Poultry</option>
                <option value="Dairy">Dairy & Ghee</option>
                <option value="Produce">Produce & Vegetables</option>
                <option value="Grains">Grains & Spices</option>
                <option value="Bakery">Bakery & Buns</option>
                <option value="Beverages">Beverages & Syrups</option>
                <option value="Packaging">Packaging & Disposables</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
                Unit of Measurement
              </label>
              <select
                value={addForm.unit}
                onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
                className="w-full rounded-xl border border-ivory-400 p-2.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-forest-600"
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="g">Grams (g)</option>
                <option value="ltr">Liters (ltr)</option>
                <option value="ml">Milliliters (ml)</option>
                <option value="pcs">Pieces (pcs)</option>
                <option value="pack">Pack</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Opening Stock"
              type="number"
              step="0.01"
              value={addForm.currentStock}
              onChange={(e) => setAddForm({ ...addForm, currentStock: e.target.value })}
            />
            <Input
              label="Min Alert Level"
              type="number"
              step="0.01"
              value={addForm.minStockAlert}
              onChange={(e) => setAddForm({ ...addForm, minStockAlert: e.target.value })}
            />
            <Input
              label={`Cost / Unit (${currencySymbol})`}
              type="number"
              value={addForm.costPerUnit}
              onChange={(e) => setAddForm({ ...addForm, costPerUnit: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Adjust Stock Modal */}
      {adjustModalItem && (
        <Modal
          isOpen={!!adjustModalItem}
          onClose={() => setAdjustModalItem(null)}
          title={`Adjust Stock — ${adjustModalItem.name}`}
          subtitle={`Current Stock: ${adjustModalItem.currentStock} ${adjustModalItem.unit}`}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setAdjustModalItem(null)}>
                Cancel
              </Button>
              <Button onClick={handleAdjustStock} loading={saving}>
                Apply Adjustment
              </Button>
            </div>
          }
        >
          <form onSubmit={handleAdjustStock} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
                Adjustment Type
              </label>
              <select
                value={adjustForm.movementType}
                onChange={(e) => setAdjustForm({ ...adjustForm, movementType: e.target.value })}
                className="w-full rounded-xl border border-ivory-400 p-2.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-forest-600"
              >
                <option value="manual_adjustment">Manual Count Correction (+ or -)</option>
                <option value="waste">Spoilage / Kitchen Waste (-)</option>
                <option value="purchase">Direct Purchase Restock (+)</option>
                <option value="return">Supplier Return (-)</option>
              </select>
            </div>

            <Input
              label={`Quantity Change (${adjustModalItem.unit}) — use negative to subtract`}
              type="number"
              step="0.01"
              placeholder="e.g. +10 or -2.5"
              value={adjustForm.quantityChange}
              onChange={(e) => setAdjustForm({ ...adjustForm, quantityChange: e.target.value })}
              required
              autoFocus
            />

            <Input
              label="Reason / Audit Note"
              placeholder="e.g. Weekly physical inventory count correction"
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              required
            />
          </form>
        </Modal>
      )}

      {/* Movement Audit Log Modal */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title="Stock Movement Audit History"
        subtitle="Chronological log of recipe consumption, adjustments, and purchases."
        maxWidth="max-w-4xl"
      >
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="w-full text-left text-xs">
            <thead className="bg-ivory-100 border-b border-ivory-300 text-charcoal-600 uppercase font-semibold text-[10px]">
              <tr>
                <th className="px-4 py-2.5">Date & Time</th>
                <th className="px-4 py-2.5">Ingredient</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Change</th>
                <th className="px-4 py-2.5">Balance</th>
                <th className="px-4 py-2.5">Reason / Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-200 font-mono">
              {movements.map((m) => (
                <tr key={m._id} className="hover:bg-ivory-50 text-[11px]">
                  <td className="px-4 py-2 text-charcoal-500 font-sans">
                    {new Date(m.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 font-bold font-sans text-forest-950">
                    {m.ingredientName}
                  </td>
                  <td className="px-4 py-2 capitalize font-sans">
                    <Badge size="sm">{m.movementType.replace('_', ' ')}</Badge>
                  </td>
                  <td className={`px-4 py-2 font-bold ${m.quantityChange > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange} {m.unit}
                  </td>
                  <td className="px-4 py-2 text-charcoal-800">
                    {m.newStock} {m.unit}
                  </td>
                  <td className="px-4 py-2 text-charcoal-600 font-sans truncate max-w-xs">
                    {m.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
};
