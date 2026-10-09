import React, { useState } from 'react';
import { Minus, Plus, Check } from 'lucide-react';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';

export const ItemCustomizerModal = ({
  isOpen,
  onClose,
  item,
  currencySymbol = 'Rs.',
  onConfirm,
}) => {
  if (!item) return null;

  const [selectedVariant, setSelectedVariant] = useState(
    item.variants?.find((v) => v.isDefault) || item.variants?.[0] || null
  );
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const toggleAddOn = (addOn) => {
    if (selectedAddOns.some((a) => a.name === addOn.name)) {
      setSelectedAddOns(selectedAddOns.filter((a) => a.name !== addOn.name));
    } else {
      setSelectedAddOns([...selectedAddOns, addOn]);
    }
  };

  // Calculate Unit Price
  const basePrice = item.basePrice || 0;
  const variantDelta = selectedVariant ? selectedVariant.priceDelta : 0;
  const addOnsTotal = selectedAddOns.reduce((acc, curr) => acc + curr.price, 0);
  const unitPrice = basePrice + variantDelta + addOnsTotal;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    onConfirm({
      item,
      variant: selectedVariant,
      addOns: selectedAddOns,
      quantity,
      unitPrice,
      totalPrice,
      notes,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Customize ${item.name}`}
      subtitle={`Base Price: ${currencySymbol} ${item.basePrice.toLocaleString()}`}
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="text-xs text-charcoal-500 font-medium">Total Item Amount</div>
            <div className="text-lg font-bold font-mono text-forest-950">
              {currencySymbol} {totalPrice.toLocaleString()}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleAddToCart} icon={Plus}>
              Add to Order
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Variants Selection */}
        {item.variants && item.variants.length > 0 && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-2">
              Select Portion / Size
            </label>
            <div className="grid grid-cols-2 gap-2">
              {item.variants.map((variant) => {
                const isSelected = selectedVariant?.name === variant.name;
                return (
                  <button
                    key={variant.name}
                    type="button"
                    onClick={() => setSelectedVariant(variant)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-forest-800 bg-forest-50/80 text-forest-950 font-bold shadow-xs'
                        : 'border-ivory-300 bg-white text-charcoal-800 hover:bg-ivory-100'
                    }`}
                  >
                    <div className="text-xs">
                      <div>{variant.name}</div>
                      {variant.priceDelta !== 0 && (
                        <div className="text-[10px] text-charcoal-500 font-mono mt-0.5">
                          {variant.priceDelta > 0 ? `+${currencySymbol} ${variant.priceDelta}` : `-${currencySymbol} ${Math.abs(variant.priceDelta)}`}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-forest-800" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Add-ons Selection */}
        {item.addOns && item.addOns.length > 0 && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-2">
              Extra Add-ons / Sides
            </label>
            <div className="grid grid-cols-2 gap-2">
              {item.addOns.map((addOn) => {
                const isSelected = selectedAddOns.some((a) => a.name === addOn.name);
                return (
                  <button
                    key={addOn.name}
                    type="button"
                    onClick={() => toggleAddOn(addOn)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-900 font-bold shadow-xs'
                        : 'border-ivory-300 bg-white text-charcoal-800 hover:bg-ivory-100'
                    }`}
                  >
                    <div className="text-xs">
                      <div>{addOn.name}</div>
                      <div className="text-[10px] text-charcoal-500 font-mono mt-0.5">
                        +{currencySymbol} {addOn.price}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-terracotta-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quantity Controls */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-2">
            Quantity
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-9 h-9 rounded-xl border border-ivory-300 bg-white hover:bg-ivory-100 flex items-center justify-center text-charcoal-800"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-base font-bold font-mono text-forest-950">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-9 h-9 rounded-xl border border-ivory-300 bg-white hover:bg-ivory-100 flex items-center justify-center text-charcoal-800"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Special Instructions */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
            Special Preparation Note
          </label>
          <input
            type="text"
            placeholder="e.g. Less spicy, well-done, extra raita on side"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-ivory-400 bg-white text-charcoal-900 text-xs px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-forest-100 focus:border-forest-700"
          />
        </div>
      </div>
    </Modal>
  );
};
