import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { profileApi, settingsApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import {
  User, Building2, Receipt, Lock, Phone, Mail, Globe,
  MapPin, Save, Eye, EyeOff, CheckCircle2
} from 'lucide-react';

const Section = ({ title, icon: Icon, children }) => (
  <div className="card p-6">
    <div className="flex items-center gap-2 mb-5 pb-4 border-b border-surface-100">
      <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
        <Icon size={16} className="text-primary-600" />
      </div>
      <h2 className="section-title">{title}</h2>
    </div>
    {children}
  </div>
);

const Field = ({ label, error, children, required }) => (
  <div>
    <label className="label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
    {children}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

export default function Settings() {
  const { user, updateUser } = useAuthStore();
  const qc = useQueryClient();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // ── Queries ──────────────────────────────────────────────
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get().then(r => r.data.data),
  });

  // ── Forms ────────────────────────────────────────────────
  const profileForm = useForm({
    values: { name: user?.name || '', email: user?.email || '', phone: user?.phone || '' },
  });

  const passwordForm = useForm();

  const businessForm = useForm({
    values: {
      name:    settingsData?.branch?.name    || '',
      address: settingsData?.branch?.address || '',
      phone:   settingsData?.branch?.phone   || '',
      email:   settingsData?.branch?.email   || '',
      website: settingsData?.branch?.website || '',
      county:  settingsData?.branch?.county  || '',
      town:    settingsData?.branch?.town    || '',
    },
    enableReinitialize: true,
  });

  const receiptForm = useForm({
    values: {
      receipt_header:       settingsData?.settings?.receipt_header      || '',
      receipt_footer:       settingsData?.settings?.receipt_footer      || '',
      receipt_show_address: settingsData?.settings?.receipt_show_address ?? true,
      receipt_show_phone:   settingsData?.settings?.receipt_show_phone   ?? true,
      receipt_show_email:   settingsData?.settings?.receipt_show_email   ?? false,
      receipt_show_website: settingsData?.settings?.receipt_show_website ?? false,
      receipt_width:        settingsData?.settings?.receipt_width        || 80,
      receipt_copies:       settingsData?.settings?.receipt_copies       || 1,
      currency_symbol:      settingsData?.settings?.currency_symbol      || 'KES',
      tax_rate:             settingsData?.settings?.tax_rate             || 0,
      tax_name:             settingsData?.settings?.tax_name             || 'VAT',
      tax_inclusive:        settingsData?.settings?.tax_inclusive        ?? false,
    },
    enableReinitialize: true,
  });

  // ── Mutations ─────────────────────────────────────────────
  const updateProfile = useMutation({
    mutationFn: (data) => profileApi.update(data),
    onSuccess: (res) => {
      updateUser(res.data.data);
      toast.success('Profile updated');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update profile'),
  });

  const changePassword = useMutation({
    mutationFn: (data) => profileApi.changePassword(data),
    onSuccess: () => { toast.success('Password changed'); passwordForm.reset(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to change password'),
  });

  const updateBusiness = useMutation({
    mutationFn: (data) => settingsApi.updateBusiness(data),
    onSuccess: () => { toast.success('Business info updated'); qc.invalidateQueries(['settings']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update'),
  });

  const updateReceipt = useMutation({
    mutationFn: (data) => settingsApi.updateReceipt(data),
    onSuccess: () => { toast.success('Receipt settings updated'); qc.invalidateQueries(['settings']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update'),
  });

  const tabs = [
    { id: 'profile',  label: 'My Profile',   icon: User      },
    { id: 'business', label: 'Business Info', icon: Building2 },
    { id: 'receipt',  label: 'Receipt',       icon: Receipt   },
    { id: 'password', label: 'Password',      icon: Lock      },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="page-header">Settings</h1>
        <p className="text-sm text-surface-500 mt-1">Manage your profile, business info and receipt configuration.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-surface-100 w-fit flex-wrap">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-white text-primary-600 shadow-card'
                : 'text-surface-500 hover:text-surface-700'
            }`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ── PROFILE TAB ── */}
      {activeTab === 'profile' && (
        <Section title="My Profile" icon={User}>
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-black">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <p className="font-semibold text-surface-900">{user?.name}</p>
              <p className="text-sm text-surface-500">{user?.email}</p>
              <span className="badge badge-orange mt-1">{user?.role?.replace('_', ' ')}</span>
            </div>
          </div>

          <form onSubmit={profileForm.handleSubmit(d => updateProfile.mutate(d))} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full Name" required error={profileForm.formState.errors.name?.message}>
                <input className="input" placeholder="John Doe" {...profileForm.register('name', { required: 'Name is required' })} />
              </Field>
              <Field label="Email Address" required error={profileForm.formState.errors.email?.message}>
                <input className="input" type="email" placeholder="john@example.com" {...profileForm.register('email', { required: 'Email is required' })} />
              </Field>
              <Field label="Phone Number">
                <input className="input" placeholder="0700 000 000" {...profileForm.register('phone')} />
              </Field>
              <Field label="Role">
                <input className="input bg-surface-50" disabled value={user?.role?.replace(/_/g, ' ') || ''} />
              </Field>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="btn btn-primary" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? <span className="animate-spin">⏳</span> : <Save size={15} />}
                Save Profile
              </button>
            </div>
          </form>
        </Section>
      )}

      {/* ── BUSINESS TAB ── */}
      {activeTab === 'business' && (
        <Section title="Business Information" icon={Building2}>
          {isLoading ? (
            <div className="text-center py-8 text-surface-400">Loading...</div>
          ) : (
            <form onSubmit={businessForm.handleSubmit(d => updateBusiness.mutate(d))} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Business Name" required>
                  <input className="input" placeholder="Helvino Cyber & Books" {...businessForm.register('name', { required: true })} />
                </Field>
                <Field label="Phone Number" required>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input className="input pl-9" placeholder="0703 445 756" {...businessForm.register('phone')} />
                  </div>
                </Field>
                <Field label="Email">
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input className="input pl-9" type="email" placeholder="info@example.com" {...businessForm.register('email')} />
                  </div>
                </Field>
                <Field label="Website">
                  <div className="relative">
                    <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input className="input pl-9" placeholder="helvino.org" {...businessForm.register('website')} />
                  </div>
                </Field>
                <Field label="County">
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input className="input pl-9" placeholder="Kisumu" {...businessForm.register('county')} />
                  </div>
                </Field>
                <Field label="Town">
                  <input className="input" placeholder="Kisumu CBD" {...businessForm.register('town')} />
                </Field>
                <Field label="Address" className="sm:col-span-2">
                  <textarea className="input resize-none" rows={2} placeholder="Street address..." {...businessForm.register('address')} />
                </Field>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="btn btn-primary" disabled={updateBusiness.isPending}>
                  {updateBusiness.isPending ? <span className="animate-spin">⏳</span> : <Save size={15} />}
                  Save Business Info
                </button>
              </div>
            </form>
          )}
        </Section>
      )}

      {/* ── RECEIPT TAB ── */}
      {activeTab === 'receipt' && (
        <Section title="Receipt Configuration" icon={Receipt}>
          {isLoading ? (
            <div className="text-center py-8 text-surface-400">Loading...</div>
          ) : (
            <form onSubmit={receiptForm.handleSubmit(d => updateReceipt.mutate(d))} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Currency Symbol">
                  <input className="input" placeholder="KES" {...receiptForm.register('currency_symbol')} />
                </Field>
                <Field label="Receipt Width (mm)">
                  <input className="input" type="number" min={58} max={110} {...receiptForm.register('receipt_width')} />
                </Field>
                <Field label="Number of Copies">
                  <input className="input" type="number" min={1} max={3} {...receiptForm.register('receipt_copies')} />
                </Field>
                <Field label="Tax Name">
                  <input className="input" placeholder="VAT" {...receiptForm.register('tax_name')} />
                </Field>
                <Field label="Tax Rate (%)">
                  <input className="input" type="number" step="0.01" min={0} max={100} placeholder="0" {...receiptForm.register('tax_rate')} />
                </Field>
              </div>

              <Field label="Receipt Header Text">
                <textarea className="input resize-none" rows={2}
                  placeholder="Welcome to Helvino Cyber & Books&#10;Thank you for your business!"
                  {...receiptForm.register('receipt_header')} />
              </Field>

              <Field label="Receipt Footer Text">
                <textarea className="input resize-none" rows={2}
                  placeholder="Thank you for shopping with us!&#10;Returns accepted within 7 days."
                  {...receiptForm.register('receipt_footer')} />
              </Field>

              {/* Toggles */}
              <div>
                <p className="label mb-3">Show on Receipt</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { key: 'receipt_show_address', label: 'Business Address' },
                    { key: 'receipt_show_phone',   label: 'Phone Number'     },
                    { key: 'receipt_show_email',   label: 'Email Address'    },
                    { key: 'receipt_show_website', label: 'Website'          },
                    { key: 'tax_inclusive',         label: 'Tax Inclusive Pricing' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 p-3 rounded-lg border border-surface-200 cursor-pointer hover:bg-surface-50">
                      <input type="checkbox" className="w-4 h-4 accent-orange-500" {...receiptForm.register(key)} />
                      <span className="text-sm text-surface-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Receipt Preview */}
              <div>
                <p className="label mb-2">Preview</p>
                <div className="bg-white border-2 border-dashed border-surface-200 rounded-xl p-4 font-mono text-xs text-center space-y-1 max-w-xs mx-auto">
                  <p className="font-bold text-sm">{businessForm.watch('name') || 'Your Business Name'}</p>
                  {receiptForm.watch('receipt_show_address') && <p className="text-surface-500">{businessForm.watch('address') || '123 Main Street'}</p>}
                  {receiptForm.watch('receipt_show_phone')   && <p className="text-surface-500">{businessForm.watch('phone') || '0700 000 000'}</p>}
                  {receiptForm.watch('receipt_show_email')   && <p className="text-surface-500">{businessForm.watch('email') || 'info@example.com'}</p>}
                  <div className="border-t border-dashed border-surface-300 my-2" />
                  <p className="text-surface-400 italic">{receiptForm.watch('receipt_header') || 'Receipt header...'}</p>
                  <div className="border-t border-dashed border-surface-300 my-2" />
                  <div className="text-left space-y-0.5">
                    <div className="flex justify-between"><span>Item 1 x2</span><span>KES 200</span></div>
                    <div className="flex justify-between"><span>Item 2 x1</span><span>KES 150</span></div>
                    <div className="flex justify-between font-bold border-t border-surface-200 pt-1 mt-1"><span>TOTAL</span><span>KES 350</span></div>
                  </div>
                  <div className="border-t border-dashed border-surface-300 my-2" />
                  <p className="text-surface-400 italic">{receiptForm.watch('receipt_footer') || 'Thank you!'}</p>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" className="btn btn-primary" disabled={updateReceipt.isPending}>
                  {updateReceipt.isPending ? <span className="animate-spin">⏳</span> : <Save size={15} />}
                  Save Receipt Settings
                </button>
              </div>
            </form>
          )}
        </Section>
      )}

      {/* ── PASSWORD TAB ── */}
      {activeTab === 'password' && (
        <Section title="Change Password" icon={Lock}>
          <form onSubmit={passwordForm.handleSubmit(d => changePassword.mutate(d))} className="space-y-4 max-w-sm">
            <Field label="Current Password" error={passwordForm.formState.errors.current_password?.message}>
              <div className="relative">
                <input className="input pr-10" type={showCurrent ? 'text' : 'password'}
                  placeholder="Enter current password"
                  {...passwordForm.register('current_password', { required: 'Required' })} />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400">
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>
            <Field label="New Password" error={passwordForm.formState.errors.new_password?.message}>
              <div className="relative">
                <input className="input pr-10" type={showNew ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  {...passwordForm.register('new_password', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })} />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400">
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>
            <Field label="Confirm New Password" error={passwordForm.formState.errors.confirm_password?.message}>
              <input className="input" type="password" placeholder="Repeat new password"
                {...passwordForm.register('confirm_password', {
                  required: 'Required',
                  validate: v => v === passwordForm.watch('new_password') || 'Passwords do not match',
                })} />
            </Field>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-start gap-2">
              <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
              Use at least 8 characters with a mix of letters, numbers and symbols.
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={changePassword.isPending}>
              {changePassword.isPending ? <span className="animate-spin">⏳</span> : <Lock size={15} />}
              Change Password
            </button>
          </form>
        </Section>
      )}

      {/* Support Card */}
      <div className="rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
        <p className="font-bold mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>Helvino Technologies Support</p>
        <p className="text-sm opacity-80 mb-3">Need help? Contact us anytime.</p>
        <div className="flex flex-wrap gap-4 text-sm">
          <a href="tel:0703445756" className="flex items-center gap-1.5 opacity-90 hover:opacity-100"><Phone size={13} /> 0703445756</a>
          <a href="mailto:helvinotechltd@gmail.com" className="flex items-center gap-1.5 opacity-90 hover:opacity-100"><Mail size={13} /> helvinotechltd@gmail.com</a>
          <a href="https://helvino.org" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 opacity-90 hover:opacity-100"><Globe size={13} /> helvino.org</a>
        </div>
      </div>
    </div>
  );
}
