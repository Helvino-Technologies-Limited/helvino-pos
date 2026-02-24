import { useQuery } from '@tanstack/react-query';
import { branchesApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Building2, ChevronDown } from 'lucide-react';

export const BranchSwitcher = ({ value, onChange, includeAll = false, className = '' }) => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.list().then(r => r.data.data),
    enabled: isSuperAdmin,
  });

  if (!isSuperAdmin) return null;

  return (
    <div className={`relative ${className}`}>
      <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
      <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value || null)}
        className="input pl-9 pr-8 appearance-none cursor-pointer text-sm font-medium">
        {includeAll && <option value="">All Branches</option>}
        {branches.map(b => (
          <option key={b.id} value={b.id}>{b.name} — {b.town}</option>
        ))}
      </select>
    </div>
  );
};
