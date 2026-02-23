import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersApi } from '../lib/api';
import { formatCurrency, getErrorMessage } from '../lib/utils';
import { Table, Pagination } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { FormField } from '../components/ui/FormField';
import { Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

export default function Suppliers() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: suppData, isLoading } = useQuery({
    queryKey: ['suppliers', page, search],
    queryFn: () => suppliersApi.list({ page, limit: 20, search }),
    select: (res) => res.data,
  });

  const createMutation = useMutation({
    mutationFn: (data) => suppliersApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['suppliers']); setShowModal(false); reset(); toast.success('Supplier added'); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const columns = [
    { key: 'name', label: 'Supplier', render: (v, r) => <div><p className="font-medium text-surface-800">{v}</p><p className="text-xs text-surface-400">{r.contact_person}</p></div> },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'payment_terms', label: 'Terms', render: v => `${v} days` },
    { key: 'outstanding_balance', label: 'Outstanding', render: v => <span className={parseFloat(v) > 0 ? 'text-red-600 font-semibold' : 'text-surface-500'}>{formatCurrency(v)}</span> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-header">Suppliers</h1>
        <button onClick={() => { reset(); setShowModal(true); }} className="btn-primary btn-sm"><Plus size={14} /> Add Supplier</button>
      </div>
      <div className="card p-3 flex gap-3">
        <div className="relative flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search suppliers..." className="input pl-9 text-sm" /></div>
      </div>
      <Table columns={columns} data={suppData?.data || []} loading={isLoading} emptyMessage="No suppliers" />
      <Pagination pagination={suppData?.pagination} onPage={setPage} />

      <Modal open={showModal} onClose={() => { setShowModal(false); reset(); }} title="Add Supplier" size="lg"
        footer={<div className="flex gap-2 justify-end"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button form="supp-form" type="submit" className="btn-primary">{createMutation.isPending ? '...' : 'Add'}</button></div>}>
        <form id="supp-form" onSubmit={handleSubmit(d => createMutation.mutate(d))} className="grid grid-cols-2 gap-4">
          <FormField label="Company Name" required className="col-span-2"><input className={`input ${errors.name ? 'input-error' : ''}`} {...register('name', { required: true })} /></FormField>
          <FormField label="Contact Person"><input className="input" {...register('contact_person')} /></FormField>
          <FormField label="Phone"><input className="input" {...register('phone')} /></FormField>
          <FormField label="Email"><input type="email" className="input" {...register('email')} /></FormField>
          <FormField label="Payment Terms (days)"><input type="number" className="input" {...register('payment_terms')} defaultValue={30} /></FormField>
          <FormField label="Credit Limit (KES)"><input type="number" className="input" {...register('credit_limit')} defaultValue={0} /></FormField>
          <FormField label="Address" className="col-span-2"><input className="input" {...register('address')} /></FormField>
        </form>
      </Modal>
    </div>
  );
}
