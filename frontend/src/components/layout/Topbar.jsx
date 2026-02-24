import { Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { formatDate } from '../../lib/utils';
import { NotificationPanel } from './NotificationPanel';
import { BranchSwitcherTopbar } from './BranchSwitcherTopbar';

export const Topbar = ({ onMenuClick, title }) => {
  const { user, activeBranch } = useAuthStore();
  const today = formatDate(new Date(), 'EEE, d MMM yyyy');

  return (
    <header className="h-14 bg-white border-b border-surface-100 flex items-center px-3 gap-3 sticky top-0 z-30">
      {/* Menu — desktop only */}
      <button onClick={onMenuClick}
        className="hidden lg:flex p-2 rounded-xl text-surface-500 hover:bg-surface-100 transition-colors">
        <Menu size={20} />
      </button>

      {/* Logo — mobile only */}
      <div className="lg:hidden flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-black">H</span>
        </div>
        <span className="font-black text-sm text-surface-900" style={{ fontFamily: "'Syne',sans-serif" }}>
          Helvino
        </span>
      </div>

      {/* Desktop title + branch context */}
      <div className="flex-1 hidden lg:flex items-center gap-3">
        <div>
          <h1 className="font-display text-base font-semibold text-surface-900 leading-tight">{title}</h1>
          <p className="text-xs text-surface-400">{today}</p>
        </div>
        {/* Super admin branch context pill */}
        {user?.role === 'super_admin' && activeBranch && (
          <span className="px-2.5 py-1 rounded-lg bg-primary-50 border border-primary-100 text-xs font-semibold text-primary-700">
            📍 {activeBranch.name}
          </span>
        )}
        {user?.role === 'super_admin' && !activeBranch && (
          <span className="px-2.5 py-1 rounded-lg bg-surface-100 text-xs font-medium text-surface-500">
            🌐 All Branches
          </span>
        )}
      </div>

      {/* Mobile title */}
      <div className="flex-1 lg:hidden text-center">
        <h1 className="text-sm font-semibold text-surface-900 truncate">{title}</h1>
        {user?.role === 'super_admin' && (
          <p className="text-[10px] text-primary-600 font-medium">
            {activeBranch ? `📍 ${activeBranch.name}` : '🌐 All Branches'}
          </p>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Branch switcher — super_admin only */}
        <BranchSwitcherTopbar />
        <NotificationPanel />
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-primary-700">{user?.name?.[0]?.toUpperCase()}</span>
        </div>
      </div>
    </header>
  );
};
