import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { internetApi, customersApi, computersApi } from '../lib/api';
import { formatCurrency, formatTime, formatDuration, getErrorMessage, statusColor } from '../lib/utils';
import {
  Monitor, Play, Square, DollarSign, Plus, RefreshCw,
  Wifi, Edit2, Wrench, CheckCircle, Power, Save, X,
  Cpu, Hash, Network, FileText
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { PageLoader } from '../components/ui/Spinner';
import { Table } from '../components/ui/Table';
import { FormField, Select } from '../components/ui/FormField';
import toast from 'react-hot-toast';

/* ── Status config ── */
const STATUS_STYLES = {
  available:   { border: 'border-green-200',  bg: 'bg-green-50',   text: 'text-green-600',  label: 'Available'   },
  in_use:      { border: 'border-blue-200',   bg: 'bg-blue-50',    text: 'text-blue-600',   label: 'In Use'      },
  maintenance: { border: 'border-amber-200',  bg: 'bg-amber-50',   text: 'text-amber-600',  label: 'Maintenance' },
  offline:     { border: 'border-surface-200',bg: 'bg-surface-50', text: 'text-surface-400',label: 'Offline'     },
};

/* ── Computer card (in the grid) ── */
const ComputerCard = ({ comp, onEdit, onStatusChange }) => {
  const s = STATUS_STYLES[comp.status] || STATUS_STYLES.offline;
  const session = comp.active_session;

  return (
    <div className={`card p-3 border-2 ${s.border} ${s.bg} transition-all`}>
      <div className="flex items-start justify-between mb-2">
        <Monitor size={18} className={`${s.text} ${comp.status === 'in_use' ? 'animate-pulse' : ''}`} />
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-surface-400">#{comp.station_number}</span>
          {onEdit && (
            <button onClick={() => onEdit(comp)}
              className="p-0.5 rounded hover:bg-white/60 text-surface-400 hover:text-surface-700 transition-colors">
              <Edit2 size={11} />
            </button>
          )}
        </div>
      </div>
      <p className="text-xs font-semibold text-surface-800 truncate">{comp.name}</p>
      {session ? (
        <div className="mt-1 space-y-0.5">
          <p className="text-[10px] text-blue-600 font-medium truncate">{session.customer_name || 'Guest'}</p>
          <p className="text-[10px] text-surface-400">{formatDuration(session.duration_minutes)}</p>
          <p className="text-xs font-bold text-blue-700">{formatCurrency(session.current_cost)}</p>
        </div>
      ) : (
        <span className={`text-[10px] font-medium mt-1 block capitalize ${s.text}`}>
          {s.label}
        </span>
      )}
    </div>
  );
};

/* ── Computer form modal ── */
const ComputerModal = ({ open, onClose, computer, onSave, isPending }) => {
  const isEdit = !!computer;
  const [form, setForm] = useState({
    name:           computer?.name           || '',
    station_number: computer?.station_number || '',
    ip_address:     computer?.ip_address     || '',
    mac_address:    computer?.mac_address    || '',
    specs:          computer?.specs          || '',
    status:         computer?.status         || 'available',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? `Edit — ${computer.name}` : 'Add New Computer'}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Computer Name *</label>
            <div className="relative">
              <Monitor size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input className="input pl-9" placeholder="e.g. PC-01 or Gaming Rig"
                value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Station Number *</label>
            <div className="relative">
              <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input className="input pl-9" type="number" min={1} placeholder="1"
                value={form.station_number} onChange={e => set('station_number', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input appearance-none" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="available">Available</option>
              <option value="maintenance">Maintenance</option>
              <option value="offline">Offline</option>
            </select>
          </div>
          <div>
            <label className="label">IP Address</label>
            <div className="relative">
              <Network size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input className="input pl-9" placeholder="192.168.1.10"
                value={form.ip_address} onChange={e => set('ip_address', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">MAC Address</label>
            <div className="relative">
              <Cpu size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input className="input pl-9" placeholder="AA:BB:CC:DD:EE:FF"
                value={form.mac_address} onChange={e => set('mac_address', e.target.value)} />
            </div>
          </div>
          <div className="col-span-2">
            <label className="label">Specs / Notes</label>
            <div className="relative">
              <FileText size={14} className="absolute left-3 top-3 text-surface-400" />
              <textarea className="input pl-9 resize-none" rows={2}
                placeholder="e.g. Intel i5, 8GB RAM, 500GB SSD"
                value={form.specs} onChange={e => set('specs', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <button onClick={onClose} className="btn btn-secondary">
            <X size={14} /> Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.name || !form.station_number || isPending}
            className="btn btn-primary">
            {isPending
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Save size={14} /> {isEdit ? 'Save Changes' : 'Add Computer'}</>}
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* ══════════════════════════════════════════════════════════════ */
export default function InternetSessions() {
  const queryClient = useQueryClient();
  const [tab, setTab]                   = useState('active');
  const [showStartModal, setShowStartModal] = useState(false);
  const [showPayModal, setShowPayModal]   = useState(null);
  const [showEndModal, setShowEndModal]   = useState(null);
  const [showCompModal, setShowCompModal] = useState(false);
  const [editingComp, setEditingComp]     = useState(null);
  const [historyPage, setHistoryPage]     = useState(1);
  const [startForm, setStartForm]         = useState({
    computer_id: '', customer_search: '', customer_id: null,
    rate_per_hour: 30, payment_method: 'cash', paid_amount: 0,
  });
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');

  /* ── Queries ── */
  const { data: computers, refetch: refetchComputers } = useQuery({
    queryKey: ['computers'],
    queryFn: () => internetApi.computers().then(r => r.data.data),
    refetchInterval: 15000,
  });

  const { data: activeSessions, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['active-sessions'],
    queryFn: () => internetApi.active().then(r => r.data.data),
    refetchInterval: 15000,
  });

  const { data: history } = useQuery({
    queryKey: ['session-history', historyPage],
    queryFn: () => internetApi.history({ limit: 20, offset: (historyPage - 1) * 20 }).then(r => r.data.data),
    enabled: tab === 'history',
  });

  const { data: customerResults } = useQuery({
    queryKey: ['cust-search', startForm.customer_search],
    queryFn: () => customersApi.list({ search: startForm.customer_search, limit: 5 }).then(r => r.data.data),
    enabled: startForm.customer_search.length > 1 && !startForm.customer_id,
  });

  /* ── Computer mutations ── */
  const createComp = useMutation({
    mutationFn: computersApi.create,
    onSuccess: () => {
      toast.success('Computer added');
      queryClient.invalidateQueries(['computers']);
      setShowCompModal(false);
    },
    onError: e => toast.error(getErrorMessage(e)),
  });

  const updateComp = useMutation({
    mutationFn: ({ id, data }) => computersApi.update(id, data),
    onSuccess: () => {
      toast.success('Computer updated');
      queryClient.invalidateQueries(['computers']);
      setEditingComp(null);
      setShowCompModal(false);
    },
    onError: e => toast.error(getErrorMessage(e)),
  });

  /* ── Session mutations ── */
  const startMutation = useMutation({
    mutationFn: internetApi.start,
    onSuccess: () => {
      queryClient.invalidateQueries(['active-sessions']);
      queryClient.invalidateQueries(['computers']);
      setShowStartModal(false);
      setStartForm({ computer_id:'', customer_search:'', customer_id:null, rate_per_hour:30, payment_method:'cash', paid_amount:0 });
      toast.success('Session started!');
    },
    onError: e => toast.error(getErrorMessage(e)),
  });

  const endMutation = useMutation({
    mutationFn: (id) => internetApi.end(id, {}),
    onSuccess: () => {
      queryClient.invalidateQueries(['active-sessions']);
      queryClient.invalidateQueries(['computers']);
      setShowEndModal(null);
      toast.success('Session ended');
    },
    onError: e => toast.error(getErrorMessage(e)),
  });

  const payMutation = useMutation({
    mutationFn: ({ id, data }) => internetApi.pay(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['active-sessions']);
      setShowPayModal(null);
      setPayAmount('');
      toast.success('Payment recorded');
    },
    onError: e => toast.error(getErrorMessage(e)),
  });

  /* ── Derived ── */
  const available   = (computers || []).filter(c => c.status === 'available');
  const inUse       = (computers || []).filter(c => c.status === 'in_use');
  const maintenance = (computers || []).filter(c => c.status === 'maintenance');
  const offline     = (computers || []).filter(c => c.status === 'offline');

  const handleEditComp = (comp) => { setEditingComp(comp); setShowCompModal(true); };
  const handleSaveComp = (form) => {
    if (editingComp) updateComp.mutate({ id: editingComp.id, data: form });
    else createComp.mutate(form);
  };

  const TABS = [
    { key: 'active',    label: 'Active Sessions' },
    { key: 'computers', label: `Computers (${(computers||[]).length})` },
    { key: 'history',   label: 'History'         },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="page-header">Internet Sessions</h1>
        <div className="flex gap-2">
          <button onClick={() => { refetch(); refetchComputers(); }}
            className={`btn btn-secondary btn-sm ${isFetching ? 'opacity-60' : ''}`}
            disabled={isFetching}>
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} /> Refresh
          </button>
          {tab === 'computers' ? (
            <button onClick={() => { setEditingComp(null); setShowCompModal(true); }}
              className="btn btn-primary btn-sm">
              <Plus size={14} /> Add Computer
            </button>
          ) : (
            <button onClick={() => setShowStartModal(true)} className="btn btn-primary btn-sm"
              disabled={available.length === 0}>
              <Play size={14} /> New Session
            </button>
          )}
        </div>
      </div>

      {/* Computer grid overview — always visible */}
      {(computers || []).length === 0 ? (
        <div className="card p-8 text-center border-2 border-dashed border-surface-200">
          <Monitor size={36} className="text-surface-300 mx-auto mb-3" />
          <p className="font-semibold text-surface-600 mb-1">No computers added yet</p>
          <p className="text-sm text-surface-400 mb-4">Add computers to start tracking internet sessions</p>
          <button onClick={() => { setEditingComp(null); setShowCompModal(true); }}
            className="btn btn-primary mx-auto">
            <Plus size={14} /> Add First Computer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
          {(computers || []).map(comp => (
            <ComputerCard key={comp.id} comp={comp}
              onEdit={tab === 'computers' ? handleEditComp : null} />
          ))}
          {/* Add button in grid */}
          {tab === 'computers' && (
            <button onClick={() => { setEditingComp(null); setShowCompModal(true); }}
              className="card p-3 border-2 border-dashed border-surface-200 flex flex-col items-center justify-center gap-1 hover:border-primary-300 hover:bg-primary-50/50 transition-all min-h-[80px]">
              <Plus size={18} className="text-surface-400" />
              <span className="text-[10px] text-surface-400 font-medium">Add</span>
            </button>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Available',   val: available.length,   color: 'text-green-600',  bg: 'bg-green-50',   icon: CheckCircle },
          { label: 'In Use',      val: inUse.length,       color: 'text-blue-600',   bg: 'bg-blue-50',    icon: Monitor     },
          { label: 'Maintenance', val: maintenance.length, color: 'text-amber-600',  bg: 'bg-amber-50',   icon: Wrench      },
          { label: 'Offline',     val: offline.length,     color: 'text-surface-400',bg: 'bg-surface-50', icon: Power       },
        ].map(s => (
          <div key={s.label} className={`card p-3 ${s.bg} flex items-center gap-3`}>
            <s.icon size={18} className={s.color} />
            <div>
              <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
              <p className="text-xs text-surface-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-white shadow-sm text-surface-800' : 'text-surface-500 hover:text-surface-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── ACTIVE SESSIONS TAB ── */}
      {tab === 'active' && (
        isLoading ? <PageLoader /> : (
          <div className="space-y-2">
            {(activeSessions || []).length === 0 ? (
              <div className="card p-12 text-center">
                <Wifi size={40} className="text-surface-200 mx-auto mb-3" />
                <p className="text-surface-400 mb-3">No active sessions</p>
                {available.length > 0 && (
                  <button onClick={() => setShowStartModal(true)} className="btn btn-primary mx-auto">
                    <Play size={14} /> Start First Session
                  </button>
                )}
              </div>
            ) : (
              (activeSessions || []).map(s => (
                <div key={s.id} className={`card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 border-l-4 ${
                  s.status === 'unpaid' ? 'border-l-amber-400' : 'border-l-blue-400'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      s.status === 'unpaid' ? 'bg-amber-100' : 'bg-blue-100'
                    }`}>
                      <Monitor size={18} className={s.status === 'unpaid' ? 'text-amber-600' : 'text-blue-600'} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-surface-900 text-sm">
                          {s.computer_name}
                          <span className="text-surface-400 ml-1">#{s.station_number}</span>
                        </p>
                        <span className={`badge text-[10px] ${s.status === 'unpaid' ? 'badge-yellow' : 'badge-blue'}`}>
                          {s.status === 'unpaid' ? '⏸ Awaiting Payment' : '▶ Running'}
                        </span>
                      </div>
                      <p className="text-xs text-surface-500">{s.customer_name || 'Guest'} · {s.ticket_number}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 sm:gap-6 ml-0 sm:ml-auto">
                    {[
                      { label: 'Started',  val: formatTime(s.start_time) },
                      { label: 'Duration', val: formatDuration(s.current_duration_minutes) },
                      { label: s.status === 'unpaid' ? 'Balance Due' : 'Amount',
                        val: formatCurrency(s.current_cost), bold: true,
                        color: s.status === 'unpaid' ? 'text-amber-600' : 'text-primary-600' },
                    ].map(({ label, val, bold, color }) => (
                      <div key={label} className="text-center">
                        <p className="text-xs text-surface-400">{label}</p>
                        <p className={`text-sm font-bold ${color || 'text-surface-800'}`}>{val}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {/* Always show Pay button */}
                    <button onClick={() => { setShowPayModal(s); setPayAmount(s.status === 'unpaid' ? String(Math.ceil(s.current_cost)) : ''); }}
                      className={`btn btn-sm ${s.status === 'unpaid' ? 'btn-primary' : 'btn-secondary'}`}>
                      <DollarSign size={12} /> {s.status === 'unpaid' ? 'Collect Payment' : 'Pay'}
                    </button>
                    {/* End button only for running sessions */}
                    {s.status === 'active' && (
                      <button onClick={() => setShowEndModal(s)}
                        className="btn btn-danger btn-sm">
                        <Square size={12} /> End
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )
      )}

      {/* ── COMPUTERS TAB ── */}
      {tab === 'computers' && (
        <div className="space-y-3">
          {(computers || []).length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-surface-400">No computers yet. Add one above.</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-50 border-b border-surface-100">
                  <tr>
                    {['#', 'Name', 'Status', 'IP Address', 'MAC Address', 'Specs', 'Actions'].map(h => (
                      <th key={h} className="table-header px-4 py-3 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-50">
                  {(computers || []).map(c => {
                    const s = STATUS_STYLES[c.status] || STATUS_STYLES.offline;
                    return (
                      <tr key={c.id} className="hover:bg-surface-50 transition-colors">
                        <td className="px-4 py-3 font-bold text-surface-500">#{c.station_number}</td>
                        <td className="px-4 py-3 font-medium text-surface-800">{c.name}</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${
                            c.status === 'available'   ? 'badge-green'  :
                            c.status === 'in_use'      ? 'badge-blue'   :
                            c.status === 'maintenance' ? 'badge-yellow' : 'badge-gray'
                          }`}>
                            {s.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-surface-500 font-mono text-xs">{c.ip_address || '—'}</td>
                        <td className="px-4 py-3 text-surface-500 font-mono text-xs">{c.mac_address || '—'}</td>
                        <td className="px-4 py-3 text-surface-500 text-xs max-w-[180px] truncate">{c.specs || '—'}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleEditComp(c)}
                            className="btn btn-secondary btn-sm">
                            <Edit2 size={12} /> Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <Table
          columns={[
            { key: 'ticket_number', label: 'Ticket',   render: v => <span className="font-mono text-xs">{v}</span> },
            { key: 'computer_name', label: 'Computer'  },
            { key: 'customer_name', label: 'Customer',  render: v => v || 'Guest' },
            { key: 'actual_duration_minutes', label: 'Duration', render: v => formatDuration(v) },
            { key: 'cost',    label: 'Cost',   render: v => formatCurrency(v) },
            { key: 'status',  label: 'Status', render: v => <span className={statusColor(v)}>{v}</span> },
          ]}
          data={history || []}
          emptyMessage="No session history"
        />
      )}

      {/* ── START SESSION MODAL ── */}
      <Modal open={showStartModal} onClose={() => setShowStartModal(false)} title="Start Internet Session"
        footer={
          <button
            onClick={() => startMutation.mutate({
              computer_id:    startForm.computer_id,
              rate_per_hour:  startForm.rate_per_hour,
              payment_method: startForm.payment_method,
              paid_amount:    startForm.paid_amount,
              customer_id:    startForm.customer_id || null,
            })}
            disabled={!startForm.computer_id || startMutation.isPending}
            className="btn btn-primary w-full justify-center">
            {startMutation.isPending
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Play size={14} /> Start Session</>}
          </button>
        }>
        <div className="space-y-4">
          {available.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 text-center">
              No computers available. All are in use or under maintenance.
            </div>
          ) : (
            <>
              {/* Computer picker — visual grid */}
              <div>
                <label className="label mb-2">Select Computer *</label>
                <div className="grid grid-cols-3 gap-2">
                  {available.map(c => (
                    <button key={c.id}
                      onClick={() => setStartForm(p => ({ ...p, computer_id: c.id }))}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        startForm.computer_id === c.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-surface-200 hover:border-surface-300'
                      }`}>
                      <Monitor size={16} className={startForm.computer_id === c.id ? 'text-primary-600' : 'text-green-500'} />
                      <p className="text-xs font-semibold text-surface-800 mt-1 truncate">{c.name}</p>
                      <p className="text-[10px] text-surface-400">#{c.station_number}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Rate per Hour (KES)">
                  <input type="number" className="input" value={startForm.rate_per_hour}
                    onChange={e => setStartForm(p => ({ ...p, rate_per_hour: e.target.value }))} />
                </FormField>
                <FormField label="Prepaid Amount (KES)">
                  <input type="number" className="input" value={startForm.paid_amount}
                    onChange={e => setStartForm(p => ({ ...p, paid_amount: e.target.value }))}
                    placeholder="0" />
                </FormField>
              </div>

              <FormField label="Payment Method">
                <Select value={startForm.payment_method}
                  onChange={e => setStartForm(p => ({ ...p, payment_method: e.target.value }))}
                  options={[
                    { value: 'cash',    label: 'Cash'    },
                    { value: 'mpesa',   label: 'M-Pesa'  },
                    { value: 'account', label: 'Account' },
                  ]} />
              </FormField>

              <FormField label="Customer (optional)">
                <input className="input" placeholder="Search by name or phone..."
                  value={startForm.customer_search}
                  onChange={e => setStartForm(p => ({ ...p, customer_search: e.target.value, customer_id: null }))} />
                {!startForm.customer_id && (customerResults || []).length > 0 && (
                  <div className="mt-1 border border-surface-200 rounded-xl overflow-hidden">
                    {(customerResults || []).map(c => (
                      <button key={c.id}
                        onClick={() => setStartForm(p => ({
                          ...p, customer_id: c.id,
                          customer_search: `${c.name} (${c.phone})`,
                        }))}
                        className="block w-full text-left px-3 py-2.5 text-sm hover:bg-surface-50 border-b border-surface-100 last:border-0">
                        <span className="font-medium">{c.name}</span>
                        <span className="text-surface-400 ml-2">{c.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
                {startForm.customer_id && (
                  <div className="mt-1 flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                    <CheckCircle size={14} />
                    {startForm.customer_search}
                    <button onClick={() => setStartForm(p => ({ ...p, customer_id: null, customer_search: '' }))}
                      className="ml-auto text-green-400 hover:text-green-700">
                      <X size={12} />
                    </button>
                  </div>
                )}
              </FormField>
            </>
          )}
        </div>
      </Modal>

      {/* ── END SESSION MODAL ── */}
      <Modal open={!!showEndModal} onClose={() => setShowEndModal(null)} title="End Session" size="sm">
        {showEndModal && (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
              <Square size={24} className="text-red-500" />
            </div>
            <div>
              <p className="font-semibold text-surface-800">End session on <strong>{showEndModal.computer_name}</strong>?</p>
              <p className="text-2xl font-black text-primary-600 mt-2" style={{ fontFamily:"'Syne',sans-serif" }}>
                {formatCurrency(showEndModal.current_cost)}
              </p>
              <p className="text-xs text-surface-400 mt-1">Duration: {formatDuration(showEndModal.current_duration_minutes)}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowEndModal(null)} className="btn btn-secondary flex-1 justify-center">
                Cancel
              </button>
              <button onClick={() => endMutation.mutate(showEndModal.id)}
                disabled={endMutation.isPending}
                className="btn btn-danger flex-1 justify-center">
                {endMutation.isPending ? '...' : 'End Session'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── PAY SESSION MODAL ── */}
      <Modal open={!!showPayModal} onClose={() => setShowPayModal(null)} title="Collect Payment" size="sm">
        {showPayModal && (
          <div className="space-y-4">
            {/* Session summary */}
            <div className={`rounded-xl p-4 text-center ${showPayModal.status === 'unpaid' ? 'bg-amber-50 border border-amber-200' : 'bg-surface-50'}`}>
              <p className="text-xs text-surface-500 mb-1">
                {showPayModal.status === 'unpaid' ? 'Balance Due (Session Ended)' : 'Current Amount'}
              </p>
              <p className="text-3xl font-black text-surface-900" style={{ fontFamily:"'Syne',sans-serif" }}>
                {formatCurrency(showPayModal.current_cost)}
              </p>
              <p className="text-xs text-surface-400 mt-1">
                {showPayModal.computer_name} · {showPayModal.ticket_number}
              </p>
              {showPayModal.status === 'unpaid' && (
                <p className="text-xs text-amber-600 font-medium mt-1">
                  Duration: {formatDuration(showPayModal.current_duration_minutes)}
                </p>
              )}
            </div>
            {/* Quick amount buttons */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Exact', val: Math.ceil(showPayModal.current_cost) },
                { label: 'Round 50', val: Math.ceil(showPayModal.current_cost / 50) * 50 },
                { label: 'Round 100', val: Math.ceil(showPayModal.current_cost / 100) * 100 },
              ].map(q => (
                <button key={q.label} onClick={() => setPayAmount(String(q.val))}
                  className={`p-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                    payAmount === String(q.val)
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-surface-200 hover:border-surface-300 text-surface-600'
                  }`}>
                  {q.label}<br/>
                  <span className="font-bold">KES {q.val}</span>
                </button>
              ))}
            </div>
            <FormField label="Amount Received (KES)">
              <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                className="input text-lg font-bold text-center" autoFocus placeholder="0" />
            </FormField>
            {payAmount && parseFloat(payAmount) > parseFloat(showPayModal.current_cost) && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-center">
                <p className="text-xs text-green-600">Change to give</p>
                <p className="text-xl font-bold text-green-700">
                  {formatCurrency(parseFloat(payAmount) - Math.ceil(showPayModal.current_cost))}
                </p>
              </div>
            )}
            <FormField label="Payment Method">
              <Select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                options={[
                  { value: 'cash',  label: 'Cash'   },
                  { value: 'mpesa', label: 'M-Pesa' },
                ]} />
            </FormField>
            <button
              onClick={() => payMutation.mutate({ id: showPayModal.id, data: { amount: payAmount, payment_method: payMethod } })}
              disabled={!payAmount || parseFloat(payAmount) <= 0 || payMutation.isPending}
              className="btn btn-primary w-full justify-center py-3 text-base">
              {payMutation.isPending
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><DollarSign size={16} /> Confirm Payment</>}
            </button>
          </div>
        )}
      </Modal>

      {/* ── ADD/EDIT COMPUTER MODAL ── */}
      <ComputerModal
        open={showCompModal}
        onClose={() => { setShowCompModal(false); setEditingComp(null); }}
        computer={editingComp}
        onSave={handleSaveComp}
        isPending={createComp.isPending || updateComp.isPending}
      />
    </div>
  );
}
