import { useQuery } from '@tanstack/react-query';
import { branchesApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Building2, ChevronDown, Globe } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export const BranchSwitcherTopbar = () => {
  const { user, activeBranch, setActiveBranch } = useAuthStore();
  const qc = useQueryClient();

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.list().then(r => r.data.data),
    enabled: user?.role === 'super_admin',
  });

  if (user?.role !== 'super_admin') return null;

  const handleChange = (e) => {
    const id = e.target.value;
    if (!id) {
      setActiveBranch(null);
    } else {
      const branch = branches.find(b => b.id === id);
      setActiveBranch(branch || null);
    }
    // Invalidate all queries so they refetch with new branch context
    qc.invalidateQueries();
  };

  return (
    <div className="relative flex items-center">
      {/* Indicator dot */}
      <div className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full z-10 ${
        activeBranch ? 'bg-green-500' : 'bg-surface-400'
      }`} />
      <select
        value={activeBranch?.id || ''}
        onChange={handleChange}
        className="pl-7 pr-7 py-1.5 text-xs font-semibold rounded-lg border border-surface-200
                   bg-white text-surface-700 appearance-none cursor-pointer
                   hover:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30
                   transition-all min-w-[130px]">
        <option value="">All Branches</option>
        {branches.map(b => (
          <option key={b.id} value={b.id}>
            {b.name} — {b.town}
          </option>
        ))}
      </select>
      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
    </div>
  );
};
