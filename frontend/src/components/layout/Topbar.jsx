import { Menu, Bell, Search, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { formatDate } from '../../lib/utils';

export const Topbar = ({ onMenuClick, title }) => {
  const { user } = useAuthStore();
  const today = formatDate(new Date(), 'EEEE, d MMMM yyyy');

  return (
    <header className="h-16 bg-white border-b border-surface-100 flex items-center px-4 gap-4 sticky top-0 z-30">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl text-surface-500 hover:text-surface-700 hover:bg-surface-100 transition-colors"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1">
        <h1 className="font-display text-base font-semibold text-surface-900 hidden sm:block">{title}</h1>
        <p className="text-xs text-surface-400 hidden sm:block">{today}</p>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-xl text-surface-500 hover:text-surface-700 hover:bg-surface-100 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary-500 rounded-full" />
        </button>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-surface-100 rounded-xl">
          <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-xs font-bold text-primary-700">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <span className="text-xs font-medium text-surface-700">{user?.name}</span>
        </div>
      </div>
    </header>
  );
};
