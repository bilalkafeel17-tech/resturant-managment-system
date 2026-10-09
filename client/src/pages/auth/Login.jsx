import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Store, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning('Please enter your email and password');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      toast.success(`Welcome back, ${res.user.name}!`);
      
      // If user is kitchen staff, route directly to kitchen display
      if (res.user.role === 'kitchen') {
        navigate('/kitchen', { replace: true });
      } else if (res.user.role === 'cashier') {
        navigate('/pos', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Account Selector for evaluator
  const fillDemoAccount = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen bg-ivory-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Warm Accents */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-forest-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-terracotta-100/50 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-forest-900 flex items-center justify-center border-2 border-forest-800 shadow-xl">
            <span className="font-heading font-extrabold text-2xl text-terracotta-400">S</span>
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold font-heading text-forest-950">
          Servora
        </h2>
        <p className="mt-1 text-center text-xs font-medium text-charcoal-600">
          Restaurant Operations, Made Simpler.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-ivory-300 shadow-xl">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. admin@lahoregrill.pk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
              required
            />

            <div className="pt-2">
              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
                icon={ArrowRight}
              >
                Sign In to Workspace
              </Button>
            </div>
          </form>

          {/* Quick Demo Logins Helper */}
          <div className="mt-6 pt-6 border-t border-ivory-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-charcoal-700 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-terracotta-500" />
              <span>One-Click Demo Credentials:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemoAccount('admin@lahoregrill.pk', 'Admin@1234')}
                className="p-2 text-left rounded-xl bg-forest-50 hover:bg-forest-100 border border-forest-200 transition-colors"
              >
                <div className="font-bold text-forest-900">Restaurant Admin</div>
                <div className="text-[10px] text-forest-700">Full Access</div>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('manager.gulberg@lahoregrill.pk', 'Manager@1234')}
                className="p-2 text-left rounded-xl bg-ivory-100 hover:bg-ivory-200 border border-ivory-300 transition-colors"
              >
                <div className="font-bold text-charcoal-900">Branch Manager</div>
                <div className="text-[10px] text-charcoal-600">Gulberg Branch</div>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('cashier@lahoregrill.pk', 'Cashier@1234')}
                className="p-2 text-left rounded-xl bg-ivory-100 hover:bg-ivory-200 border border-ivory-300 transition-colors"
              >
                <div className="font-bold text-charcoal-900">Cashier</div>
                <div className="text-[10px] text-charcoal-600">POS Billing</div>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('kitchen@lahoregrill.pk', 'Kitchen@1234')}
                className="p-2 text-left rounded-xl bg-terracotta-50 hover:bg-terracotta-100 border border-terracotta-200 transition-colors"
              >
                <div className="font-bold text-terracotta-900">Kitchen Chef</div>
                <div className="text-[10px] text-terracotta-700">Live KDS</div>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-charcoal-600">
            Need to register a new restaurant?{' '}
            <Link to="/register-restaurant" className="font-bold text-forest-800 hover:underline">
              Create Restaurant
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
