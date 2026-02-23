import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../lib/api';
import { formatCurrency, formatNumber } from '../lib/utils';
import { StatsCard } from '../components/ui/StatsCard';
import { PageLoader } from '../components/ui/Spinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Package, Wrench, Monitor, Box } from 'lucide-react';

const DateRange = ({ value, onChange }) => (
  <div className="flex gap-2 flex-wrap">
    <input type="date" value={value.start_date} onChange={e => onChange(p => ({ ...p, start_date: e.target.value }))} className="input w-36" />
    <input type="date" value={value.end_date} onChange={e => onChange(p => ({ ...p, end_date: e.target.value }))} className="input w-36" />
  </div>
);

export default function Reports() {
  const today = new Date().toISOString().slice(0,10);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10);
  const [plRange, setPlRange] = useState({ start_date: monthStart, end_date: today });
  const [tab, setTab] = useState('pl');

  const { data: pl, isLoading: plLoading } = useQuery({
    queryKey: ['pl', plRange],
    queryFn: () => reportsApi.profitLoss(plRange),
    select: (res) => res.data.data,
  });

  const { data: topProducts } = useQuery({
    queryKey: ['top-products', plRange],
    queryFn: () => reportsApi.topProducts({ ...plRange, limit: 10 }),
    select: (res) => res.data.data,
  });

  const { data: topServices } = useQuery({
    queryKey: ['top-services', plRange],
    queryFn: () => reportsApi.topServices(plRange),
    select: (res) => res.data.data,
  });

  const { data: internetReport } = useQuery({
    queryKey: ['internet-report', plRange],
    queryFn: () => reportsApi.internetUsage(plRange),
    select: (res) => res.data.data,
    enabled: tab === 'internet',
  });

  const { data: stockReport } = useQuery({
    queryKey: ['stock-report'],
    queryFn: () => reportsApi.stock(),
    select: (res) => res.data.data,
    enabled: tab === 'stock',
  });

  const tabs = [
    { key: 'pl', label: 'P&L', icon: TrendingUp },
    { key: 'products', label: 'Top Products', icon: Package },
    { key: 'internet', label: 'Internet', icon: Monitor },
    { key: 'stock', label: 'Stock', icon: Box },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-header">Reports & Analytics</h1>
        <DateRange value={plRange} onChange={setPlRange} />
      </div>

      <div className="flex gap-1 bg-surface-100 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-white shadow-sm text-surface-800' : 'text-surface-500 hover:text-surface-700'}`}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      {tab === 'pl' && (
        plLoading ? <PageLoader /> : pl ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatsCard title="Gross Revenue" value={formatCurrency(pl.revenue?.gross)} icon={TrendingUp} color="green" />
              <StatsCard title="Cost of Goods" value={formatCurrency(pl.cost_of_goods_sold)} icon={Package} color="orange" />
              <StatsCard title="Gross Profit" value={formatCurrency(pl.gross_profit)} subtitle={`${pl.gross_margin}% margin`} color="blue" />
              <StatsCard title="Net Profit" value={formatCurrency(pl.net_profit)} subtitle={`${pl.net_margin}% margin`} color={parseFloat(pl.net_profit) >= 0 ? 'green' : 'red'} />
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="card p-5">
                <h3 className="section-title mb-4">Revenue Breakdown</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Gross Revenue', val: pl.revenue?.gross, color: 'bg-blue-400' },
                    { label: 'Discounts', val: pl.revenue?.discounts, color: 'bg-orange-400', negative: true },
                    { label: 'Net Revenue', val: pl.revenue?.net, color: 'bg-green-400' },
                    { label: 'Cost of Goods', val: pl.cost_of_goods_sold, color: 'bg-red-400', negative: true },
                    { label: 'Gross Profit', val: pl.gross_profit, color: 'bg-emerald-400' },
                    { label: 'Total Expenses', val: pl.expenses?.total, color: 'bg-red-500', negative: true },
                    { label: 'Net Profit', val: pl.net_profit, color: 'bg-primary-500', bold: true },
                  ].map(r => (
                    <div key={r.label} className={`flex justify-between items-center py-1.5 ${r.bold ? 'border-t border-surface-100 pt-2.5 font-bold' : ''}`}>
                      <span className={`text-sm flex items-center gap-2 ${r.bold ? 'text-surface-900' : 'text-surface-600'}`}>
                        <span className={`w-2 h-2 rounded-full ${r.color}`} />{r.label}
                      </span>
                      <span className={`text-sm ${r.negative ? 'text-red-600' : r.bold ? 'text-primary-600 text-base font-bold' : 'text-surface-800'}`}>
                        {r.negative ? '-' : ''}{formatCurrency(r.val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card p-5">
                <h3 className="section-title mb-4">Expenses by Category</h3>
                <div className="space-y-2">
                  {(pl.expenses?.by_category || []).map(e => (
                    <div key={e.category} className="flex justify-between items-center">
                      <span className="text-sm text-surface-600">{e.category}</span>
                      <span className="text-sm font-medium text-red-600">{formatCurrency(e.category_total)}</span>
                    </div>
                  ))}
                  {(pl.expenses?.by_category || []).length === 0 && <p className="text-sm text-surface-400">No expenses in this period</p>}
                </div>
              </div>
            </div>
          </div>
        ) : <p className="text-surface-400">No data available</p>
      )}

      {tab === 'products' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="section-title mb-4">Top Products by Revenue</h3>
            <div className="space-y-2">
              {(topProducts || []).map((p, i) => (
                <div key={p.sku} className="flex items-center gap-3">
                  <span className="w-5 text-xs text-surface-400 font-bold">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-800 truncate">{p.name}</p>
                    <p className="text-xs text-surface-400">{formatNumber(p.units_sold)} units</p>
                  </div>
                  <span className="text-sm font-bold text-primary-600">{formatCurrency(p.revenue)}</span>
                </div>
              ))}
              {(topProducts || []).length === 0 && <p className="text-sm text-surface-400">No product data</p>}
            </div>
          </div>
          <div className="card p-5">
            <h3 className="section-title mb-4">Top Services by Revenue</h3>
            <div className="space-y-2">
              {(topServices || []).map((s, i) => (
                <div key={s.service_id || i} className="flex items-center gap-3">
                  <span className="w-5 text-xs text-surface-400 font-bold">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-800 truncate">{s.name}</p>
                    <p className="text-xs text-surface-400">{formatNumber(s.usage_count)} uses</p>
                  </div>
                  <span className="text-sm font-bold text-primary-600">{formatCurrency(s.revenue)}</span>
                </div>
              ))}
              {(topServices || []).length === 0 && <p className="text-sm text-surface-400">No service data</p>}
            </div>
          </div>
        </div>
      )}

      {tab === 'internet' && internetReport && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatsCard title="Total Sessions" value={internetReport.summary?.total_sessions} icon={Monitor} color="blue" />
            <StatsCard title="Revenue" value={formatCurrency(internetReport.summary?.total_revenue)} color="green" />
            <StatsCard title="Avg Duration" value={`${Math.round(internetReport.summary?.avg_session_minutes || 0)}m`} color="orange" />
            <StatsCard title="Unpaid" value={internetReport.summary?.unpaid_sessions || 0} color="red" />
          </div>
          {(internetReport.hourly_distribution || []).length > 0 && (
            <div className="card p-5">
              <h3 className="section-title mb-4">Hourly Usage Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={internetReport.hourly_distribution.map(r => ({ hour: `${r.hour}:00`, sessions: parseInt(r.sessions) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="sessions" fill="#f97316" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {tab === 'stock' && stockReport && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatsCard title="Total Products" value={stockReport.summary?.total_products} icon={Package} color="blue" />
            <StatsCard title="Stock Value" value={formatCurrency(stockReport.summary?.total_stock_value)} color="green" />
            <StatsCard title="Low Stock" value={stockReport.summary?.low_stock} color="yellow" />
            <StatsCard title="Out of Stock" value={stockReport.summary?.out_of_stock} color="red" />
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-50 border-b border-surface-100">
                  <tr>{['Product','SKU','Stock','Reorder Level','Stock Value','Status'].map(h => <th key={h} className="px-4 py-3 text-left table-header">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {(stockReport.products || []).map(p => (
                    <tr key={p.id} className="border-b border-surface-50 last:border-0 hover:bg-surface-50/50">
                      <td className="px-4 py-2.5 font-medium text-surface-800">{p.name}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-surface-500">{p.sku}</td>
                      <td className="px-4 py-2.5 font-bold">{p.quantity}</td>
                      <td className="px-4 py-2.5 text-surface-500">{p.reorder_level}</td>
                      <td className="px-4 py-2.5">{formatCurrency(p.stock_value)}</td>
                      <td className="px-4 py-2.5"><span className={`badge ${p.stock_status === 'in_stock' ? 'badge-green' : p.stock_status === 'low_stock' ? 'badge-yellow' : 'badge-red'}`}>{p.stock_status?.replace('_', ' ')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
