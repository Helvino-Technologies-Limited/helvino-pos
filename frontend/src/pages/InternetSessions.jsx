import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { internetApi, customersApi } from '../lib/api';
import { formatCurrency, formatTime, formatDuration, getErrorMessage, statusColor } from '../lib/utils';
import { Monitor, Play, Square, DollarSign, Plus, RefreshCw, Wifi } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { PageLoader } from '../components/ui/Spinner';
import { Table } from '../components/ui/Table';
import { FormField, Select } from '../components/ui/FormField';
import toast from 'react-hot-toast';
import { useQuery as useQ } from '@tanstack/react-query';

export default function InternetSessions() {
  const queryClient = useQueryClient();
  const [showStartModal, setShowStartModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(null);
  const [showEndModal, setShowEndModal] = useState(null);
  const [startForm, setStartForm] = useState({ computer_id: '', customer_search: '', rate_per_hour: 30, payment_method: 'cash', paid_amount: 0 });
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [historyPage, setHistoryPage] = useState(1);
  const [tab, setTab] = useState('active');

  const { data: computers } = useQuery({
    queryKey: ['computers'],
    queryFn: () => internetApi.computers(),
    refetchInterval: 10000,
    select: (res) => res.data.data,
  });

  const { data: activeSessions, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['active-sessions'],
    queryFn: () => internetApi.active(),
    refetchInterval: 15000,
    select: (res) => res.data.data,
  });

  const { data: history } = useQuery({
    queryKey: ['session-history', historyPage],
    queryFn: () => internetApi.history({ limit: 20, offset: (historyPage - 1) * 20 }),
    enabled: tab === 'history',
    select: (res) => res.data.data,
  });

  const { data: customerResults } = useQuery({
    queryKey: ['cust-search', startForm.customer_search],
    queryFn: () => customersApi.list({ search: startForm.customer_search, limit: 5 }),
    enabled: startForm.customer_search.length > 1,
    select: (res) => res.data.data,
  });

  const startMutation = useMutation({
    mutationFn: (data) => internetApi.start(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['active-sessions']);
      queryClient.invalidateQueries(['computers']);
      setShowStartModal(false);
      setStartForm({ computer_id: '', customer_search: '', rate_per_hour: 30, payment_method: 'cash', paid_amount: 0 });
      toast.success('Session started!');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const endMutation = useMutation({
    mutationFn: (id) => internetApi.end(id, {}),
    onSuccess: () => {
      queryClient.invalidateQueries(['active-sessions']);
      queryClient.invalidateQueries(['computers']);
      setShowEndModal(null);
      toast.success('Session ended');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const payMutation = useMutation({
    mutationFn: ({ id, data }) => internetApi.pay(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['active-sessions']);
      setShowPayModal(null);
      setPayAmount('');
      toast.success('Payment recorded');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const available = (computers || []).filter(c => c.status === 'available');
  const inUse = (computers || []).filter(c => c.status === 'in_use');
  const maintenance = (computers || []).filter(c => c.status === 'maintenance');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-header">Internet Sessions</h1>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className={`btn-secondary btn-sm ${isFetching ? 'opacity-60' : ''}`} disabled={isFetching}>
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => setShowStartModal(true)} className="btn-primary btn-sm">
            <Plus size={14} /> New Session
          </button>
        </div>
      </div>

      {/* Computer Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {(computers || []).map(comp => {
          const session = comp.active_session;
          const colors = {
            available: 'border-green-200 bg-green-50',
            in_use: 'border-blue-200 bg-blue-50',
            maintenance: 'border-yellow-200 bg-yellow-50',
            offline: 'border-surface-200 bg-surface-50',
          };
          return (
            <div key={comp.id} className={`card p-3 border-2 ${colors[comp.status] || colors.offline} transition-all`}>
              <div className="flex items-center justify-between mb-2">
                <Monitor size={18} className={`${comp.status === 'in_use' ? 'text-blue-600 animate-pulse-slow' : comp.status === 'available' ? 'text-green-600' : 'text-yellow-600'}`} />
                <span className="text-[10px] font-bold text-surface-500">#{comp.station_number}</span>
              </div>
              <p className="text-xs font-semibold text-surface-800 truncate">{comp.name}</p>
              {session ? (
                <div className="mt-1">
                  <p className="text-[10px] text-blue-600 font-medium">{session.customer_name || 'Guest'}</p>
                  <p className="text-[10px] text-surface-400">{formatDuration(session.duration_minutes)}</p>
                  <p className="text-xs font-bold text-blue-700">{formatCurrency(session.current_cost)}</p>
                </div>
              ) : (
                <span className={`text-[10px] font-medium mt-1 block ${comp.status === 'available' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {comp.status}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Available', val: available.length, color: 'text-green-600 bg-green-50', icon: '✓' },
          { label: 'In Use', val: inUse.length, color: 'text-blue-600 bg-blue-50', icon: '●' },
          { label: 'Maintenance', val: maintenance.length, color: 'text-yellow-600 bg-yellow-50', icon: '⚠' },
        ].map(s => (
          <div key={s.label} className={`card p-3 ${s.color} flex items-center gap-3`}>
            <span className="text-lg">{s.icon}</span>
            <div>
              <p className="font-display text-xl font-bold">{s.val}</p>
              <p className="text-xs opacity-80">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 p-1 rounded-xl w-fit">
        {[{ key: 'active', label: 'Active Sessions' }, { key: 'history', label: 'History' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-white shadow-sm text-surface-800' : 'text-surface-500 hover:text-surface-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'active' && (
        isLoading ? <PageLoader /> : (
          <div className="space-y-2">
            {(activeSessions || []).length === 0 ? (
              <div className="card p-12 text-center">
                <Wifi size={40} className="text-surface-200 mx-auto mb-3" />
                <p className="text-surface-400">No active sessions</p>
              </div>
            ) : (
              (activeSessions || []).map(s => (
                <div key={s.id} className="card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Monitor size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-surface-900 text-sm">{s.computer_name} <span className="text-surface-400">#{s.station_number}</span></p>
                      <p className="text-xs text-surface-500">{s.customer_name || 'Guest'} • {s.ticket_number}</p>
                    </div>
                  </div>
                  <div className="flex gap-6 ml-0 sm:ml-auto text-center">
                    <div>
                      <p className="text-xs text-surface-400">Started</p>
                      <p className="text-sm font-medium">{formatTime(s.start_time)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-surface-400">Duration</p>
                      <p className="text-sm font-medium">{formatDuration(s.current_duration_minutes)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-surface-400">Amount</p>
                      <p className="text-sm font-bold text-primary-600">{formatCurrency(s.current_cost)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setShowPayModal(s); setPayAmount(''); }} className="btn-secondary btn-sm">
                      <DollarSign size={12} /> Pay
                    </button>
                    <button onClick={() => setShowEndModal(s)} className="btn-danger btn-sm">
                      <Square size={12} /> End
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )
      )}

      {tab === 'history' && (
        <Table
          columns={[
            { key: 'ticket_number', label: 'Ticket', render: v => <span className="font-mono text-xs">{v}</span> },
            { key: 'computer_name', label: 'Computer' },
            { key: 'customer_name', label: 'Customer', render: v => v || 'Guest' },
            { key: 'actual_duration_minutes', label: 'Duration', render: v => formatDuration(v) },
            { key: 'cost', label: 'Cost', render: v => formatCurrency(v) },
            { key: 'status', label: 'Status', render: v => <span className={statusColor(v)}>{v}</span> },
          ]}
          data={history || []}
          emptyMessage="No session history"
        />
      )}

      {/* Start Session Modal */}
      <Modal open={showStartModal} onClose={() => setShowStartModal(false)} title="Start Internet Session"
        footer={
          <button onClick={() => startMutation.mutate({ computer_id: startForm.computer_id, rate_per_hour: startForm.rate_per_hour, payment_method: startForm.payment_method, paid_amount: startForm.paid_amount, customer_id: startForm.customer_id })}
            disabled={!startForm.computer_id || startMutation.isPending} className="btn-primary w-full justify-center">
            {startMutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Play size={14} /> Start Session</>}
          </button>
        }
      >
        <div className="space-y-4">
          <FormField label="Computer" required>
            <Select
              value={startForm.computer_id}
              onChange={e => setStartForm(p => ({ ...p, computer_id: e.target.value }))}
              options={available.map(c => ({ value: c.id, label: `${c.name} (#${c.station_number})` }))}
              placeholder="Select computer"
            />
          </FormField>
          <FormField label="Rate per Hour (KES)">
            <input type="number" className="input" value={startForm.rate_per_hour} onChange={e => setStartForm(p => ({ ...p, rate_per_hour: e.target.value }))} />
          </FormField>
          <FormField label="Customer (optional)">
            <input className="input" placeholder="Search customer..." value={startForm.customer_search} onChange={e => setStartForm(p => ({ ...p, customer_search: e.target.value, customer_id: null }))} />
            {(customerResults || []).map(c => (
              <button key={c.id} onClick={() => setStartForm(p => ({ ...p, customer_id: c.id, customer_search: `${c.name} (${c.phone})` }))}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-surface-50 rounded-lg">{c.name} — {c.phone}</button>
            ))}
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Payment Method">
              <Select value={startForm.payment_method} onChange={e => setStartForm(p => ({ ...p, payment_method: e.target.value }))}
                options={[{ value: 'cash', label: 'Cash' }, { value: 'mpesa', label: 'M-Pesa' }, { value: 'account', label: 'Account' }]} />
            </FormField>
            <FormField label="Prepaid Amount (KES)">
              <input type="number" className="input" value={startForm.paid_amount} onChange={e => setStartForm(p => ({ ...p, paid_amount: e.target.value }))} placeholder="0" />
            </FormField>
          </div>
        </div>
      </Modal>

      {/* End Session Confirm */}
      <Modal open={!!showEndModal} onClose={() => setShowEndModal(null)} title="End Session" size="sm">
        {showEndModal && (
          <div className="text-center space-y-4">
            <p className="text-surface-600">End session for <strong>{showEndModal.computer_name}</strong>?</p>
            <p className="text-2xl font-bold text-primary-600">{formatCurrency(showEndModal.current_cost)}</p>
            <div className="flex gap-2">
              <button onClick={() => setShowEndModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={() => endMutation.mutate(showEndModal.id)} disabled={endMutation.isPending} className="btn-danger flex-1 justify-center">
                {endMutation.isPending ? '...' : 'End Session'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Pay Session Modal */}
      <Modal open={!!showPayModal} onClose={() => setShowPayModal(null)} title="Collect Payment" size="sm">
        {showPayModal && (
          <div className="space-y-4">
            <div className="bg-surface-50 rounded-xl p-4 text-center">
              <p className="text-xs text-surface-500">Current Amount Due</p>
              <p className="font-display text-2xl font-bold">{formatCurrency(showPayModal.current_cost)}</p>
            </div>
            <FormField label="Amount">
              <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="input text-lg font-bold" autoFocus />
            </FormField>
            <FormField label="Method">
              <Select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                options={[{ value: 'cash', label: 'Cash' }, { value: 'mpesa', label: 'M-Pesa' }]} />
            </FormField>
            <button onClick={() => payMutation.mutate({ id: showPayModal.id, data: { amount: payAmount, payment_method: payMethod } })}
              disabled={!payAmount || payMutation.isPending} className="btn-primary w-full justify-center">
              {payMutation.isPending ? '...' : 'Confirm Payment'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
