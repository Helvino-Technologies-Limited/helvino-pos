import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/pos': 'Point of Sale',
  '/internet': 'Internet Sessions',
  '/products': 'Products & Inventory',
  '/customers': 'Customers',
  '/sales': 'Sales History',
  '/expenses': 'Expenses',
  '/suppliers': 'Suppliers',
  '/services': 'Services',
  '/employees': 'Employees',
  '/shifts': 'Shifts',
  '/reports': 'Reports & Analytics',
  '/settings': 'Settings',
};

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Helvino POS';

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
          <div className="max-w-screen-2xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
