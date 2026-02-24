import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import InternetSessions from './pages/InternetSessions';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import Suppliers from './pages/Suppliers';
import Services from './pages/Services';
import Employees from './pages/Employees';
import Shifts from './pages/Shifts';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Branches from './pages/Branches';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="dashboard"  element={<Dashboard />} />
            <Route path="pos"        element={<POS />} />
            <Route path="internet"   element={<InternetSessions />} />
            <Route path="products"   element={<Products />} />
            <Route path="customers"  element={<Customers />} />
            <Route path="sales"      element={<Sales />} />
            <Route path="expenses"   element={<Expenses />} />
            <Route path="shifts"     element={<Shifts />} />
            <Route path="suppliers"  element={<ProtectedRoute minRole="manager"><Suppliers /></ProtectedRoute>} />
            <Route path="services"   element={<ProtectedRoute minRole="manager"><Services /></ProtectedRoute>} />
            <Route path="employees"  element={<ProtectedRoute minRole="manager"><Employees /></ProtectedRoute>} />
            <Route path="reports"    element={<ProtectedRoute minRole="accountant"><Reports /></ProtectedRoute>} />
            <Route path="branches"   element={<ProtectedRoute minRole="super_admin"><Branches /></ProtectedRoute>} />
            <Route path="settings"   element={<ProtectedRoute minRole="admin"><Settings /></ProtectedRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { fontFamily: 'DM Sans, sans-serif', fontSize: '13px', borderRadius: '10px' },
        success: { iconTheme: { primary: '#f97316', secondary: '#fff' } },
        duration: 3000,
      }} />
    </QueryClientProvider>
  );
}
