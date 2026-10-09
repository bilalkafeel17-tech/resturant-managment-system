import React, { useState, useEffect, useCallback } from 'react';
import { Search, ShoppingBag, Plus, RefreshCw } from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { CategoryFilter } from '../../components/pos/CategoryFilter.jsx';
import { MenuItemCard } from '../../components/pos/MenuItemCard.jsx';
import { ItemCustomizerModal } from '../../components/pos/ItemCustomizerModal.jsx';
import { CartDrawer } from '../../components/pos/CartDrawer.jsx';
import { PaymentModal } from '../../components/pos/PaymentModal.jsx';
import { ThermalReceiptModal } from '../../components/pos/ThermalReceiptModal.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';

export const POS = () => {
  const { restaurant, activeBranch } = useAuth();
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Cart State
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('dine_in');
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [discount, setDiscount] = useState({ type: 'none', value: 0 });
  const [notes, setNotes] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Modals State
  const [customizerItem, setCustomizerItem] = useState(null);
  const [activePaymentOrder, setActivePaymentOrder] = useState(null);
  const [receiptData, setReceiptData] = useState({ order: null, payment: null });

  // Fetch Menu, Categories & Tables
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, itemRes, tableRes] = await Promise.all([
        api.get('/categories'),
        api.get('/menu-items'),
        api.get('/tables'),
      ]);

      if (catRes.success) setCategories(catRes.categories);
      if (itemRes.success) setMenuItems(itemRes.items);
      if (tableRes.success) setTables(tableRes.tables);
    } catch (err) {
      toast.error('Failed to load menu data');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();

    const handleBranchChange = () => loadData();
    window.addEventListener('branch-changed', handleBranchChange);
    return () => window.removeEventListener('branch-changed', handleBranchChange);
  }, [loadData]);

  // Handle Add to Cart
  const handleItemClick = (item) => {
    const hasVariants = item.variants && item.variants.length > 0;
    const hasAddOns = item.addOns && item.addOns.length > 0;

    if (hasVariants || hasAddOns) {
      setCustomizerItem(item);
    } else {
      // Add standard item directly
      const existingIdx = cart.findIndex(
        (c) => c.item._id === item._id && !c.variant && (!c.addOns || c.addOns.length === 0)
      );

      if (existingIdx >= 0) {
        const updated = [...cart];
        updated[existingIdx].quantity += 1;
        setCart(updated);
      } else {
        setCart([
          ...cart,
          {
            item,
            variant: null,
            addOns: [],
            quantity: 1,
            unitPrice: item.basePrice,
            totalPrice: item.basePrice,
            notes: '',
          },
        ]);
      }
      toast.success(`Added ${item.name} to cart`);
    }
  };

  const handleCustomizerConfirm = (customized) => {
    setCart([...cart, customized]);
    toast.success(`Added ${customized.item.name} (${customized.variant?.name || 'Custom'}) to cart`);
  };

  const handleUpdateQuantity = (idx, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(idx);
      return;
    }
    const updated = [...cart];
    updated[idx].quantity = newQty;
    setCart(updated);
  };

  const handleRemoveItem = (idx) => {
    setCart(cart.filter((_, i) => i !== idx));
  };

  const handleClearCart = () => {
    setCart([]);
    setDiscount({ type: 'none', value: 0 });
    setSelectedTableId(null);
    setCustomerInfo({ name: '', phone: '' });
  };

  // Checkout and Create Order
  const handleCheckout = async (financials) => {
    if (cart.length === 0) {
      toast.warning('Cart is empty.');
      return;
    }

    if (orderType === 'dine_in' && !selectedTableId) {
      toast.warning('Please select a dining table for Dine-In orders.');
      return;
    }

    setSubmittingOrder(true);
    try {
      const payload = {
        orderType,
        tableId: orderType === 'dine_in' ? selectedTableId : null,
        customerInfo: {
          name: customerInfo.name || (orderType === 'dine_in' ? 'Dine-in Guest' : 'Walk-in Guest'),
          phone: customerInfo.phone || '',
        },
        items: cart.map((c) => ({
          menuItemId: c.item._id,
          quantity: c.quantity,
          variantName: c.variant?.name || '',
          addOns: c.addOns || [],
          notes: c.notes || '',
        })),
        discountType: discount.type,
        discountValue: discount.value,
        notes,
      };

      const res = await api.post('/orders', payload);
      if (res.success) {
        setActivePaymentOrder(res.order);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create order');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Payment Completed Handler
  const handlePaymentSuccess = (order, payment) => {
    setReceiptData({ order, payment });
    handleClearCart();
    loadData(); // refresh table statuses
  };

  // Filter items
  const filteredItems = menuItems.filter((item) => {
    const matchCategory = selectedCategory ? item.categoryId?._id === selectedCategory || item.categoryId === selectedCategory : true;
    const matchSearch = searchQuery
      ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchCategory && matchSearch;
  });

  const currencySymbol = restaurant?.currencySymbol || 'Rs.';

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-6 animate-fade-in">
      {/* Left Area: Menu Browser */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-ivory-300 p-4 shadow-xs overflow-hidden">
        {/* Search and Category Filter */}
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400" />
            <input
              type="text"
              placeholder="Search dishes, karahis, burgers, drinks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-ivory-400 bg-ivory-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-100 focus:border-forest-700"
            />
          </div>

          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>

        {/* Menu Items Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <LoadingSpinner label="Loading menu items..." />
          ) : filteredItems.length === 0 ? (
            <EmptyState
              title="No menu items matched"
              description="Try adjusting your category filter or search query."
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredItems.map((item) => (
                <MenuItemCard
                  key={item._id}
                  item={item}
                  currencySymbol={currencySymbol}
                  onAddToCart={handleItemClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Area: Cart Drawer */}
      <div className="w-full lg:w-96 flex-shrink-0 h-full">
        <CartDrawer
          cart={cart}
          tables={tables}
          orderType={orderType}
          setOrderType={setOrderType}
          selectedTableId={selectedTableId}
          setSelectedTableId={setSelectedTableId}
          customerInfo={customerInfo}
          setCustomerInfo={setCustomerInfo}
          discount={discount}
          setDiscount={setDiscount}
          notes={notes}
          setNotes={setNotes}
          currencySymbol={currencySymbol}
          taxRate={restaurant?.taxRate || 16}
          serviceChargeRate={restaurant?.serviceChargeRate || 5}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onCheckout={handleCheckout}
          loading={submittingOrder}
        />
      </div>

      {/* Item Customizer Modal */}
      <ItemCustomizerModal
        isOpen={!!customizerItem}
        onClose={() => setCustomizerItem(null)}
        item={customizerItem}
        currencySymbol={currencySymbol}
        onConfirm={handleCustomizerConfirm}
      />

      {/* Payment Settlement Modal */}
      <PaymentModal
        isOpen={!!activePaymentOrder}
        onClose={() => setActivePaymentOrder(null)}
        orderData={activePaymentOrder}
        currencySymbol={currencySymbol}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Thermal Printable Receipt Modal */}
      <ThermalReceiptModal
        isOpen={!!receiptData.order}
        onClose={() => setReceiptData({ order: null, payment: null })}
        order={receiptData.order}
        payment={receiptData.payment}
      />
    </div>
  );
};
