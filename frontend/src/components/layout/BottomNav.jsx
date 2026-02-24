import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Monitor, Package,
  Users, Clock, MoreHorizontal, Receipt
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';
import { Sidebar } from './Sidebar';

const PRIMARY_NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home',     minRole: 'internet_operator' },
  { to: '/pos',       icon: ShoppingCart,    label: 'POS',      minRole: 'cashier'           },
  { to: '/internet',  icon: Monitor,         label: 'Internet', minRole: 'internet_operator' },
  { to: '/sales',     icon: Receipt,         label: 'Sales',    minRole: 'cashier'           },
];

export const BottomNav = () => {
  const { canAccess } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const visible = PRIMARY_NAV.filter(i => canAccess(i.minRole));

  return (
    <>
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-surface-100"
           style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-stretch">
          {visible.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-primary-600' : 'text-surface-400'
                }`
              }>
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-primary-50' : ''}`}>
                    <Icon size={20} />
                  </div>
                  {label}
                </>
              )}
            </NavLink>
          ))}

          {/* More button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium text-surface-400">
            <div className="p-1.5 rounded-xl">
              <MoreHorizontal size={20} />
            </div>
            More
          </button>
        </div>
      </nav>
    </>
  );
};
