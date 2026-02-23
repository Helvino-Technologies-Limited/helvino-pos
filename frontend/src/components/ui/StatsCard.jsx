import { cn } from '../../lib/utils';

export const StatsCard = ({ title, value, subtitle, icon: Icon, trend, color = 'orange', loading }) => {
  const colors = {
    orange: 'bg-primary-50 text-primary-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };

  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-surface-500 uppercase tracking-wide">{title}</p>
          {loading ? (
            <div className="h-8 w-28 bg-surface-100 rounded animate-pulse mt-1" />
          ) : (
            <p className="font-display text-2xl font-bold text-surface-900 mt-1 truncate">{value}</p>
          )}
          {subtitle && <p className="text-xs text-surface-400 mt-1 truncate">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', colors[color])}>
            <Icon size={20} />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className={cn('text-xs font-medium mt-2', trend >= 0 ? 'text-green-600' : 'text-red-500')}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs yesterday
        </div>
      )}
    </div>
  );
};
