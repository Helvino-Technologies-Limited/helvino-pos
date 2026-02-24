import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesApi, branchesApi } from '../lib/api';
import { formatDateTime, getErrorMessage } from '../lib/utils';
import { Table, Pagination } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { FormField, Select } from '../components/ui/FormField';
import { Plus, Search, Building2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/authStore';

const ROLE_OPTIONS = [
  { value: 'admin',             label: 'Admin',             desc: 'Full access, all branches'     },
  { value: 'manager',           label: 'Manager',           desc: 'Manage own branch'              },
  { value: 'cashier',           label: 'Cashier',           desc: 'POS & sales, own branch'        },
  { value: 'internet_operator', label: 'Internet Operator', desc: 'Internet sessions, own branch'  },
  { value: 'shift_supervisor',  label: 'Shift Supervisor',  desc: 'Manage shifts, own branch'      },
  { value: 'accountant',        label: 'Accountant',        desc: 'Reports & finances, all branches'},
];

// Roles that don't need a branch (cross-branch by design)
const CROSS_BRANCH_ROLES = ['super_admin', 'admin', 'accountant'];

export default function Employees() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin      = ['super_admin', 'admin'].includes(user?.role);

  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmp, setEditingEmp]   = useState(null);
  const [showPassModal, setShowPassModal] = useState(null);
  const [newPass, setNewPass]     = useState('');
  const [showPass, setShowPass]   = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const watchedRole = watch('role');
  const needsBranch = !CROSS_BRANCH_ROLES.includes(watchedRole);

  // Load branches for selector (admins+)
  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.list().then(r => r.data.data),
    enabled: isAdmin,
  });

  const { data: empData, isLoading } = useQuery({
    queryKey: ['employees', page, search, filterBranch],
    queryFn: () => employeesApi.list({
      page, limit: 20, search,
      ...(filterBranch ? { branch_id: filterBranch } : {}),
    }),
    select: r => r.data?.data,
  });

  const createMutation = useMutation({
    mutationFn: (data) => employeesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
      setShowModal(false); reset();
      toast.success('Employee created');
    },
    onError: e => toast.error(getErrorMessage(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => employeesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
      setEditingEmp(null); setShowModal(false); reset();
      toast.success('Employee updated');
    },
    onError: e => toast.error(getErrorMessage(e)),
  });

  const resetPassMutation = useMutation({
    mutationFn: ({ id, pass }) => employeesApi.resetPassword(id, { new_password: pass }),
    onSuccess: () => { setShowPassModal(null); setNewPass(''); toast.success('Password reset'); },
    onError: e => toast.error(getErrorMessage(e)),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => employeesApi.update(id, { is_active }),
    onSuccess: () => { queryClient.invalidateQueries(['employees']); toast.success('Updated'); },
    onError: e => toast.error(getErrorMessage(e)),
  });

  const openEdit = (emp) => {
    setEditingEmp(emp);
    reset({
      name:      emp.name,
      email:     emp.email,
      phone:     emp.phone || '',
      role:      emp.role,
      branch_id: emp.branch_id || '',
    });
    setShowModal(true);
  };

  const openAdd = () => {
    setEditingEmp(null);
    reset({
      branch_id: !isAdmin ? user?.branch_id : '',
    });
    setShowModal(true);
  };

  const onSubmit = (data) => {
    // Clean branch_id for cross-branch roles
    if (CROSS_BRANCH_ROLES.includes(data.role)) data.branch_id = null;
    if (!data.branch_id) data.branch_id = null;

    if (editingEmp) {
      const { password, ...updateData } = data;
      updateMutation.mutate({ id: editingEmp.id, data: updateData });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    {
      key: 'name', label: 'Employee',
      render: (v, r) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold flex-shrink-0">
            {v[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-surface-800 text-sm">{v}</p>
            <p className="text-xs text-surface-400">{r.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'role', label: 'Role',
      render: v => (
        <span className={`badge ${
          v === 'super_admin' ? 'badge-red'    :
          v === 'admin'       ? 'badge-orange' :
          v === 'manager'     ? 'badge-blue'   :
          v === 'accountant'  ? 'badge-yellow' : 'badge-gray'
        } capitalize`}>
          {v?.replace(/_/g, ' ')}
        </span>
      )
    },
    {
      key: 'branch_name', label: 'Branch',
      render: (v, r) => CROSS_BRANCH_ROLES.includes(r.role)
        ? <span className="text-xs text-surface-400 flex items-center gap-1"><Building2 size={11} /> All Branches</span>
        : (v || <span className="text-xs text-red-400">No branch</span>)
    },
    { key: 'last_login', label: 'Last Login', render: v => v ? formatDateTime(v) : 'Never' },
    {
      key: 'is_active', label: 'Status',
      render: v => <span className={`badge ${v ? 'badge-green' : 'badge-red'}`}>{v ? 'Active' : 'Inactive'}</span>
    },
    {
      key: 'id', label: 'Actions',
      render: (v, r) => (
        <div className="flex gap-1 flex-wrap">
          <button onClick={e => { e.stopPropagation(); openEdit(r); }}
            className="btn btn-secondary btn-sm">Edit</button>
          <button onClick={e => { e.stopPropagation(); setShowPassModal(r); }}
            className="btn btn-secondary btn-sm">Reset Pass</button>
          {r.id !== user?.id && (
            <button onClick={e => {
              e.stopPropagation();
              toggleMutation.mutate({ id: r.id, is_active: !r.is_active });
            }} className={`btn btn-ghost btn-sm ${r.is_active ? 'text-red-500' : 'text-green-600'}`}>
              {r.is_active ? 'Disable' : 'Enable'}
            </button>
          )}
        </div>
      )
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Employees</h1>
          <p className="text-sm text-surface-500 mt-0.5">
            {isAdmin ? 'Manage all staff across branches' : `Staff in your branch`}
          </p>
        </div>
        <button onClick={openAdd} className="btn btn-primary btn-sm">
          <Plus size={14} /> Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="card p-3 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search employees..." className="input pl-9 text-sm" />
        </div>
        {isAdmin && branches.length > 0 && (
          <div className="relative">
            <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <select value={filterBranch} onChange={e => { setFilterBranch(e.target.value); setPage(1); }}
              className="input pl-9 pr-4 appearance-none text-sm min-w-[160px]">
              <option value="">All Branches</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}
      </div>

      <Table columns={columns} data={empData?.data || []} loading={isLoading} emptyMessage="No employees found" />
      <Pagination pagination={empData?.pagination} onPage={setPage} />

      {/* Add / Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingEmp(null); reset(); }}
        title={editingEmp ? `Edit — ${editingEmp.name}` : 'Add New Employee'}
        size="md"
        footer={
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowModal(false); setEditingEmp(null); reset(); }}
              className="btn btn-secondary">Cancel</button>
            <button form="emp-form" type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn btn-primary">
              {(createMutation.isPending || updateMutation.isPending)
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : editingEmp ? 'Save Changes' : 'Create Employee'}
            </button>
          </div>
        }>
        <form id="emp-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Full Name *</label>
              <input className={`input ${errors.name ? 'input-error' : ''}`}
                placeholder="John Kamau"
                {...register('name', { required: 'Name is required' })} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label">Email *</label>
              <input type="email" className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="john@helvino.org"
                {...register('email', { required: 'Email is required' })}
                disabled={!!editingEmp} />
            </div>

            <div>
              <label className="label">Phone</label>
              <input className="input" placeholder="0700 000 000" {...register('phone')} />
            </div>

            {/* Role selector with descriptions */}
            <div className="sm:col-span-2">
              <label className="label">Role *</label>
              <div className="grid sm:grid-cols-2 gap-2">
                {ROLE_OPTIONS
                  .filter(r => isSuperAdmin || r.value !== 'super_admin')
                  .map(r => {
                    const isSelected = watchedRole === r.value;
                    return (
                      <label key={r.value}
                        className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-surface-200 hover:border-surface-300'
                        }`}>
                        <input type="radio" value={r.value} className="mt-0.5 accent-orange-500"
                          {...register('role', { required: 'Role is required' })} />
                        <div>
                          <p className={`text-sm font-semibold ${isSelected ? 'text-primary-700' : 'text-surface-800'}`}>
                            {r.label}
                          </p>
                          <p className="text-[11px] text-surface-400">{r.desc}</p>
                        </div>
                      </label>
                    );
                  })}
              </div>
              {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role.message}</p>}
            </div>

            {/* Branch selector — shown when role needs a branch */}
            {needsBranch && (
              <div className="sm:col-span-2">
                <label className="label">Branch *</label>
                {isAdmin ? (
                  <div className="relative">
                    <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                    <select className={`input pl-9 appearance-none ${errors.branch_id ? 'input-error' : ''}`}
                      {...register('branch_id', { required: needsBranch ? 'Branch is required' : false })}>
                      <option value="">Select branch...</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name} — {b.town}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <input className="input bg-surface-50" disabled
                    value={branches.find(b => b.id === user?.branch_id)?.name || 'Your branch'} />
                )}
                {errors.branch_id && <p className="text-xs text-red-500 mt-1">{errors.branch_id.message}</p>}
                <p className="text-xs text-surface-400 mt-1">
                  This employee will only see data and sell from this branch.
                </p>
              </div>
            )}

            {/* Cross-branch role notice */}
            {!needsBranch && watchedRole && (
              <div className="sm:col-span-2 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2">
                <ShieldCheck size={15} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  <strong>{ROLE_OPTIONS.find(r => r.value === watchedRole)?.label}</strong> role has
                  access to all branches and is not restricted to a single location.
                </p>
              </div>
            )}

            {/* Password — only on create */}
            {!editingEmp && (
              <div className="sm:col-span-2">
                <label className="label">Password *</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                    placeholder="Min 8 characters"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Minimum 8 characters' },
                    })} />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal open={!!showPassModal} onClose={() => { setShowPassModal(null); setNewPass(''); }}
        title={`Reset Password — ${showPassModal?.name}`} size="sm">
        <div className="space-y-4">
          <FormField label="New Password">
            <input type="password" className="input" value={newPass}
              onChange={e => setNewPass(e.target.value)}
              placeholder="Min 8 characters" autoFocus />
          </FormField>
          <button
            onClick={() => resetPassMutation.mutate({ id: showPassModal?.id, pass: newPass })}
            disabled={newPass.length < 8 || resetPassMutation.isPending}
            className="btn btn-primary w-full justify-center">
            {resetPassMutation.isPending ? '...' : 'Reset Password'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
