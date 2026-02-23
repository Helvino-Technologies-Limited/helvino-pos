import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Package, ArrowLeft, Phone, Mail, Globe } from 'lucide-react';
import { authApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { getErrorMessage } from '../lib/utils';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      login(res.data.data.user, res.data.data.token);
      toast.success(`Welcome back, ${res.data.data.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
          <ArrowLeft size={14} /> Back to Home
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
            <Package size={13} className="text-white" />
          </div>
          <span className="font-display text-sm font-bold text-white">Helvino POS</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 px-7 py-7 text-white">
              <h1 className="font-display text-2xl font-bold mb-1">Sign In</h1>
              <p className="text-primary-100 text-sm">Access your POS dashboard</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="px-7 py-7 space-y-4">
              <div>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  placeholder="admin@helvino.org"
                  {...register('email', { required: 'Email is required' })}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                    placeholder="••••••••"
                    {...register('password', { required: 'Password is required' })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-2.5"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : 'Sign In'}
              </button>
            </form>
          </div>

          {/* Support */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-white/40 text-xs">Need help? Contact Helvino Technologies</p>
            <div className="flex items-center justify-center gap-4 text-xs">
              <a href="tel:0703445756" className="flex items-center gap-1 text-primary-400 hover:text-primary-300 transition-colors">
                <Phone size={11} /> 0703445756
              </a>
              <a href="mailto:helvinotechltd@gmail.com" className="flex items-center gap-1 text-primary-400 hover:text-primary-300 transition-colors">
                <Mail size={11} /> Email Us
              </a>
              <a href="https://helvino.org" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary-400 hover:text-primary-300 transition-colors">
                <Globe size={11} /> helvino.org
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
