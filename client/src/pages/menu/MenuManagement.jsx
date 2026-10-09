import React, { useState, useEffect, useCallback } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  Power,
  Search,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Flame,
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

export const MenuManagement = () => {
  const { restaurant } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'categories'
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('');

  // Item Modal State
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    categoryId: '',
    basePrice: '',
    costPrice: '',
    description: '',
    imageUrl: '',
    preparationTimeMinutes: 15,
    isFeatured: false,
    variants: [],
    addOns: [],
  });

  // Category Modal State
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catForm, setCatForm] = useState({
    name: '',
    description: '',
    iconName: 'Utensils',
    sortOrder: 0,
  });

  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, itemRes] = await Promise.all([
        api.get('/categories'),
        api.get('/menu-items'),
      ]);
      if (catRes.success) setCategories(catRes.categories);
      if (itemRes.success) setMenuItems(itemRes.items);
    } catch (err) {
      toast.error('Failed to load menu data');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fast Toggle Availability
  const handleToggleAvailability = async (item) => {
    try {
      const res = await api.patch(`/menu-items/${item._id}/toggle-availability`);
      if (res.success) {
        toast.success(res.message);
        setMenuItems((prev) =>
          prev.map((m) => (m._id === item._id ? { ...m, isAvailable: !m.isAvailable } : m))
        );
      }
    } catch (err) {
      toast.error('Failed to update availability');
    }
  };

  // Open Edit Item
  const handleOpenEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      categoryId: item.categoryId?._id || item.categoryId,
      basePrice: item.basePrice,
      costPrice: item.costPrice || 0,
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      preparationTimeMinutes: item.preparationTimeMinutes || 15,
      isFeatured: Boolean(item.isFeatured),
      variants: item.variants || [],
      addOns: item.addOns || [],
    });
    setItemModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.categoryId || !itemForm.basePrice) {
      toast.warning('Please fill in Item Name, Category, and Base Price');
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        const res = await api.put(`/menu-items/${editingItem._id}`, itemForm);
        if (res.success) {
          toast.success('Menu item updated!');
          setItemModalOpen(false);
          loadData();
        }
      } else {
        const res = await api.post('/menu-items', itemForm);
        if (res.success) {
          toast.success('Menu item created!');
          setItemModalOpen(false);
          loadData();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save menu item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      const res = await api.delete(`/menu-items/${id}`);
      if (res.success) {
        toast.success('Item deleted successfully');
        loadData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete item');
    }
  };

  // Category Save
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catForm.name) {
      toast.warning('Please enter category name');
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        const res = await api.put(`/categories/${editingCategory._id}`, catForm);
        if (res.success) {
          toast.success('Category updated!');
          setCatModalOpen(false);
          loadData();
        }
      } else {
        const res = await api.post('/categories', catForm);
        if (res.success) {
          toast.success('Category created!');
          setCatModalOpen(false);
          loadData();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const currencySymbol = restaurant?.currencySymbol || 'Rs.';

  const filteredItems = menuItems.filter((i) => {
    const matchCat = selectedCatFilter ? i.categoryId?._id === selectedCatFilter : true;
    const matchSearch = search ? i.name.toLowerCase().includes(search.toLowerCase()) : true;
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-ivory-300 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-forest-950 flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-forest-800" />
            <span>Menu & Categories Builder</span>
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Manage catalogue, portions, custom add-ons, pricing, and active stock availability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'items' ? (
            <Button
              size="sm"
              icon={Plus}
              onClick={() => {
                setEditingItem(null);
                setItemForm({
                  name: '',
                  categoryId: categories[0]?._id || '',
                  basePrice: '',
                  costPrice: '',
                  description: '',
                  imageUrl: '',
                  preparationTimeMinutes: 15,
                  isFeatured: false,
                  variants: [],
                  addOns: [],
                });
                setItemModalOpen(true);
              }}
            >
              Add Menu Item
            </Button>
          ) : (
            <Button
              size="sm"
              icon={Plus}
              onClick={() => {
                setEditingCategory(null);
                setCatForm({ name: '', description: '', iconName: 'Utensils', sortOrder: 0 });
                setCatModalOpen(true);
              }}
            >
              Add Category
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-ivory-300 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('items')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'items'
              ? 'bg-forest-900 text-white shadow-xs'
              : 'bg-white text-charcoal-700 hover:bg-ivory-200 border border-ivory-300'
          }`}
        >
          Menu Items ({menuItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'categories'
              ? 'bg-forest-900 text-white shadow-xs'
              : 'bg-white text-charcoal-700 hover:bg-ivory-200 border border-ivory-300'
          }`}
        >
          Categories ({categories.length})
        </button>
      </div>

      {/* ITEMS VIEW */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-3 rounded-2xl border border-ivory-300 shadow-xs flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
              <input
                type="text"
                placeholder="Search dish title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-ivory-400 focus:outline-none focus:ring-1 focus:ring-forest-600"
              />
            </div>

            <select
              value={selectedCatFilter}
              onChange={(e) => setSelectedCatFilter(e.target.value)}
              className="text-xs rounded-xl border border-ivory-400 px-3 py-2 bg-white text-charcoal-800"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-2xl border border-ivory-300 shadow-xs overflow-hidden">
            {loading ? (
              <LoadingSpinner label="Loading catalogue..." />
            ) : filteredItems.length === 0 ? (
              <EmptyState
                icon={UtensilsCrossed}
                title="No menu items found"
                description="Click 'Add Menu Item' above to start creating your menu."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-ivory-100/80 border-b border-ivory-300 text-charcoal-600 uppercase font-semibold text-[10px] tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Item Details</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Selling Price</th>
                      <th className="px-4 py-3">Cost Price</th>
                      <th className="px-4 py-3">Variants / Addons</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ivory-200">
                    {filteredItems.map((item) => (
                      <tr key={item._id} className="hover:bg-ivory-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-ivory-200 overflow-hidden flex-shrink-0">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-charcoal-400">
                                  <ImageIcon className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-forest-950 flex items-center gap-1.5">
                                <span>{item.name}</span>
                                {item.isFeatured && (
                                  <Sparkles className="w-3.5 h-3.5 text-terracotta-500" />
                                )}
                              </div>
                              <div className="text-[11px] text-charcoal-500 line-clamp-1 max-w-xs">
                                {item.description || 'No description'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-charcoal-700">
                          {item.categoryId?.name || 'Uncategorized'}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-forest-900">
                          {currencySymbol} {item.basePrice.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-charcoal-500">
                          {currencySymbol} {item.costPrice || 0}
                        </td>
                        <td className="px-4 py-3.5 text-[11px] text-charcoal-600">
                          {item.variants?.length > 0 && (
                            <div>{item.variants.length} Sizes/Portions</div>
                          )}
                          {item.addOns?.length > 0 && <div>{item.addOns.length} Add-ons</div>}
                          {!item.variants?.length && !item.addOns?.length && (
                            <span className="text-charcoal-400">Standard</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => handleToggleAvailability(item)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                              item.isAvailable
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                          >
                            {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-1 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenEditItem(item)}
                            className="p-1.5 rounded-lg text-charcoal-600 hover:text-forest-900 hover:bg-ivory-200 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item._id)}
                            className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CATEGORIES VIEW */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className="bg-white rounded-2xl border border-ivory-300 p-5 shadow-xs flex items-center justify-between"
            >
              <div>
                <h4 className="text-sm font-bold text-forest-950 font-heading">{cat.name}</h4>
                <p className="text-xs text-charcoal-500 mt-0.5">{cat.description || 'No description'}</p>
                <div className="mt-2 text-[11px] font-bold text-forest-800">
                  {cat.itemCount || 0} Linked Items
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(cat);
                    setCatForm({
                      name: cat.name,
                      description: cat.description || '',
                      iconName: cat.iconName || 'Utensils',
                      sortOrder: cat.sortOrder || 0,
                    });
                    setCatModalOpen(true);
                  }}
                  className="p-2 rounded-xl text-charcoal-600 hover:text-forest-900 hover:bg-ivory-200"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Menu Item Modal */}
      <Modal
        isOpen={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        title={editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
        maxWidth="max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setItemModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveItem} loading={saving}>
              {editingItem ? 'Update Item' : 'Save Item'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Item Name"
              placeholder="e.g. Mutton Desi Ghee Karahi"
              value={itemForm.name}
              onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
              required
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
                Category
              </label>
              <select
                value={itemForm.categoryId}
                onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                className="w-full rounded-xl border border-ivory-400 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-forest-100"
                required
              >
                <option value="">Select Category...</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label={`Selling Price (${currencySymbol})`}
              type="number"
              placeholder="1950"
              value={itemForm.basePrice}
              onChange={(e) => setItemForm({ ...itemForm, basePrice: e.target.value })}
              required
            />
            <Input
              label={`Cost Price (${currencySymbol})`}
              type="number"
              placeholder="1100"
              value={itemForm.costPrice}
              onChange={(e) => setItemForm({ ...itemForm, costPrice: e.target.value })}
            />
            <Input
              label="Prep Time (Mins)"
              type="number"
              value={itemForm.preparationTimeMinutes}
              onChange={(e) =>
                setItemForm({ ...itemForm, preparationTimeMinutes: e.target.value })
              }
            />
          </div>

          <Input
            label="Image URL"
            placeholder="https://images.unsplash.com/..."
            value={itemForm.imageUrl}
            onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Detailed culinary ingredients and flavors..."
              value={itemForm.description}
              onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              className="w-full rounded-xl border border-ivory-400 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-forest-100"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isFeatured"
              checked={itemForm.isFeatured}
              onChange={(e) => setItemForm({ ...itemForm, isFeatured: e.target.checked })}
              className="w-4 h-4 rounded text-forest-800 focus:ring-forest-500"
            />
            <label htmlFor="isFeatured" className="text-xs font-semibold text-charcoal-800">
              Highlight as Chef's Special / Featured Item on POS
            </label>
          </div>
        </form>
      </Modal>

      {/* Category Modal */}
      <Modal
        isOpen={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCatModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategory} loading={saving}>
              Save Category
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <Input
            label="Category Name"
            placeholder="e.g. Desi Karahi & Handi"
            value={catForm.name}
            onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
            required
          />
          <Input
            label="Description"
            placeholder="e.g. Traditional slow-cooked specialties"
            value={catForm.description}
            onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
};
