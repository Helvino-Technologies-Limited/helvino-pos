import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchesApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../lib/utils';
import {
  Building2, Plus, Edit2, Users, Package, Monitor,
  ShoppingCart, TrendingUp, MapPin, Phone, Mail, X, Save
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';

const StatCard = ({ icon: Icon, label, value, sub, color = 'text-primary-600' }) => (
  <div className="card p-4 flex items-start gap-3">
    <div className="w-9 h-9 rounded-xl bg-surface-50 flex items-center justify-center flex-shrink-0">
      <Icon size={16} className={color} />
    </div>
    <div>
      <p className="text-xs text-surface-500">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-surface-400">{sub}</p>}
    </div>
  </div>
);

const BranchForm = ({ branch, onSave, onClose }) => {
  const [form, setForm] = useState({
    name:    branch?.name    || '',
    address: branch?.address || '',
    phone:   branch?.phone   || '',
    email:   branch?.email   || '',
    county:  branch?.county  || '',
    town:    branch?.town    || '',
    website: branch?.website || '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        {[
          { k:'name',    label:'Branch Name *', placeholder:'e.g. Siaya Town' },
          { k:'town',    label:'Town',           placeholder:'e.g. Siaya'      },
          { k:'county',  label:'County',         placeholder:'e.g. Siaya'      },
          { k:'phone',   label:'Phone',          placeholder:'0700 000 000'    },
          { k:'email',   label:'Email',          placeholder:'branch@helvino.org' },
          { k:'website', label:'Website',        placeholder:'helvino.org'     },
        ].map(({ k, label, placeholder }) => (
          <div key={k}>
            <label className="label">{label}</label>
            <input className="input" placeholder={placeholder}
              value={form[k]} onChange={e => set(k, e.target.value)} />
          </div>
        ))}
        <div className="sm:col-span-2">
          <label className="label">Address</label>
          <textarea className="input resize-none" rows={2}
            placeholder="Street address..." value={form.address}
            onChange={e => set('address', e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="btn btn-secondary"><X size={14} /> Cancel</button>
        <button onClick={() => onSave(form)} className="btn btn-primary"><Save size={14} /> Save Branch</button>
      </div>
    </div>
  );
};

export default function Branches() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isSuperAdmin = user?.role === 'super_admin';
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [selected, setSelected]   = useState(null);

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.list().then(r => r.data.data),
  });

  const { data: summaries = {} } = useQuery({
    queryKey: ['branch-summaries', branches.map(b => b.id).join(',')],
    queryFn: async () => {
      const results = await Promise.all(branches.map(b => branchesApi.summary(b.id).then(r => r.data.data)));
      return Object.fromEntries(results.map(r => [r.branch.id, r]));
    },
    enabled: branches.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: branchesApi.create,
    onSuccess: () => { toast.success('Branch created'); qc.invalidateQueries(['branches']); setShowModal(false); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => branchesApi.update(id, data),
    onSuccess: () => { toast.success('Branch updated'); qc.invalidateQueries(['branches']); setEditing(null); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handleSave = (form) => {
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6 text-center text-surface-400">
        <Building2 size={40} className="mx-auto mb-2 opacity-30" />
        <p>Branch management is only available to Super Admins.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Branch Management</h1>
          <p className="text-sm text-surface-500 mt-0.5">Manage all Helvino branches</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn btn-primary">
          <Plus size={15} /> Add Branch
        </button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="card p-6 h-48 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {branches.map(branch => {
            const s = summaries[branch.id];
            return (
              <div key={branch.id} className="card overflow-hidden hover:shadow-card-hover transition-all">
                {/* Header */}
                <div className="p-4 border-b border-surface-100 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-black text-lg" style={{ fontFamily:"'Syne',sans-serif" }}>
                      {branch.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-surface-900">{branch.name}</p>
                      <div className="flex items-center gap-1 text-xs text-surface-400">
                        <MapPin size={10} />{branch.town || branch.address || '—'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`badge ${branch.is_active ? 'badge-green' : 'badge-gray'}`}>
                      {branch.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button onClick={() => { setEditing(branch); setShowModal(true); }}
                      className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-700">
                      <Edit2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                {s ? (
                  <div className="p-4 grid grid-cols-2 gap-3">
                    <div className="text-center p-2 rounded-lg bg-surface-50">
                      <p className="text-xs text-surface-500">Today Sales</p>
                      <p className="font-bold text-primary-600">{formatCurrency(s.today_sales.total)}</p>
                      <p className="text-[10px] text-surface-400">{s.today_sales.count} transactions</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-surface-50">
                      <p className="text-xs text-surface-500">This Month</p>
                      <p className="font-bold text-green-600">{formatCurrency(s.month_sales.total)}</p>
                      <p className="text-[10px] text-surface-400">{s.month_sales.count} transactions</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-surface-50">
                      <p className="text-xs text-surface-500">Products</p>
                      <p className="font-bold text-surface-800">{s.stock.total}</p>
                      {s.stock.low_stock > 0 && (
                        <p className="text-[10px] text-red-500">{s.stock.low_stock} low stock</p>
                      )}
                    </div>
                    <div className="text-center p-2 rounded-lg bg-surface-50">
                      <p className="text-xs text-surface-500">Staff</p>
                      <p className="font-bold text-surface-800">{s.employees}</p>
                      {s.active_sessions > 0 && (
                        <p className="text-[10px] text-blue-500">{s.active_sessions} active sessions</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 grid grid-cols-2 gap-3">
                    {[1,2,3,4].map(i => <div key={i} className="h-16 bg-surface-50 rounded-lg animate-pulse" />)}
                  </div>
                )}

                {/* Contact */}
                <div className="px-4 pb-4 flex flex-wrap gap-3 text-xs text-surface-400">
                  {branch.phone && (
                    <a href={`tel:${branch.phone}`} className="flex items-center gap-1 hover:text-primary-600">
                      <Phone size={10} />{branch.phone}
                    </a>
                  )}
                  {branch.email && (
                    <a href={`mailto:${branch.email}`} className="flex items-center gap-1 hover:text-primary-600 truncate">
                      <Mail size={10} />{branch.email}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setEditing(null); }}
        title={editing ? `Edit — ${editing.name}` : 'Add New Branch'}>
        <BranchForm
          branch={editing}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditing(null); }}
        />
      </Modal>
    </div>
  );
}
