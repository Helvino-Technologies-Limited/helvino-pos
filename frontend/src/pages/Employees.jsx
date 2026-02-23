import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesApi } from '../lib/api';
import { formatDateTime, getErrorMessage, ROLES } from '../lib/utils';
import { Table, Pagination } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { FormField, Select } from '../components/ui/FormField';
import { Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

export default function Employees() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(null);
  const [newPass, setNewPass] = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: empData, isLoading } = useQuery({
    queryKey: ['employees', page, search],
    queryFn: () => employeesApi.list({ page, limit: 20, search }),
    select: (res) => res.data,
  });

  const createMutation = useMutation({
    mutationFn: (data) => employeesApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['employees']); setShowModal(false); reset(); toast.success('Employee created'); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const resetPassMutation = useMutation({
    mutationFn: ({ id, pass }) => employeesApi.resetPassword(id, { new_password: pass }),
    onSuccess: () => { setShowPassModal(null); setNewPass(''); toast.success('Password reset'); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => employeesApi.update(id, { is_active }),
    onSuccess: () => { queryClient.invalidateQueries(['employees']); toast.success('Employee updated'); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const columns = [
    { key: 'name', label: 'Employee', render: (v, r) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">{v[0]}</div>
        <div><p className="font-medium text-surface-800 text-sm">{v}</p><p className="text-xs text-surface-400">{r.email}</p></div>
      </div>
    )},
    { key: 'role', label: 'Role', render: v => <span className="badge badge-blue capitalize">{v?.replace('_', ' ')}</span> },
    { key: 'branch_name', label: 'Branch', render: v => v || '—' },
    { key: 'last_login', label: 'Last Login', render: v => v ? formatDateTime(v) : 'Never' },
    { key: 'is_active', label: 'Status', render: v => <span className={v ? 'badge-green' : 'badge-red'}>{v ? 'Active' : 'Inactive'}</span> },
    { key: 'id', label: 'Actions', render: (v, r) => (
      <div className="flex gap-1">
        <button onClick={e => { e.stopPropagation(); setShowPassModal(r); }} className="btn-secondary btn-sm">Reset Pass</button>
        <button onClick={e => { e.stopPropagation(); toggleMutation.mutate({ id: r.id, is_active: !r.is_active }); }}
          className={`btn-ghost btn-sm ${r.is_active ? 'text-red-500' : 'text-green-600'}`}>
          {r.is_active ? 'Disable' : 'Enable'}
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-header">Employees</h1>
        <button onClick={() => { reset(); setShowModal(true); }} className="btn-primary btn-sm"><Plus size={14} /> Add Employee</button>
      </div>

      <div className="card p-3 flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search employees..." className="input pl-9 text-sm" />
        </div>
      </div>

      <Table columns={columns} data={empData?.data || []} loading={isLoading} emptyMessage="No employees found" />
      <Pagination pagination={empData?.pagination} onPage={setPage} />

      <Modal open={showModal} onClose={() => { setShowModal(false); reset(); }} title="Add Employee" size="md"
        footer={<div className="flex gap-2 justify-end"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button form="emp-form" type="submit" className="btn-primary">{createMutation.isPending ? '...' : 'Create'}</button></div>}
      >
        <form id="emp-form" onSubmit={handleSubmit(d => createMutation.mutate(d))} className="grid grid-cols-2 gap-4">
          <FormField label="Full Name" required className="col-span-2"><input className={`input ${errors.name ? 'input-error' : ''}`} {...register('name', { required: 'Required' })} /></FormField>
          <FormField label="Email" required><input type="email" className={`input ${errors.email ? 'input-error' : ''}`} {...register('email', { required: 'Required' })} /></FormField>
          <FormField label="Phone"><input className="input" {...register('phone')} /></FormField>
          <FormField label="Role" required>
            <Select {...register('role', { required: 'Required' })} options={ROLES.filter(r => r !== 'super_admin').map(r => ({ value: r, label: r.replace('_', ' ') }))} placeholder="Select role" />
          </FormField>
          <FormField label="Password" required><input type="password" className={`input ${errors.password ? 'input-error' : ''}`} {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } })} /></FormField>
        </form>
      </Modal>

      <Modal open={!!showPassModal} onClose={() => { setShowPassModal(null); setNewPass(''); }} title={`Reset: ${showPassModal?.name}`} size="sm">
        <div className="space-y-4">
          <FormField label="New Password">
            <input type="password" className="input" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Min 8 characters" autoFocus />
          </FormField>
          <button onClick={() => resetPassMutation.mutate({ id: showPassModal?.id, pass: newPass })}
            disabled={newPass.length < 8 || resetPassMutation.isPending} className="btn-primary w-full justify-center">
            {resetPassMutation.isPending ? '...' : 'Reset Password'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
