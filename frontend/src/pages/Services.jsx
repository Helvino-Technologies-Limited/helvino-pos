import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi, categoriesApi } from '../lib/api';
import { formatCurrency, getErrorMessage } from '../lib/utils';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { FormField, Select } from '../components/ui/FormField';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

const SERVICE_TYPES = ['internet','printing','scanning','typing','lamination','binding','fax','photocopy','other'];

export default function Services() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editService, setEditService] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.list(),
    select: (res) => res.data.data,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list({ type: 'service' }),
    select: (res) => res.data.data,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editService ? servicesApi.update(editService.id, data) : servicesApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['services']); setShowModal(false); reset(); setEditService(null); toast.success(editService ? 'Service updated' : 'Service added'); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const columns = [
    { key: 'name', label: 'Service' },
    { key: 'service_type', label: 'Type', render: v => <span className="badge badge-blue capitalize">{v}</span> },
    { key: 'rate', label: 'Rate', render: (v, r) => <span className="font-bold">{formatCurrency(v)} / {r.rate_unit?.replace('per_', '')}</span> },
    { key: 'b_and_w_rate', label: 'B&W', render: v => v ? formatCurrency(v) : '—' },
    { key: 'color_rate', label: 'Color', render: v => v ? formatCurrency(v) : '—' },
    { key: 'is_active', label: 'Active', render: v => <span className={v ? 'badge-green' : 'badge-red'}>{v ? 'Yes' : 'No'}</span> },
    { key: 'id', label: '', render: (v, r) => <button onClick={e => { e.stopPropagation(); setEditService(r); reset(r); setShowModal(true); }} className="btn-secondary btn-sm">Edit</button> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-header">Services & Rates</h1>
        <button onClick={() => { setEditService(null); reset({}); setShowModal(true); }} className="btn-primary btn-sm"><Plus size={14} /> Add Service</button>
      </div>
      <Table columns={columns} data={services || []} loading={isLoading} emptyMessage="No services configured" />

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditService(null); reset(); }} title={editService ? 'Edit Service' : 'Add Service'} size="md"
        footer={<div className="flex gap-2 justify-end"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button form="svc-form" type="submit" className="btn-primary">{saveMutation.isPending ? '...' : 'Save'}</button></div>}>
        <form id="svc-form" onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="grid grid-cols-2 gap-4">
          <FormField label="Service Name" required className="col-span-2"><input className={`input ${errors.name ? 'input-error' : ''}`} {...register('name', { required: true })} /></FormField>
          <FormField label="Type" required>
            <Select {...register('service_type', { required: true })} options={SERVICE_TYPES.map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))} placeholder="Select type" />
          </FormField>
          <FormField label="Rate Unit">
            <Select {...register('rate_unit')} options={['per_hour','per_minute','per_page','per_job','per_item'].map(v => ({ value: v, label: v.replace(/_/g, ' ') }))} />
          </FormField>
          <FormField label="Default Rate (KES)" required>
            <input type="number" step="0.01" className={`input ${errors.rate ? 'input-error' : ''}`} {...register('rate', { required: true })} />
          </FormField>
          <FormField label="Category">
            <Select {...register('category_id')} options={(categories || []).map(c => ({ value: c.id, label: c.name }))} placeholder="Select category" />
          </FormField>
          <FormField label="B&W Rate (KES)"><input type="number" step="0.01" className="input" {...register('b_and_w_rate')} /></FormField>
          <FormField label="Color Rate (KES)"><input type="number" step="0.01" className="input" {...register('color_rate')} /></FormField>
          <FormField label="Description" className="col-span-2"><input className="input" {...register('description')} /></FormField>
        </form>
      </Modal>
    </div>
  );
}
