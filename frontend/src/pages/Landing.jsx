import { Link } from 'react-router-dom';
import {
  ShoppingCart, Monitor, Package, BarChart3, Shield, Zap,
  Users, Globe, Phone, Mail, ArrowRight, CheckCircle2, Star,
  BookOpen, Printer, Wifi, CreditCard, TrendingUp, Lock
} from 'lucide-react';

const FEATURES = [
  { icon: ShoppingCart, title: 'Full POS System', desc: 'Handle retail, books, stationery and all services in one unified interface.', color: 'bg-orange-50 text-orange-600' },
  { icon: Monitor, title: 'Internet Sessions', desc: 'Auto-timed sessions, per-minute billing, computer assignment and usage tracking.', color: 'bg-blue-50 text-blue-600' },
  { icon: Package, title: 'Smart Inventory', desc: 'Real-time stock, low stock alerts, barcode scanning and supplier management.', color: 'bg-green-50 text-green-600' },
  { icon: BarChart3, title: 'Reports & Analytics', desc: 'P&L, revenue trends, top products, session usage and shift reports.', color: 'bg-purple-50 text-purple-600' },
  { icon: Users, title: 'Customer Accounts', desc: 'Credit system, loyalty points, student discounts and full transaction history.', color: 'bg-pink-50 text-pink-600' },
  { icon: CreditCard, title: 'M-Pesa Integrated', desc: 'STK push payments, real-time callbacks and full Kenyan payment ecosystem.', color: 'bg-emerald-50 text-emerald-600' },
  { icon: Shield, title: 'Role-Based Access', desc: 'Super admin to cashier — every employee has tailored access and audit trail.', color: 'bg-red-50 text-red-600' },
  { icon: TrendingUp, title: 'Shift Management', desc: 'Open/close shifts, track per-cashier revenue, cash drawer reconciliation.', color: 'bg-amber-50 text-amber-600' },
];

const HERO_IMAGES = [
  { src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&auto=format', alt: 'Happy customer at bookshop' },
  { src: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&auto=format', alt: 'Books and stationery' },
  { src: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=300&fit=crop&auto=format', alt: 'Cyber cafe computers' },
  { src: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=400&h=300&fit=crop&auto=format', alt: 'Printer and stationery shop' },
  { src: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=300&fit=crop&auto=format', alt: 'Bookshop shelves' },
  { src: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=300&fit=crop&auto=format', alt: 'Laptop in cyber cafe' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white font-body">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-surface-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
              <Package size={18} className="text-white" />
            </div>
            <span className="font-display text-lg font-bold text-surface-900">Helvino POS</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="tel:0703445756" className="hidden sm:flex items-center gap-1.5 text-sm text-surface-600 hover:text-primary-600 transition-colors">
              <Phone size={14} /> 0703445756
            </a>
            <Link to="/login" className="btn-primary btn-sm">
              Sign In <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-surface-950 via-surface-900 to-surface-800 text-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 lg:py-28 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary-500/20 border border-primary-500/30 rounded-full px-3 py-1 text-primary-300 text-xs font-medium mb-6">
                <Zap size={11} /> All-in-One Cyber + Bookshop POS
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Run Your Business <br />
                <span className="text-primary-400">Smarter.</span>
              </h1>
              <p className="text-surface-300 text-lg leading-relaxed mb-8 max-w-lg">
                Complete point-of-sale, internet session management, inventory, M-Pesa integration and deep analytics — built specifically for Kenyan cyber cafés and bookshops.
              </p>
              <div className="flex flex-wrap gap-3 mb-10">
                {['M-Pesa Ready', 'Offline Resilient', 'Multi-Role Access', 'Real-time Reports'].map(tag => (
                  <span key={tag} className="flex items-center gap-1.5 text-xs font-medium text-surface-300 bg-white/8 border border-white/10 rounded-full px-3 py-1">
                    <CheckCircle2 size={11} className="text-primary-400" /> {tag}
                  </span>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/login" className="btn-primary btn-lg">
                  Get Started <ArrowRight size={16} />
                </Link>
                <a href="tel:0703445756" className="btn-secondary btn-lg bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Phone size={16} /> Talk to Sales
                </a>
              </div>
            </div>

            {/* Image Grid */}
            <div className="hidden lg:grid grid-cols-3 gap-3">
              {HERO_IMAGES.map((img, i) => (
                <div
                  key={i}
                  className={`rounded-2xl overflow-hidden ${i === 0 ? 'col-span-2 row-span-1' : ''}`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-36 object-cover hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* IMAGE GALLERY (mobile) */}
      <section className="lg:hidden py-8 overflow-x-auto scrollbar-thin">
        <div className="flex gap-3 px-4" style={{ width: 'max-content' }}>
          {HERO_IMAGES.map((img, i) => (
            <div key={i} className="rounded-2xl overflow-hidden flex-shrink-0 w-48 h-32">
              <img src={img.src} alt={img.alt} className="w-full h-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="bg-primary-600 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { val: '14+', label: 'Modules' },
              { val: '7', label: 'User Roles' },
              { val: '100%', label: 'M-Pesa Ready' },
              { val: '24/7', label: 'Support' },
            ].map(s => (
              <div key={s.label}>
                <p className="font-display text-4xl font-bold">{s.val}</p>
                <p className="text-primary-200 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 bg-surface-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-surface-900 mb-3">
              Everything You Need
            </h2>
            <p className="text-surface-500 max-w-xl mx-auto">
              From first sale to year-end reports — Helvino POS handles every aspect of running your cyber café and bookshop.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card p-5 hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                  <Icon size={20} />
                </div>
                <h3 className="font-display font-semibold text-surface-900 mb-1.5">{title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES WITH IMAGES */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-3xl font-bold text-center text-surface-900 mb-14">Built For</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                img: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=300&fit=crop',
                title: 'Bookshops & Stationery',
                desc: 'Books, pens, notebooks, school supplies — scan barcodes, track stock, print receipts instantly.',
              },
              {
                img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=300&fit=crop',
                title: 'Cyber Cafés',
                desc: 'Per-minute internet billing, computer management, session history, and automated disconnects.',
              },
              {
                img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=300&fit=crop',
                title: 'Print & Copy Centers',
                desc: 'B&W and color printing rates, scanning, lamination, binding — all billed and tracked.',
              },
            ].map(item => (
              <div key={item.title} className="group rounded-2xl overflow-hidden border border-surface-100 hover:shadow-card-hover transition-all duration-300">
                <div className="h-48 overflow-hidden">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
                <div className="p-5">
                  <h3 className="font-display font-bold text-surface-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-surface-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-surface-950">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <Lock size={40} className="text-primary-500 mx-auto mb-6" />
          <h2 className="font-display text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-surface-400 mb-8">Contact Helvino Technologies to set up your system today.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/login" className="btn-primary btn-lg">
              Open Dashboard <ArrowRight size={16} />
            </Link>
            <a href="https://helvino.org" target="_blank" rel="noreferrer" className="btn-secondary btn-lg bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Globe size={16} /> helvino.org
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                  <Package size={14} className="text-white" />
                </div>
                <span className="font-display font-bold">Helvino POS</span>
              </div>
              <p className="text-sm text-white/50 leading-relaxed">
                All-in-one POS and management system for cyber cafés and bookshops in Kenya.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Quick Links</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><a href="https://helvino.org" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Website</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Contact Support</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li className="flex items-center gap-2"><Phone size={12} /><a href="tel:0703445756" className="hover:text-white">0703445756</a></li>
                <li className="flex items-center gap-2"><Mail size={12} /><a href="mailto:helvinotechltd@gmail.com" className="hover:text-white">helvinotechltd@gmail.com</a></li>
                <li className="flex items-center gap-2"><Globe size={12} /><a href="https://helvino.org" target="_blank" rel="noreferrer" className="hover:text-white">helvino.org</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center text-xs text-white/30">
            © {new Date().getFullYear()} Helvino Technologies Limited. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
