import { useQuery, useMutation } from '@tanstack/react-query';
import { authApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { formatDateTime, getErrorMessage } from '../lib/utils';
import { useState } from 'react';
import { Phone, Mail, Globe, Building2, Lock, User, Info } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { FormField } from '../components/ui/FormField';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user } = useAuthStore();
  const [showPassModal, setShowPassModal] = useState(false);
  const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' });

  const changePassMutation = useMutation({
    mutationFn: (data) => authApi.changePassword(data),
    onSuccess: () => { setShowPassModal(false); setPassForm({ current: '', new: '', confirm: '' }); toast.success('Password changed'); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleChangePass = () => {
    if (passForm.new !== passForm.confirm) return toast.error('Passwords do not match');
    if (passForm.new.length < 8) return toast.error('Password must be at least 8 characters');
    changePassMutation.mutate({ current_password: passForm.current, new_password: passForm.new });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="page-header">Settings</h1>

      {/* Profile */}
      <div className="card p-5 space-y-4">
        <h2 className="section-title flex items-center gap-2"><User size={16} /> My Profile</h2>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl">
            {user?.name?.[0]}
          </div>
          <div>
            <p className="font-display font-bold text-surface-900 text-lg">{user?.name}</p>
            <p className="text-surface-500 text-sm">{user?.email}</p>
            <p className="text-xs mt-1 bg-primary-100 text-primary-700 rounded-full px-2 py-0.5 inline-block capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-surface-400 text-xs">Branch</p><p className="text-surface-700">{user?.branch_name || '—'}</p></div>
          <div><p className="text-surface-400 text-xs">Last Login</p><p className="text-surface-700">{user?.last_login ? formatDateTime(user.last_login) : '—'}</p></div>
        </div>
        <button onClick={() => setShowPassModal(true)} className="btn-secondary btn-sm"><Lock size={12} /> Change Password</button>
      </div>

      {/* Support */}
      <div className="card p-5 space-y-4">
        <h2 className="section-title flex items-center gap-2"><Building2 size={16} /> System Support</h2>
        <div className="bg-gradient-to-br from-primary-50 to-orange-50 rounded-xl p-5 border border-primary-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center">
              <Building2 size={22} className="text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-surface-900">Helvino Technologies Limited</p>
              <p className="text-sm text-surface-500">System Developer & Support</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { icon: Phone, label: 'Phone / WhatsApp', val: '0703445756', href: 'tel:0703445756' },
              { icon: Mail, label: 'Email Support', val: 'helvinotechltd@gmail.com', href: 'mailto:helvinotechltd@gmail.com' },
              { icon: Globe, label: 'Website', val: 'helvino.org', href: 'https://helvino.org' },
            ].map(item => (
              <a key={item.label} href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
                className="flex items-center gap-3 p-3 bg-white rounded-xl hover:shadow-sm transition-all group">
                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                  <item.icon size={15} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-xs text-surface-400">{item.label}</p>
                  <p className="text-sm font-medium text-surface-800 group-hover:text-primary-600 transition-colors">{item.val}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="card p-5">
        <h2 className="section-title flex items-center gap-2 mb-4"><Info size={16} /> System Info</h2>
        <div className="space-y-2 text-sm">
          {[
            { label: 'System', val: 'Helvino POS — Cyber & Bookshop Management System' },
            { label: 'Version', val: '1.0.0' },
            { label: 'Developer', val: 'Helvino Technologies Limited' },
            { label: 'Support Email', val: 'helvinotechltd@gmail.com' },
          ].map(row => (
            <div key={row.label} className="flex justify-between py-2 border-b border-surface-50 last:border-0">
              <span className="text-surface-500">{row.label}</span>
              <span className="text-surface-800 font-medium">{row.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal open={showPassModal} onClose={() => setShowPassModal(false)} title="Change Password" size="sm">
        <div className="space-y-4">
          <FormField label="Current Password">
            <input type="password" className="input" value={passForm.current} onChange={e => setPassForm(p => ({ ...p, current: e.target.value }))} autoFocus />
          </FormField>
          <FormField label="New Password">
            <input type="password" className="input" value={passForm.new} onChange={e => setPassForm(p => ({ ...p, new: e.target.value }))} />
          </FormField>
          <FormField label="Confirm New Password">
            <input type="password" className="input" value={passForm.confirm} onChange={e => setPassForm(p => ({ ...p, confirm: e.target.value }))} />
          </FormField>
          <button onClick={handleChangePass} disabled={changePassMutation.isPending} className="btn-primary w-full justify-center">
            {changePassMutation.isPending ? '...' : 'Change Password'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
