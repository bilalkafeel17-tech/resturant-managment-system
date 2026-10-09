import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, MapPin, User, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';

export const RegisterRestaurant = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { registerRestaurant } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    restaurantName: '',
    restaurantType: 'casual_dining',
    currency: 'PKR',
    taxRate: '16',
    branchName: 'Main Branch',
    branchAddress: '',
    branchCity: 'Lahore',
    branchPhone: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    adminPhone: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.restaurantName) {
        toast.warning('Please enter your restaurant name.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.branchAddress || !formData.branchPhone) {
        toast.warning('Please enter branch address and phone number.');
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.adminName || !formData.adminEmail || !formData.adminPassword) {
      toast.warning('Please complete all admin account fields.');
      return;
    }

    setLoading(true);
    try {
      await registerRestaurant(formData);
      toast.success('Restaurant and workspace created successfully!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-forest-900 flex items-center justify-center border border-forest-800 shadow-xl">
            <span className="font-heading font-extrabold text-xl text-terracotta-400">S</span>
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold font-heading text-forest-950">
          Setup Your Restaurant
        </h2>
        <p className="mt-1 text-center text-xs text-charcoal-600">
          Step {step} of 3: {step === 1 ? 'Business Identity' : step === 2 ? 'Primary Branch' : 'Owner Account'}
        </p>

        {/* Progress Bar */}
        <div className="mt-4 flex gap-2">
          <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-forest-800' : 'bg-ivory-300'}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-forest-800' : 'bg-ivory-300'}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-forest-800' : 'bg-ivory-300'}`} />
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-ivory-300 shadow-xl">
          <form onSubmit={step === 3 ? handleSubmit : handleNext} className="space-y-4">
            {/* Step 1: Restaurant Info */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <Input
                  label="Restaurant Name"
                  name="restaurantName"
                  placeholder="e.g. Bukhara Charcoal & Handi"
                  value={formData.restaurantName}
                  onChange={handleChange}
                  icon={Building2}
                  required
                />

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
                    Restaurant Type
                  </label>
                  <select
                    name="restaurantType"
                    value={formData.restaurantType}
                    onChange={handleChange}
                    className="block w-full rounded-xl border border-ivory-400 bg-white text-charcoal-900 text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-forest-100 focus:border-forest-700"
                  >
                    <option value="casual_dining">Casual Dining Restaurant</option>
                    <option value="cafe">Cafe / Bakery</option>
                    <option value="fast_food">Fast Food Restaurant</option>
                    <option value="fine_dining">Fine Dining Restaurant</option>
                    <option value="takeaway">Takeaway / Delivery-Oriented</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                  />
                  <Input
                    label="Tax Rate (%)"
                    name="taxRate"
                    type="number"
                    value={formData.taxRate}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Branch Info */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <Input
                  label="Branch Name"
                  name="branchName"
                  placeholder="e.g. Gulberg Main Branch"
                  value={formData.branchName}
                  onChange={handleChange}
                  icon={MapPin}
                  required
                />
                <Input
                  label="Address"
                  name="branchAddress"
                  placeholder="e.g. Plot 15, Block H, Gulberg II"
                  value={formData.branchAddress}
                  onChange={handleChange}
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="City"
                    name="branchCity"
                    value={formData.branchCity}
                    onChange={handleChange}
                  />
                  <Input
                    label="Phone"
                    name="branchPhone"
                    placeholder="042-35800000"
                    value={formData.branchPhone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            {/* Step 3: Owner Admin Account */}
            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <Input
                  label="Admin Name"
                  name="adminName"
                  placeholder="e.g. Asad Malik"
                  value={formData.adminName}
                  onChange={handleChange}
                  icon={User}
                  required
                />
                <Input
                  label="Admin Email Address"
                  name="adminEmail"
                  type="email"
                  placeholder="owner@yourrestaurant.pk"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Password"
                  name="adminPassword"
                  type="password"
                  placeholder="At least 6 characters"
                  value={formData.adminPassword}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Phone (Optional)"
                  name="adminPhone"
                  placeholder="0300-1234567"
                  value={formData.adminPhone}
                  onChange={handleChange}
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-ivory-200">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setStep(step - 1)}
                  icon={ArrowLeft}
                >
                  Back
                </Button>
              ) : (
                <Link to="/login" className="text-xs text-forest-800 font-semibold hover:underline">
                  Already have an account? Sign In
                </Link>
              )}

              <Button
                type="submit"
                size="md"
                loading={loading}
                icon={step === 3 ? null : ArrowRight}
              >
                {step === 3 ? 'Launch Restaurant' : 'Next Step'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
