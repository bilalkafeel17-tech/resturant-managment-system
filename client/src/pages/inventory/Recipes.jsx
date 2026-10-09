import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollText,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  TrendingUp,
  CookingPot,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';

export const Recipes = () => {
  const { restaurant, isAdmin } = useAuth();
  const toast = useToast();

  const [recipes, setRecipes] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState('');
  const [variantName, setVariantName] = useState('');
  const [recipeIngredients, setRecipeIngredients] = useState([
    { ingredientId: '', quantity: 1, unit: 'kg' },
  ]);
  const [instructions, setInstructions] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [recRes, itemRes, ingRes] = await Promise.all([
        api.get('/recipes'),
        api.get('/menu-items'),
        api.get('/inventory/ingredients'),
      ]);

      if (recRes.success) setRecipes(recRes.recipes);
      if (itemRes.success) setMenuItems(itemRes.items);
      if (ingRes.success) setIngredients(ingRes.ingredients);
    } catch (err) {
      toast.error('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Add line to recipe
  const handleAddIngredientRow = () => {
    setRecipeIngredients([
      ...recipeIngredients,
      { ingredientId: ingredients[0]?._id || '', quantity: 1, unit: 'kg' },
    ]);
  };

  const handleRemoveIngredientRow = (idx) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== idx));
  };

  const handleIngredientChange = (idx, field, val) => {
    const updated = [...recipeIngredients];
    updated[idx][field] = val;

    // auto set unit if ingredient selected
    if (field === 'ingredientId') {
      const found = ingredients.find((i) => i._id === val);
      if (found) {
        updated[idx].unit = found.unit;
      }
    }
    setRecipeIngredients(updated);
  };

  const handleOpenEdit = (rec) => {
    setEditingRecipe(rec);
    setSelectedMenuItemId(rec.menuItemId?._id || rec.menuItemId);
    setVariantName(rec.variantName || '');
    setRecipeIngredients(
      rec.ingredients.map((i) => ({
        ingredientId: i.ingredientId?._id || i.ingredientId,
        quantity: i.quantity,
        unit: i.unit,
      }))
    );
    setInstructions(rec.instructions || '');
    setModalOpen(true);
  };

  const handleSaveRecipe = async (e) => {
    e.preventDefault();
    if (!selectedMenuItemId || recipeIngredients.length === 0) {
      toast.warning('Please select a menu item and add at least one ingredient');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        menuItemId: selectedMenuItemId,
        variantName,
        yieldQuantity: 1,
        ingredients: recipeIngredients.map((i) => ({
          ingredientId: i.ingredientId,
          quantity: Number(i.quantity),
          unit: i.unit,
        })),
        instructions,
      };

      const res = await api.post('/recipes', payload);
      if (res.success) {
        toast.success('Recipe saved successfully!');
        setModalOpen(false);
        loadData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save recipe');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecipe = async (id) => {
    if (!window.confirm('Delete this recipe?')) return;
    try {
      const res = await api.delete(`/recipes/${id}`);
      if (res.success) {
        toast.success('Recipe deleted');
        loadData();
      }
    } catch (err) {
      toast.error('Failed to delete recipe');
    }
  };

  const currencySymbol = restaurant?.currencySymbol || 'Rs.';

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-ivory-300 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-forest-950 flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-forest-800" />
            <span>Recipe Book & Portion Deductions</span>
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Define ingredient Bill of Materials (BOM) to automatically deduct stock on every order.
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
                setEditingRecipe(null);
                setSelectedMenuItemId(menuItems[0]?._id || '');
                setVariantName('');
                setRecipeIngredients([
                  { ingredientId: ingredients[0]?._id || '', quantity: 0.5, unit: 'kg' },
                ]);
                setInstructions('');
                setModalOpen(true);
              }}
            >
              Add Recipe
            </Button>
          )}
        </div>
      </div>

      {/* Recipes List Grid */}
      {loading ? (
        <LoadingSpinner label="Loading recipe book..." />
      ) : recipes.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No recipes defined"
          description="Create recipes for your menu items to enable automated stock tracking."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {recipes.map((recipe) => {
            const menuItem = recipe.menuItemId;
            const portionCost = recipe.ingredients.reduce((acc, curr) => {
              const cost = curr.ingredientId?.costPerUnit || 0;
              return acc + cost * curr.quantity;
            }, 0);

            const sellingPrice = menuItem?.basePrice || 0;
            const grossMargin =
              sellingPrice > 0 ? (((sellingPrice - portionCost) / sellingPrice) * 100).toFixed(1) : 0;

            return (
              <div
                key={recipe._id}
                className="bg-white rounded-2xl border border-ivory-300 shadow-xs p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-ivory-200">
                    <div>
                      <h3 className="font-heading font-bold text-sm text-forest-950">
                        {menuItem?.name || 'Unknown Menu Item'}
                      </h3>
                      {recipe.variantName && (
                        <span className="text-[10px] font-semibold text-terracotta-600">
                          Applies to: {recipe.variantName}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(recipe)}
                        className="p-1.5 text-charcoal-500 hover:text-forest-900 rounded-lg hover:bg-ivory-100"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRecipe(recipe._id)}
                        className="p-1.5 text-rose-500 hover:text-rose-800 rounded-lg hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Financial KPI Row */}
                  <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-xl bg-ivory-100 border border-ivory-200 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-charcoal-500 block font-sans">Portion Cost</span>
                      <span className="font-bold text-forest-950">
                        {currencySymbol} {portionCost.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-charcoal-500 block font-sans">Margin</span>
                      <span className="font-bold text-emerald-700">+{grossMargin}%</span>
                    </div>
                  </div>

                  {/* Ingredients List */}
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-charcoal-500 mb-1.5">
                      Ingredients Consumed (Per Portion)
                    </div>
                    <div className="space-y-1.5">
                      {recipe.ingredients.map((ing, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-ivory-50/80 border border-ivory-200"
                        >
                          <span className="font-medium text-charcoal-800">
                            {ing.ingredientId?.name || 'Ingredient'}
                          </span>
                          <span className="font-bold font-mono text-forest-900">
                            {ing.quantity} {ing.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Prep Instructions */}
                  {recipe.instructions && (
                    <div className="mt-3 text-[11px] text-charcoal-600 bg-forest-50/50 p-2 rounded-lg border border-forest-100">
                      <strong>Method:</strong> {recipe.instructions}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Recipe Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRecipe ? 'Edit Recipe BOM' : 'Create Recipe Definition'}
        maxWidth="max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRecipe} loading={saving}>
              Save Recipe
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveRecipe} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
                Target Menu Item
              </label>
              <select
                value={selectedMenuItemId}
                onChange={(e) => setSelectedMenuItemId(e.target.value)}
                className="w-full rounded-xl border border-ivory-400 p-2.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-forest-600"
                required
              >
                <option value="">Select Menu Item...</option>
                {menuItems.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({currencySymbol} {m.basePrice})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Variant / Portion Name (Optional)"
              placeholder="e.g. Half (500g) or Double Patty"
              value={variantName}
              onChange={(e) => setVariantName(e.target.value)}
            />
          </div>

          {/* Ingredient Rows */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700">
                Ingredients & Required Quantities
              </label>
              <Button size="sm" variant="secondary" onClick={handleAddIngredientRow} icon={Plus}>
                Add Row
              </Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recipeIngredients.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-ivory-100 border border-ivory-300">
                  <select
                    value={row.ingredientId}
                    onChange={(e) => handleIngredientChange(idx, 'ingredientId', e.target.value)}
                    className="flex-1 rounded-lg border border-ivory-400 p-1.5 text-xs bg-white"
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
                    step="0.001"
                    placeholder="Qty"
                    value={row.quantity}
                    onChange={(e) => handleIngredientChange(idx, 'quantity', e.target.value)}
                    className="w-20 rounded-lg border border-ivory-400 p-1.5 text-xs bg-white font-mono"
                    required
                  />

                  <span className="text-xs font-bold font-mono text-charcoal-700 w-10">
                    {row.unit}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRemoveIngredientRow(idx)}
                    className="p-1 text-rose-600 hover:text-rose-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
              Preparation Instructions
            </label>
            <textarea
              rows={2}
              placeholder="Cooking notes, simmer times, spices ratios..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full rounded-xl border border-ivory-400 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-forest-600"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
