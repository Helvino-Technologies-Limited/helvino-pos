import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftsApi } from '../lib/api';
import { formatCurrency, formatDateTime, getErrorMessage } from '../lib/utils';
import { Table } from '../components/ui/Table';
import { PageLoader } from '../components/ui/Spinner';
import { useState } from 'react';
import { Clock, Play, Square } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { FormField } from '../components/ui/FormField';
import toast from 'react-hot-toast';

export default function Shifts() {
  const queryClient = useQueryClient();
  const [showOpen, setShowOpen] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [openCash, setOpenCash] = useState('');
  const [closeCash, setCloseCash] = useState('');

  const { data: current, isLoading } = useQuery({
    queryKey: ['current-shift'],
    queryFn: () => shiftsApi.current(),
    select: (res) => res.data.data,
  });

  const { data: history } = useQuery({
    queryKey: ['shift-history'],
    queryFn: () => shiftsApi.history({ limit: 20 }),
    select: (res) => res.data.data,
  });

  const openMutation = useMutation({
    mutationFn: (data) => shiftsApi.open(data),
    onSuccess: () => { queryClient.invalidateQueries(['current-shift']); queryClient.invalidateQueries(['shift-history']); setShowOpen(false); toast.success('Shift opened!'); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const closeMutation = useMutation({
    mutationFn: (data) => shiftsApi.close(data),
    onSuccess: () => { queryClient.invalidateQueries(['current-shift']); queryClient.invalidateQueries(['shift-history']); setShowClose(false); toast.success('Shift closed'); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const columns = [
    { key: 'employee_name', label: 'Employee' },
    { key: 'start_time', label: 'Started', render: v => formatDateTime(v) },
    { key: 'end_time', label: 'Ended', render: v => v ? formatDateTime(v) : '—' },
    { key: 'opening_cash', label: 'Opening', render: v => formatCurrency(v) },
    { key: 'total_sales', label: 'Total Sales', render: v => <span className="font-bold text-primary-600">{formatCurrency(v)}</span> },
    { key: 'total_cash', label: 'Cash', render: v => formatCurrency(v) },
    { key: 'total_mpesa', label: 'M-Pesa', render: v => formatCurrency(v) },
    { key: 'status', label: 'Status', render: v => <span className={v === 'open' ? 'badge-green' : 'badge-gray'}>{v}</span> },
  ];

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-header">Shifts</h1>
        {!current ? (
          <button onClick={() => setShowOpen(true)} className="btn-primary btn-sm"><Play size={14} /> Open Shift</button>
        ) : (
          <button onClick={() => setShowClose(true)} className="btn-danger btn-sm"><Square size={14} /> Close Shift</button>
        )}
      </div>

      {current && (
        <div className="card p-5 border-l-4 border-l-green-500 bg-green-50/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Clock size={22} className="text-green-600" />
              </div>
              <div>
                <p className="font-display font-bold text-surface-900">Shift Active</p>
                <p className="text-sm text-surface-500">Started: {formatDateTime(current.start_time)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-surface-500">Total Sales</p>
              <p className="font-display text-2xl font-bold text-primary-600">{formatCurrency(current.total_sales)}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-green-200">
            {[
              { label: 'Cash', val: current.total_cash },
              { label: 'M-Pesa', val: current.total_mpesa },
              { label: 'Card', val: current.total_card },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-xs text-surface-500">{s.label}</p>
                <p className="font-bold text-surface-800">{formatCurrency(s.val)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="section-title">Shift History</h2>
      <Table columns={columns} data={history || []} emptyMessage="No shifts recorded" />

      <Modal open={showOpen} onClose={() => setShowOpen(false)} title="Open Shift" size="sm">
        <div className="space-y-4">
          <FormField label="Opening Cash Float (KES)">
            <input type="number" className="input text-lg font-bold" value={openCash} onChange={e => setOpenCash(e.target.value)} placeholder="0.00" autoFocus />
          </FormField>
          <button onClick={() => openMutation.mutate({ opening_cash: openCash || 0 })} disabled={openMutation.isPending} className="btn-primary w-full justify-center">
            {openMutation.isPending ? '...' : 'Open Shift'}
          </button>
        </div>
      </Modal>

      <Modal open={showClose} onClose={() => setShowClose(false)} title="Close Shift" size="sm">
        <div className="space-y-4">
          {current && <div className="bg-surface-50 p-4 rounded-xl text-center">
            <p className="text-xs text-surface-500">Total Sales this Shift</p>
            <p className="font-display text-2xl font-bold text-primary-600">{formatCurrency(current.total_sales)}</p>
          </div>}
          <FormField label="Cash in Drawer (Closing Count) KES">
            <input type="number" className="input text-lg font-bold" value={closeCash} onChange={e => setCloseCash(e.target.value)} placeholder="0.00" autoFocus />
          </FormField>
          <button onClick={() => closeMutation.mutate({ closing_cash: closeCash })} disabled={!closeCash || closeMutation.isPending} className="btn-danger w-full justify-center">
            {closeMutation.isPending ? '...' : 'Close Shift'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
