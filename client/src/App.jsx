import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { AppLayout } from './components/layout/AppLayout.jsx';

// Pages
import { Login } from './pages/auth/Login.jsx';
import { RegisterRestaurant } from './pages/auth/RegisterRestaurant.jsx';
import { Dashboard } from './pages/dashboard/Dashboard.jsx';
import { POS } from './pages/pos/POS.jsx';
import { KitchenDisplay } from './pages/kds/KitchenDisplay.jsx';
import { Orders } from './pages/orders/Orders.jsx';
import { TableManagement } from './pages/tables/TableManagement.jsx';
import { Reservations } from './pages/reservations/Reservations.jsx';
import { MenuManagement } from './pages/menu/MenuManagement.jsx';
import { Inventory } from './pages/inventory/Inventory.jsx';
import { Recipes } from './pages/inventory/Recipes.jsx';
import { Purchases } from './pages/inventory/Purchases.jsx';
import { Suppliers } from './pages/inventory/Suppliers.jsx';
import { Expenses } from './pages/expenses/Expenses.jsx';
import { Reports } from './pages/reports/Reports.jsx';
import { StaffManagement } from './pages/staff/StaffManagement.jsx';
import { RestaurantSettings } from './pages/settings/RestaurantSettings.jsx';
import { NotFound } from './pages/NotFound.jsx';

// Role-aware root redirector
const RootRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'kitchen') return <Navigate to="/kitchen" replace />;
  if (user?.role === 'cashier') return <Navigate to="/pos" replace />;
  return <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register-restaurant" element={<RegisterRestaurant />} />

            {/* Protected SaaS App Routes */}
            <Route path="/" element={<AppLayout />}>
              <Route index element={<RootRedirect />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="pos" element={<POS />} />
              <Route path="kitchen" element={<KitchenDisplay />} />
              <Route path="orders" element={<Orders />} />
              <Route path="tables" element={<TableManagement />} />
              <Route path="reservations" element={<Reservations />} />
              <Route path="menu" element={<MenuManagement />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="recipes" element={<Recipes />} />
              <Route path="purchases" element={<Purchases />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="reports" element={<Reports />} />
              <Route path="staff" element={<StaffManagement />} />
              <Route path="settings" element={<RestaurantSettings />} />
            </Route>

            {/* 404 Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
