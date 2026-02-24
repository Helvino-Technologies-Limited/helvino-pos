import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../../lib/api';
import {
  Bell, X, Package, Monitor, Clock, ShoppingBag,
  AlertTriangle, AlertCircle, Info, CheckCircle, RefreshCw
} from 'lucide-react';

const TYPE_STYLES = {
  error:   { bg: 'bg-red-50',    border: 'border-red-100',    icon: AlertCircle,   iconColor: 'text-red-500'    },
  warning: { bg: 'bg-amber-50',  border: 'border-amber-100',  icon: AlertTriangle, iconColor: 'text-amber-500'  },
  info:    { bg: 'bg-blue-50',   border: 'border-blue-100',   icon: Info,          iconColor: 'text-blue-500'   },
  success: { bg: 'bg-green-50',  border: 'border-green-100',  icon: CheckCircle,   iconColor: 'text-green-500'  },
};

const CATEGORY_ICONS = {
  stock:    Package,
  internet: Monitor,
  shifts:   Clock,
  sales:    ShoppingBag,
};

export const NotificationPanel = () => {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dismissed_notifications') || '[]'); }
    catch { return []; }
  });
  const panelRef = useRef();
  const navigate = useNavigate();

  const { data, isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list().then(r => r.data.data),
    refetchInterval: 60000, // refresh every 60s
    staleTime: 30000,
  });

  const allNotifications = data?.notifications || [];
  const visible = allNotifications.filter(n => !dismissed.includes(n.id));
  const unread  = visible.length;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const dismiss = (id, e) => {
    e.stopPropagation();
    const updated = [...dismissed, id];
    setDismissed(updated);
    localStorage.setItem('dismissed_notifications', JSON.stringify(updated));
  };

  const dismissAll = () => {
    const updated = [...dismissed, ...visible.map(n => n.id)];
    setDismissed(updated);
    localStorage.setItem('dismissed_notifications', JSON.stringify(updated));
  };

  const handleClick = (n) => {
    setOpen(false);
    navigate(n.link);
  };

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`relative p-2 rounded-xl transition-colors ${
          open ? 'bg-primary-50 text-primary-600' : 'text-surface-500 hover:bg-surface-100'
        }`}>
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-surface-100 z-50 overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-surface-600" />
              <span className="font-semibold text-sm text-surface-900">Notifications</span>
              {unread > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-bold">
                  {unread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => refetch()}
                className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-colors"
                title="Refresh">
                <RefreshCw size={13} />
              </button>
              {unread > 0 && (
                <button onClick={dismissAll}
                  className="px-2 py-1 rounded-lg hover:bg-surface-100 text-xs text-surface-500 hover:text-surface-700 transition-colors">
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[420px] overflow-y-auto scrollbar-thin">
            {isLoading ? (
              <div className="space-y-2 p-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-16 bg-surface-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-surface-300 gap-2">
                <CheckCircle size={32} />
                <p className="text-sm font-medium text-surface-500">All caught up!</p>
                <p className="text-xs text-surface-400">No pending alerts right now.</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {visible.map(n => {
                  const style = TYPE_STYLES[n.type] || TYPE_STYLES.info;
                  const TypeIcon = style.icon;
                  const CatIcon  = CATEGORY_ICONS[n.category] || Info;

                  return (
                    <div
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer hover:brightness-95 transition-all ${style.bg} ${style.border}`}>
                      <div className="flex-shrink-0 mt-0.5">
                        <TypeIcon size={15} className={style.iconColor} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <CatIcon size={10} className="text-surface-400 flex-shrink-0" />
                          <p className="text-xs font-semibold text-surface-800">{n.title}</p>
                          {n.branch && (
                            <span className="ml-auto text-[10px] text-surface-400 flex-shrink-0 truncate max-w-[80px]">
                              {n.branch}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-surface-600 leading-snug">{n.message}</p>
                      </div>
                      <button
                        onClick={e => dismiss(n.id, e)}
                        className="flex-shrink-0 p-0.5 rounded text-surface-300 hover:text-surface-600 hover:bg-white/60 transition-colors">
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-surface-100 flex items-center justify-between">
            <p className="text-[10px] text-surface-300">
              {lastUpdated ? `Updated ${lastUpdated}` : 'Loading...'}
            </p>
            <p className="text-[10px] text-surface-300">Auto-refreshes every 60s</p>
          </div>
        </div>
      )}
    </div>
  );
};
