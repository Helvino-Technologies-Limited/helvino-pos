import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../lib/api';
import { StatsCard } from '../components/ui/StatsCard';
import { PageLoader } from '../components/ui/Spinner';
import { formatCurrency, formatDateTime, paymentMethodColor, statusColor } from '../lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useState } from 'react';
import {
  TrendingUp, Monitor, Package, Users, DollarSign, AlertTriangle,
  Clock, ArrowUpRight, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

const CHART_PERIODS = [
  { label: '7 Days', value: '7days' },
  { label: '30 Days', value: '30days' },
  { label: '12 Months', value: '12months' },
];

export default function Dashboard() {
  const [period, setPeriod] = useState('7days');

  const { data: dash, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get(),
    refetchInterval: 60000,
    select: (res) => res.data.data,
  });

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['revenue-chart', period],
    queryFn: () => dashboardApi.revenueChart(period),
    select: (res) => res.data.data,
  });

  if (isLoading) return <PageLoader />;

  const d = dash || {};

  const formattedChart = (chartData || []).map(row => ({
    ...row,
    label: period === '12months'
      ? format(new Date(row.period), 'MMM yy')
      : format(new Date(row.period), 'dd MMM'),
    revenue: parseFloat(row.revenue || 0),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Dashboard</h1>
          <p className="text-sm text-surface-400 mt-0.5">Real-time overview of your business</p>
        </div>
        <button
          onClick={() => refetch()}
          className={`btn-secondary btn-sm ${isFetching ? 'opacity-60' : ''}`}
          disabled={isFetching}
        >
          <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Today's Revenue"
          value={formatCurrency(d.today?.revenue)}
          subtitle={`${d.today?.transactions || 0} transactions`}
          icon={DollarSign}
          color="orange"
        />
        <StatsCard
          title="Net Profit"
          value={formatCurrency(d.today?.net)}
          subtitle={`Expenses: ${formatCurrency(d.today?.expenses)}`}
          icon={TrendingUp}
          color="green"
        />
        <StatsCard
          title="Active Sessions"
          value={d.internet?.active_sessions || 0}
          subtitle={`Est. ${formatCurrency(d.internet?.potential_revenue)}`}
          icon={Monitor}
          color="blue"
        />
        <StatsCard
          title="Low Stock Items"
          value={d.inventory?.low_stock_count || 0}
          subtitle="Needs reorder"
          icon={Package}
          color={d.inventory?.low_stock_count > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Chart + Alerts */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Revenue Trend</h2>
            <div className="flex bg-surface-100 rounded-lg p-0.5 gap-0.5">
              {CHART_PERIODS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${period === p.value ? 'bg-white text-surface-800 shadow-sm' : 'text-surface-500 hover:text-surface-700'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          {chartLoading ? (
            <div className="h-56 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-surface-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={formattedChart} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: 'none', borderRadius: 8, color: '#fafafa', fontSize: 12 }}
                  formatter={(v) => [formatCurrency(v), 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Alerts */}
        <div className="space-y-4">
          {/* Revenue by Type */}
          <div className="card p-4">
            <h3 className="section-title mb-3 text-sm">Today by Type</h3>
            <div className="space-y-2">
              {[
                { label: 'Retail Sales', val: d.revenue_by_type?.retail?.revenue || 0, color: 'bg-orange-400' },
                { label: 'Services', val: d.revenue_by_type?.service?.revenue || 0, color: 'bg-blue-400' },
                { label: 'Mixed', val: d.revenue_by_type?.mixed?.revenue || 0, color: 'bg-purple-400' },
              ].map(item => {
                const total = (d.today?.revenue || 1);
                const pct = ((item.val / total) * 100).toFixed(0);
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-surface-600">{item.label}</span>
                      <span className="font-medium">{formatCurrency(item.val)}</span>
                    </div>
                    <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alerts */}
          {(d.inventory?.low_stock_count > 0 || d.customers?.with_debt > 0) && (
            <div className="card p-4">
              <h3 className="section-title mb-3 text-sm flex items-center gap-2">
                <AlertTriangle size={14} className="text-yellow-500" /> Alerts
              </h3>
              <div className="space-y-2">
                {d.inventory?.low_stock_count > 0 && (
                  <div className="flex items-center gap-2 text-xs p-2 bg-yellow-50 rounded-lg text-yellow-700">
                    <Package size={12} />
                    <span>{d.inventory.low_stock_count} products low on stock</span>
                  </div>
                )}
                {d.customers?.with_debt > 0 && (
                  <div className="flex items-center gap-2 text-xs p-2 bg-red-50 rounded-lg text-red-700">
                    <Users size={12} />
                    <span>{d.customers.with_debt} customers have outstanding debt ({formatCurrency(d.customers.total_debt)})</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shift */}
          {d.open_shift && (
            <div className="card p-4 border-l-4 border-l-green-500">
              <h3 className="text-xs font-semibold text-surface-600 mb-2 flex items-center gap-1">
                <Clock size={12} /> Active Shift
              </h3>
              <p className="text-sm font-medium text-surface-800">{d.open_shift.employee_name}</p>
              <p className="text-xs text-surface-400">Since {formatDateTime(d.open_shift.start_time)}</p>
              <p className="text-sm font-bold text-primary-600 mt-1">{formatCurrency(d.open_shift.total_sales)} collected</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Sales */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <h2 className="section-title">Recent Sales</h2>
          <a href="/sales" className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
            View all <ArrowUpRight size={12} />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 border-b border-surface-100">
              <tr>
                {['Receipt', 'Customer', 'Amount', 'Method', 'Time'].map(h => (
                  <th key={h} className="px-4 py-3 text-left table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(d.recent_sales || []).length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-surface-400 text-sm">No sales today</td></tr>
              ) : (
                (d.recent_sales || []).map((sale) => (
                  <tr key={sale.receipt_number} className="border-b border-surface-50 last:border-0 hover:bg-surface-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-surface-600">{sale.receipt_number}</td>
                    <td className="px-4 py-3 text-surface-700">{sale.customer_name || 'Walk-in'}</td>
                    <td className="px-4 py-3 font-semibold text-surface-900">{formatCurrency(sale.total)}</td>
                    <td className="px-4 py-3">
                      <span className={paymentMethodColor(sale.payment_method)}>
                        {sale.payment_method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-surface-400 text-xs">{formatDateTime(sale.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
