import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Receipt,
  MapPin,
  Save,
  Plus,
  Wifi,
  DollarSign,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';

export const RestaurantSettings = () => {
  const { restaurant, branches, refreshAuth } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    type: 'casual_dining',
    currency: 'PKR',
    currencySymbol: 'Rs.',
    taxRate: 16,
    taxName: 'PRA GST',
    taxNumber: '',
    serviceChargeRate: 5,
    receiptSettings: {
      headerText: 'Thank you for dining with us!',
      footerText: 'Please visit us again soon.',
      showTaxNumber: true,
      showWifiDetails: true,
      wifiDetails: 'SSID: LahoreGrill_Guest | Pass: grill2026',
      paperSize: '80mm',
    },
  });

  // Branch Modal
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [branchForm, setBranchForm] = useState({
    name: '',
    code: '',
    address: '',
    city: 'Lahore',
    phone: '',
  });

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        tagline: restaurant.tagline || '',
        type: restaurant.type || 'casual_dining',
        currency: restaurant.currency || 'PKR',
        currencySymbol: restaurant.currencySymbol || 'Rs.',
        taxRate: restaurant.taxRate || 16,
        taxName: restaurant.taxName || 'PRA GST',
        taxNumber: restaurant.taxNumber || '',
        serviceChargeRate: restaurant.serviceChargeRate || 0,
        receiptSettings: {
          headerText: restaurant.receiptSettings?.headerText || 'Thank you for dining with us!',
          footerText: restaurant.receiptSettings?.footerText || 'Please visit us again soon.',
          showTaxNumber: Boolean(restaurant.receiptSettings?.showTaxNumber),
          showWifiDetails: Boolean(restaurant.receiptSettings?.showWifiDetails),
          wifiDetails: restaurant.receiptSettings?.wifiDetails || '',
          paperSize: restaurant.receiptSettings?.paperSize || '80mm',
        },
      });
    }
  }, [restaurant]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/restaurants/settings', formData);
      if (res.success) {
        toast.success('Restaurant settings saved successfully!');
        refreshAuth();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    if (!branchForm.name || !branchForm.code || !branchForm.address) {
      toast.warning('Please fill in branch name, code, and address');
      return;
    }

    try {
      const res = await api.post('/branches', branchForm);
      if (res.success) {
        toast.success('New branch created successfully!');
        setBranchModalOpen(false);
        setBranchForm({ name: '', code: '', address: '', city: 'Lahore', phone: '' });
        refreshAuth();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create branch');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-ivory-300 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-forest-950 flex items-center gap-2">
            <Settings className="w-6 h-6 text-forest-800" />
            <span>Restaurant Identity & Configuration</span>
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Configure regional taxes, billing formulas, currency, thermal receipt layout, and branches.
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleSaveSettings}
          loading={saving}
          icon={Save}
        >
          Save Changes
        </Button>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Business Identity */}
        <Card
          header={
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-forest-800" />
              <h3 className="text-sm font-bold font-heading text-forest-950">
                Brand & Business Information
              </h3>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Restaurant Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
                  Restaurant Concept / Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full rounded-xl border border-ivory-400 p-2.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-forest-600"
                >
                  <option value="casual_dining">Casual Dining Restaurant</option>
                  <option value="cafe">Cafe / Bakery</option>
                  <option value="fast_food">Fast Food Restaurant</option>
                  <option value="fine_dining">Fine Dining Restaurant</option>
                  <option value="takeaway">Takeaway & Fast Casual</option>
                </select>
              </div>
            </div>

            <Input
              label="Tagline / Slogan"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
            />
          </div>
        </Card>

        {/* Currency & Taxes */}
        <Card
          header={
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-forest-800" />
              <h3 className="text-sm font-bold font-heading text-forest-950">
                Currency, Tax & Service Charge (Pakistan / Regional)
              </h3>
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="Default Currency"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              required
            />

            <Input
              label="Currency Symbol"
              value={formData.currencySymbol}
              onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
              required
            />

            <Input
              label="GST Tax Rate (%)"
              type="number"
              step="0.1"
              value={formData.taxRate}
              onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
              required
            />

            <Input
              label="Service Charge Rate (%)"
              type="number"
              step="0.1"
              value={formData.serviceChargeRate}
              onChange={(e) => setFormData({ ...formData, serviceChargeRate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Input
              label="Tax Label Name"
              placeholder="e.g. PRA GST (16%)"
              value={formData.taxName}
              onChange={(e) => setFormData({ ...formData, taxName: e.target.value })}
            />
            <Input
              label="NTN / STRN / FBR POS Registration #"
              placeholder="e.g. NTN-7392810-4"
              value={formData.taxNumber}
              onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
            />
          </div>
        </Card>

        {/* Thermal Receipt Settings */}
        <Card
          header={
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-forest-800" />
              <h3 className="text-sm font-bold font-heading text-forest-950">
                Thermal POS Receipt Template (80mm / 58mm)
              </h3>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Receipt Header Welcome Text"
                value={formData.receiptSettings.headerText}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    receiptSettings: { ...formData.receiptSettings, headerText: e.target.value },
                  })
                }
              />

              <Input
                label="Receipt Footer Farewell Text"
                value={formData.receiptSettings.footerText}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    receiptSettings: { ...formData.receiptSettings, footerText: e.target.value },
                  })
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Guest WiFi Details to Print on Bill"
                value={formData.receiptSettings.wifiDetails}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    receiptSettings: { ...formData.receiptSettings, wifiDetails: e.target.value },
                  })
                }
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
                  Thermal Paper Width
                </label>
                <select
                  value={formData.receiptSettings.paperSize}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      receiptSettings: { ...formData.receiptSettings, paperSize: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-ivory-400 p-2.5 text-xs bg-white"
                >
                  <option value="80mm">Standard 80mm Wide Thermal Roll</option>
                  <option value="58mm">Compact 58mm Mini Thermal Roll</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Branch Management */}
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-forest-800" />
                <h3 className="text-sm font-bold font-heading text-forest-950">
                  Restaurant Branches ({branches.length})
                </h3>
              </div>
              <Button
                size="sm"
                type="button"
                variant="secondary"
                icon={Plus}
                onClick={() => setBranchModalOpen(true)}
              >
                Add Branch
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {branches.map((b) => (
              <div
                key={b._id}
                className="p-3.5 rounded-xl border border-ivory-300 bg-ivory-50/50 flex items-start justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-forest-950 flex items-center gap-1.5">
                    <span>{b.name}</span>
                    {b.isMain && (
                      <span className="text-[10px] bg-forest-100 text-forest-800 font-semibold px-1.5 py-0.5 rounded">
                        Main
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-charcoal-500 mt-1">{b.address}, {b.city}</div>
                  <div className="text-[11px] text-charcoal-500">Tel: {b.phone}</div>
                </div>
                <span className="font-mono text-xs font-bold text-forest-800 bg-ivory-200 px-2 py-0.5 rounded-lg border border-ivory-300">
                  {b.code}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </form>

      {/* Add Branch Modal */}
      <Modal
        isOpen={branchModalOpen}
        onClose={() => setBranchModalOpen(false)}
        title="Add New Branch Location"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setBranchModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBranch}>Create Branch</Button>
          </div>
        }
      >
        <form onSubmit={handleCreateBranch} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Branch Name"
              placeholder="e.g. DHA Phase 5 Branch"
              value={branchForm.name}
              onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
              required
            />
            <Input
              label="Branch Code"
              placeholder="e.g. DHA-02"
              value={branchForm.code}
              onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
              required
            />
          </div>

          <Input
            label="Street Address"
            placeholder="e.g. Sector C, Commercial Area, DHA Phase 5"
            value={branchForm.address}
            onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              value={branchForm.city}
              onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
              required
            />
            <Input
              label="Phone Number"
              placeholder="042-35789002"
              value={branchForm.phone}
              onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
