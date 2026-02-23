import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '../lib/api';
import { formatCurrency, formatDate, getErrorMessage } from '../lib/utils';
import { Table, Pagination } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { FormField, Select } from '../components/ui/FormField';
import { Plus, Search, Users, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

export default function Customers() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [showTopUp, setShowTopUp] = useState(null);
  const [topUpAmount, setTopUpAmount] = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: custData, isLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: () => customersApi.list({ page, limit: 20, search }),
    select: (res) => res.data,
  });

  const { data: detail } = useQuery({
    queryKey: ['customer-detail', showDetail?.id],
    queryFn: () => customersApi.get(showDetail.id),
    enabled: !!showDetail?.id,
    select: (res) => res.data.data,
  });

  const createMutation = useMutation({
    mutationFn: (data) => customersApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['customers']); setShowModal(false); reset(); toast.success('Customer added'); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const topUpMutation = useMutation({
    mutationFn: ({ id, amount }) => customersApi.topUp(id, { amount, description: 'Manual top-up' }),
    onSuccess: () => { queryClient.invalidateQueries(['customers']); setShowTopUp(null); setTopUpAmount(''); toast.success('Account topped up'); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const columns = [
    { key: 'name', label: 'Name', render: (v, r) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">{v[0]}</div>
        <div><p className="font-medium text-surface-800 text-sm">{v}</p>{r.is_student && <span className="text-[10px] text-blue-600 font-medium">Student</span>}</div>
      </div>
    )},
    { key: 'phone', label: 'Phone' },
    { key: 'customer_group', label: 'Group', render: v => <span className="badge badge-gray capitalize">{v?.replace('_', ' ')}</span> },
    { key: 'account_balance', label: 'Balance', render: v => <span className={`font-semibold ${parseFloat(v) < 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(v)}</span> },
    { key: 'loyalty_points', label: 'Points', render: v => `${v || 0} pts` },
    { key: 'id', label: 'Actions', render: (v, r) => (
      <div className="flex gap-1">
        <button onClick={e => { e.stopPropagation(); setShowDetail(r); }} className="btn-secondary btn-sm">View</button>
        <button onClick={e => { e.stopPropagation(); setShowTopUp(r); }} className="btn-ghost btn-sm text-green-600">Top Up</button>
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-header">Customers</h1>
        <button onClick={() => { reset(); setShowModal(true); }} className="btn-primary btn-sm"><Plus size={14} /> Add Customer</button>
      </div>

      <div className="card p-3 flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search customers..." className="input pl-9 text-sm" />
        </div>
      </div>

      <Table columns={columns} data={custData?.data || []} loading={isLoading} emptyMessage="No customers found" />
      <Pagination pagination={custData?.pagination} onPage={setPage} />

      {/* Add Modal */}
      <Modal open={showModal} onClose={() => { setShowModal(false); reset(); }} title="Add Customer" size="lg"
        footer={<div className="flex gap-2 justify-end"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button form="cust-form" type="submit" className="btn-primary">{createMutation.isPending ? '...' : 'Create'}</button></div>}
      >
        <form id="cust-form" onSubmit={handleSubmit(d => createMutation.mutate(d))} className="grid grid-cols-2 gap-4">
          <FormField label="Full Name" required className="col-span-2">
            <input className={`input ${errors.name ? 'input-error' : ''}`} {...register('name', { required: 'Required' })} />
          </FormField>
          <FormField label="Phone"><input className="input" {...register('phone')} placeholder="0712345678" /></FormField>
          <FormField label="Email"><input type="email" className="input" {...register('email')} /></FormField>
          <FormField label="Customer Group">
            <Select {...register('customer_group')} options={['walk_in','student','staff','vip','regular'].map(v => ({ value: v, label: v.replace('_', ' ') }))} />
          </FormField>
          <FormField label="Credit Limit (KES)">
            <input type="number" className="input" {...register('credit_limit')} defaultValue={0} />
          </FormField>
          <FormField label="Student?" className="col-span-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...register('is_student')} className="rounded text-primary-600" />
              This customer is a student
            </label>
          </FormField>
        </form>
      </Modal>

      {/* Top Up Modal */}
      <Modal open={!!showTopUp} onClose={() => setShowTopUp(null)} title={`Top Up: ${showTopUp?.name}`} size="sm">
        <div className="space-y-4">
          <div className="bg-surface-50 p-3 rounded-xl text-center">
            <p className="text-xs text-surface-500">Current Balance</p>
            <p className="font-display text-2xl font-bold">{formatCurrency(showTopUp?.account_balance)}</p>
          </div>
          <FormField label="Amount to Add (KES)">
            <input type="number" className="input text-lg font-bold" value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} autoFocus placeholder="0.00" />
          </FormField>
          <button onClick={() => topUpMutation.mutate({ id: showTopUp?.id, amount: topUpAmount })}
            disabled={!topUpAmount || topUpMutation.isPending} className="btn-primary w-full justify-center">
            {topUpMutation.isPending ? '...' : 'Confirm Top Up'}
          </button>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!showDetail} onClose={() => setShowDetail(null)} title="Customer Details" size="lg">
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-surface-50 rounded-xl">
              <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl">{detail.name[0]}</div>
              <div>
                <p className="font-display font-bold text-surface-900 text-lg">{detail.name}</p>
                <p className="text-sm text-surface-500">{detail.phone} {detail.email && `• ${detail.email}`}</p>
                <p className="text-sm font-semibold mt-1" style={{ color: parseFloat(detail.account_balance) < 0 ? '#dc2626' : '#16a34a' }}>
                  Balance: {formatCurrency(detail.account_balance)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Recent Transactions</p>
              <div className="space-y-1 max-h-52 overflow-y-auto scrollbar-thin">
                {(detail.recent_transactions || []).map(t => (
                  <div key={t.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-surface-50 text-sm">
                    <span className="text-surface-600">{t.description}</span>
                    <span className={`font-medium ${t.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.transaction_type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                  </div>
                ))}
                {(detail.recent_transactions || []).length === 0 && <p className="text-sm text-surface-400 text-center py-4">No transactions yet</p>}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
