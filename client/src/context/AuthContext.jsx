import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [branches, setBranches] = useState([]);
  const [activeBranch, setActiveBranch] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('servora_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize and load authenticated session
  const refreshAuth = useCallback(async () => {
    const savedToken = localStorage.getItem('servora_token');
    if (!savedToken) {
      setUser(null);
      setRestaurant(null);
      setBranches([]);
      setActiveBranch(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.success) {
        setUser(res.user);
        setRestaurant(res.restaurant);
        setBranches(res.branches || []);

        // Determine active branch
        const savedBranchId = localStorage.getItem('servora_active_branch_id');
        let selectedBranch = null;

        if (savedBranchId && res.branches?.some((b) => b._id === savedBranchId)) {
          selectedBranch = res.branches.find((b) => b._id === savedBranchId);
        } else if (res.user.branchId && res.branches?.some((b) => b._id === res.user.branchId)) {
          selectedBranch = res.branches.find((b) => b._id === res.user.branchId);
        } else if (res.branches && res.branches.length > 0) {
          selectedBranch = res.branches[0];
        }

        if (selectedBranch) {
          setActiveBranch(selectedBranch);
          localStorage.setItem('servora_active_branch_id', selectedBranch._id);
        }
      }
    } catch (err) {
      console.warn('[Auth] Session initialization notice:', err.message);
      localStorage.removeItem('servora_token');
      localStorage.removeItem('servora_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success) {
      localStorage.setItem('servora_token', res.token);
      localStorage.setItem('servora_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      setRestaurant(res.restaurant);
      setBranches(res.branches || []);

      const defaultBranch = res.branches?.find((b) => b._id === res.user.branchId) || res.branches?.[0] || null;
      if (defaultBranch) {
        setActiveBranch(defaultBranch);
        localStorage.setItem('servora_active_branch_id', defaultBranch._id);
      }
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const registerRestaurant = async (payload) => {
    const res = await api.post('/auth/register-restaurant', payload);
    if (res.success) {
      localStorage.setItem('servora_token', res.token);
      localStorage.setItem('servora_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      setRestaurant(res.restaurant);
      setBranches([res.branch]);
      setActiveBranch(res.branch);
      localStorage.setItem('servora_active_branch_id', res.branch._id);
      return res;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const switchBranch = (branchId) => {
    const target = branches.find((b) => b._id === branchId);
    if (target) {
      setActiveBranch(target);
      localStorage.setItem('servora_active_branch_id', target._id);
      window.dispatchEvent(new Event('branch-changed'));
    }
  };

  const logout = () => {
    localStorage.removeItem('servora_token');
    localStorage.removeItem('servora_user');
    localStorage.removeItem('servora_active_branch_id');
    setToken(null);
    setUser(null);
    setRestaurant(null);
    setBranches([]);
    setActiveBranch(null);
    window.location.href = '/login';
  };

  const updateProfile = async (data) => {
    const res = await api.put('/auth/profile', data);
    if (res.success) {
      setUser(res.user);
    }
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        restaurant,
        branches,
        activeBranch,
        token,
        loading,
        login,
        registerRestaurant,
        logout,
        switchBranch,
        updateProfile,
        refreshAuth,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
        isManager: user?.role === 'manager' || user?.role === 'admin' || user?.role === 'superadmin',
        isCashier: user?.role === 'cashier',
        isKitchen: user?.role === 'kitchen',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
