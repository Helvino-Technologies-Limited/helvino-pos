import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Monitor, Package, Users, UserCog,
  Clock, Receipt, BarChart3, Settings, LogOut, ChevronRight,
  Truck, Wrench, Building2, Phone, Globe, Mail, X, Tag
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', minRole: 'internet_operator' },
  { to: '/pos', icon: ShoppingCart, label: 'Point of Sale', minRole: 'cashier' },
  { to: '/internet', icon: Monitor, label: 'Internet Sessions', minRole: 'internet_operator' },
  { to: '/products', icon: Package, label: 'Products', minRole: 'cashier' },
  { to: '/customers', icon: Users, label: 'Customers', minRole: 'cashier' },
  { to: '/sales', icon: Receipt, label: 'Sales History', minRole: 'cashier' },
  { to: '/expenses', icon: Tag, label: 'Expenses', minRole: 'cashier' },
  { to: '/suppliers', icon: Truck, label: 'Suppliers', minRole: 'manager' },
  { to: '/services', icon: Wrench, label: 'Services', minRole: 'manager' },
  { to: '/employees', icon: UserCog, label: 'Employees', minRole: 'manager' },
  { to: '/shifts', icon: Clock, label: 'Shifts', minRole: 'cashier' },
  { to: '/reports', icon: BarChart3, label: 'Reports', minRole: 'accountant' },
  { to: '/branches', icon: Building2, label: 'Branches', minRole: 'super_admin' },
  { to: '/settings', icon: Settings, label: 'Settings', minRole: 'admin' },
];

const ROLE_HIERARCHY = {
  super_admin: 7, admin: 6, manager: 5, shift_supervisor: 4,
  accountant: 3, cashier: 2, internet_operator: 1,
};

export const Sidebar = ({ open, onClose }) => {
  const { user, logout, canAccess } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const visibleItems = NAV_ITEMS.filter(item => canAccess(item.minRole));

  return (
    <>
      {/* Overlay */}
      {open && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />}

      <aside className={cn(
        'fixed top-0 left-0 h-screen w-64 bg-surface-950 text-white z-50 flex flex-col transition-transform duration-300 ease-in-out',
        'lg:translate-x-0 lg:static lg:z-auto',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Header */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
                <Building2 size={18} className="text-white" />
              </div>
              <div>
                <p className="font-display text-sm font-bold text-white leading-tight">Helvino POS</p>
                <p className="text-[10px] text-white/40">Cyber & Bookshop</p>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-white/10">
              <X size={16} className="text-white/60" />
            </button>
          </div>
        </div>

        {/* User */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/5">
            <div className="w-8 h-8 rounded-full bg-primary-600/30 border border-primary-500/30 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary-400">{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-white/40 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-0.5">
          {visibleItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-primary-600 text-white shadow-glow'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              )}
            >
              <Icon size={16} className="flex-shrink-0" />
              <span className="flex-1">{label}</span>
              <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        {/* Support info */}
        <div className="px-4 py-3 border-t border-white/10">
          <div className="rounded-xl bg-white/5 p-3 space-y-1.5 mb-3">
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Support</p>
            <p className="text-xs font-medium text-white/70">Helvino Technologies Ltd</p>
            <a href="tel:0703445756" className="flex items-center gap-1.5 text-[11px] text-primary-400 hover:text-primary-300 transition-colors">
              <Phone size={10} /> 0703445756
            </a>
            <a href="mailto:helvinotechltd@gmail.com" className="flex items-center gap-1.5 text-[11px] text-primary-400 hover:text-primary-300 transition-colors truncate">
              <Mail size={10} /> helvinotechltd@gmail.com
            </a>
            <a href="https://helvino.org" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[11px] text-primary-400 hover:text-primary-300 transition-colors">
              <Globe size={10} /> helvino.org
            </a>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-white/60 hover:text-white hover:bg-red-500/20 transition-colors group"
          >
            <LogOut size={15} className="group-hover:text-red-400 transition-colors" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};
