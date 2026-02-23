import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { salesApi } from '../lib/api';
import { formatCurrency, formatDateTime, paymentMethodColor, statusColor, getErrorMessage } from '../lib/utils';
import { Table, Pagination } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { StatsCard } from '../components/ui/StatsCard';
import { FormField, Select } from '../components/ui/FormField';
import { Receipt, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';

export default function Sales() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ start_date: '', end_date: '', payment_method: '', payment_status: '' });
  const [selected, setSelected] = useState(null);

  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales', page, filters],
    queryFn: () => salesApi.list({ page, limit: 20, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) }),
    select: (res) => res.data,
  });

  const { data: summary } = useQuery({
    queryKey: ['daily-summary'],
    queryFn: () => salesApi.dailySummary(),
    select: (res) => res.data.data,
  });

  const { data: saleDetail } = useQuery({
    queryKey: ['sale-detail', selected?.id],
    queryFn: () => salesApi.get(selected.id),
    enabled: !!selected?.id,
    select: (res) => res.data.data,
  });

  const columns = [
    { key: 'receipt_number', label: 'Receipt', render: v => <span className="font-mono text-xs text-surface-600">{v}</span> },
    { key: 'customer_name', label: 'Customer', render: v => v || 'Walk-in' },
    { key: 'cashier_name', label: 'Cashier' },
    { key: 'total', label: 'Total', render: v => <span className="font-bold">{formatCurrency(v)}</span> },
    { key: 'payment_method', label: 'Method', render: v => <span className={paymentMethodColor(v)}>{v}</span> },
    { key: 'payment_status', label: 'Status', render: v => <span className={statusColor(v)}>{v}</span> },
    { key: 'created_at', label: 'Date', render: v => <span className="text-xs">{formatDateTime(v)}</span> },
  ];

  return (
    <div className="space-y-5">
      <h1 className="page-header">Sales History</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="Today Revenue" value={formatCurrency(summary?.total_revenue)} icon={DollarSign} color="orange" />
        <StatsCard title="Transactions" value={summary?.total_transactions || 0} icon={ShoppingCart} color="blue" />
        <StatsCard title="Cash" value={formatCurrency(summary?.cash_revenue)} icon={TrendingUp} color="green" />
        <StatsCard title="M-Pesa" value={formatCurrency(summary?.mpesa_revenue)} icon={Receipt} color="purple" />
      </div>

      <div className="card p-3 flex flex-wrap gap-3">
        <input type="date" value={filters.start_date} onChange={e => setFilters(p => ({ ...p, start_date: e.target.value }))} className="input w-36" />
        <input type="date" value={filters.end_date} onChange={e => setFilters(p => ({ ...p, end_date: e.target.value }))} className="input w-36" />
        <Select value={filters.payment_method} onChange={e => setFilters(p => ({ ...p, payment_method: e.target.value }))}
          options={[{ value: 'cash', label: 'Cash' }, { value: 'mpesa', label: 'M-Pesa' }, { value: 'card', label: 'Card' }, { value: 'credit', label: 'Credit' }]}
          placeholder="All methods" className="w-36" />
        <Select value={filters.payment_status} onChange={e => setFilters(p => ({ ...p, payment_status: e.target.value }))}
          options={[{ value: 'paid', label: 'Paid' }, { value: 'partial', label: 'Partial' }, { value: 'credit', label: 'Credit' }]}
          placeholder="All statuses" className="w-36" />
        <button onClick={() => setFilters({ start_date: '', end_date: '', payment_method: '', payment_status: '' })} className="btn-ghost btn-sm">Clear</button>
      </div>

      <Table columns={columns} data={salesData?.data || []} loading={isLoading} emptyMessage="No sales found" onRowClick={setSelected} />
      <Pagination pagination={salesData?.pagination} onPage={setPage} />

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Sale Detail" size="md">
        {saleDetail && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-mono text-sm text-surface-600">{saleDetail.receipt_number}</p>
                <p className="text-xs text-surface-400">{formatDateTime(saleDetail.created_at)}</p>
                <p className="text-xs text-surface-500 mt-1">Cashier: {saleDetail.cashier_name}</p>
              </div>
              <span className={statusColor(saleDetail.payment_status)}>{saleDetail.payment_status}</span>
            </div>
            <div className="space-y-1 border-t border-surface-100 pt-3">
              {(saleDetail.items || []).filter(Boolean).map((item, i) => (
                <div key={i} className="flex justify-between text-sm py-1">
                  <span className="text-surface-700">{item.name} × {item.quantity}</span>
                  <span className="font-medium">{formatCurrency(item.total_price)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-surface-100 pt-3 space-y-1">
              <div className="flex justify-between text-sm"><span className="text-surface-500">Subtotal</span><span>{formatCurrency(saleDetail.subtotal)}</span></div>
              {parseFloat(saleDetail.discount_amount) > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>-{formatCurrency(saleDetail.discount_amount)}</span></div>}
              <div className="flex justify-between font-bold"><span>Total</span><span className="text-primary-600">{formatCurrency(saleDetail.total)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-surface-500">Paid</span><span>{formatCurrency(saleDetail.paid_amount)}</span></div>
              {parseFloat(saleDetail.change_given) > 0 && <div className="flex justify-between text-sm text-blue-600"><span>Change</span><span>{formatCurrency(saleDetail.change_given)}</span></div>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
