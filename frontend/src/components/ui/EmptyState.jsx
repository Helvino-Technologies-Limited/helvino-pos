import { cn } from '../../lib/utils';

export const EmptyState = ({ icon: Icon, title, description, action, className }) => (
  <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
    {Icon && (
      <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
        <Icon size={28} className="text-surface-400" />
      </div>
    )}
    <h3 className="font-display text-base font-semibold text-surface-700 mb-1">{title}</h3>
    {description && <p className="text-sm text-surface-400 max-w-sm mb-4">{description}</p>}
    {action}
  </div>
);
