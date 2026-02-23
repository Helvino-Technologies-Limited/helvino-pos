import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi } from '../lib/api';
import { formatCurrency, formatDate, getErrorMessage, EXPENSE_CATEGORIES } from '../lib/utils';
import { Table, Pagination } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { FormField, Select } from '../components/ui/FormField';
import { StatsCard } from '../components/ui/StatsCard';
import { Plus, DollarSign, BarChart2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

const COLORS = ['#f97316','#3b82f6','#10b981','#8b5cf6','#ec4899','#f59e0b','#14b8a6','#ef4444','#6366f1','#84cc16'];

export default function Expenses() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ start_date: '', end_date: '' });
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: expData, isLoading } = useQuery({
    queryKey: ['expenses', page, filters],
    queryFn: () => expensesApi.list({ page, limit: 20, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) }),
    select: (res) => res.data,
  });

  const { data: summary } = useQuery({
    queryKey: ['expense-summary', filters],
    queryFn: () => expensesApi.summary(Object.fromEntries(Object.entries(filters).filter(([,v]) => v))),
    select: (res) => res.data.data,
  });

  const createMutation = useMutation({
    mutationFn: (data) => expensesApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['expenses']); queryClient.invalidateQueries(['expense-summary']); setShowModal(false); reset(); toast.success('Expense recorded'); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => expensesApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['expenses']); toast.success('Expense deleted'); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const total = (summary || []).reduce((s, r) => s + parseFloat(r.total || 0), 0);
  const chartData = (summary || []).map(r => ({ name: r.category, value: parseFloat(r.total || 0) }));

  const columns = [
    { key: 'category', label: 'Category', render: v => <span className="badge badge-gray">{v}</span> },
    { key: 'description', label: 'Description' },
    { key: 'amount', label: 'Amount', render: v => <span className="font-semibold text-red-600">{formatCurrency(v)}</span> },
    { key: 'payment_method', label: 'Method', render: v => <span className="badge badge-blue capitalize">{v}</span> },
    { key: 'expense_date', label: 'Date', render: v => formatDate(v) },
    { key: 'employee_name', label: 'By' },
    { key: 'id', label: '', render: (v) => <button onClick={e => { e.stopPropagation(); if (confirm('Delete this expense?')) deleteMutation.mutate(v); }} className="btn-ghost btn-sm text-red-500">Delete</button> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-header">Expenses</h1>
        <button onClick={() => { reset(); setShowModal(true); }} className="btn-primary btn-sm"><Plus size={14} /> Add Expense</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <StatsCard title="Total Expenses" value={formatCurrency(total)} subtitle={`${(summary || []).length} categories`} icon={DollarSign} color="red" />
          <div className="card p-3 flex gap-3">
            <input type="date" value={filters.start_date} onChange={e => setFilters(p => ({ ...p, start_date: e.target.value }))} className="input w-36" />
            <input type="date" value={filters.end_date} onChange={e => setFilters(p => ({ ...p, end_date: e.target.value }))} className="input w-36" />
            <button onClick={() => setFilters({ start_date: '', end_date: '' })} className="btn-ghost btn-sm">Clear</button>
          </div>
          <Table columns={columns} data={expData?.data || []} loading={isLoading} emptyMessage="No expenses recorded" />
          <Pagination pagination={expData?.pagination} onPage={setPage} />
        </div>

        {/* Chart */}
        <div className="card p-4">
          <h3 className="section-title mb-4 text-sm flex items-center gap-2"><BarChart2 size={15} /> By Category</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-surface-400 text-sm">No expense data</div>
          )}
          <div className="mt-3 space-y-1.5">
            {(summary || []).map((r, i) => (
              <div key={r.category} className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  {r.category}
                </span>
                <span className="font-medium">{formatCurrency(r.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); reset(); }} title="Record Expense" size="md"
        footer={<div className="flex gap-2 justify-end"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button form="exp-form" type="submit" className="btn-primary">{createMutation.isPending ? '...' : 'Save'}</button></div>}
      >
        <form id="exp-form" onSubmit={handleSubmit(d => createMutation.mutate(d))} className="grid grid-cols-2 gap-4">
          <FormField label="Category" required>
            <Select {...register('category', { required: true })} options={EXPENSE_CATEGORIES.map(v => ({ value: v, label: v }))} placeholder="Select category" />
          </FormField>
          <FormField label="Amount (KES)" required>
            <input type="number" step="0.01" className={`input ${errors.amount ? 'input-error' : ''}`} {...register('amount', { required: true })} />
          </FormField>
          <FormField label="Description" required className="col-span-2">
            <input className={`input ${errors.description ? 'input-error' : ''}`} {...register('description', { required: true })} placeholder="What was this expense for?" />
          </FormField>
          <FormField label="Payment Method">
            <Select {...register('payment_method')} options={[{ value: 'cash', label: 'Cash' }, { value: 'mpesa', label: 'M-Pesa' }, { value: 'bank_transfer', label: 'Bank Transfer' }]} />
          </FormField>
          <FormField label="Date">
            <input type="date" className="input" {...register('expense_date')} defaultValue={new Date().toISOString().slice(0,10)} />
          </FormField>
          <FormField label="Reference / Receipt No." className="col-span-2">
            <input className="input" {...register('reference')} placeholder="Optional" />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
