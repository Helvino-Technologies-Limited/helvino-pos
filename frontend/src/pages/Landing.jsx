import { Link } from 'react-router-dom';
import {
  ShoppingCart, Monitor, Package, BarChart3, Shield, Zap,
  Users, Globe, Phone, Mail, ArrowRight, CheckCircle2,
  CreditCard, TrendingUp, Lock, Printer, BookOpen, Wifi,
  ChevronRight, Database, Clock
} from 'lucide-react';

const FEATURES = [
  { icon: ShoppingCart, title: 'Full POS System',      desc: 'Retail, books, stationery and all services in one unified interface with receipt printing.', accent: '#f97316' },
  { icon: Monitor,      title: 'Internet Sessions',    desc: 'Auto-timed sessions, per-minute billing, computer assignment and usage tracking.',           accent: '#3b82f6' },
  { icon: Package,      title: 'Smart Inventory',      desc: 'Real-time stock levels, low-stock alerts, barcode scanning and supplier management.',         accent: '#10b981' },
  { icon: BarChart3,    title: 'Reports & Analytics',  desc: 'Profit & Loss, revenue trends, top products, session heatmaps and shift reports.',            accent: '#8b5cf6' },
  { icon: Users,        title: 'Customer Accounts',    desc: 'Credit system, loyalty points, student discounts and full transaction history.',               accent: '#ec4899' },
  { icon: CreditCard,   title: 'M-Pesa Integrated',    desc: 'STK push payments, real-time callbacks and the full Kenyan payment ecosystem.',                accent: '#f59e0b' },
  { icon: Shield,       title: 'Role-Based Access',    desc: 'Super admin to cashier — every employee has tailored access with full audit trail.',            accent: '#ef4444' },
  { icon: Clock,        title: 'Shift Management',     desc: 'Open/close shifts, track per-cashier revenue and reconcile your cash drawer.',                 accent: '#14b8a6' },
];

const USE_CASES = [
  { title: 'Bookshops & Stationery', desc: 'Books, pens, notebooks, school supplies — barcode scan, track stock, print receipts instantly.', emoji: '📚', grad: 'from-orange-500 to-amber-500' },
  { title: 'Cyber Cafés',            desc: 'Per-minute internet billing, computer management, session history, automated disconnects.',        emoji: '💻', grad: 'from-blue-500 to-cyan-500'   },
  { title: 'Print & Copy Centers',   desc: 'B&W and color printing rates, scanning, lamination, binding — all billed and tracked.',           emoji: '🖨️', grad: 'from-violet-500 to-purple-500'},
];

const STEPS = [
  { step: '01', title: 'Contact Helvino',    desc: 'Call or WhatsApp 0703445756 to get your licence and login credentials set up.',       color: '#f97316' },
  { step: '02', title: 'Configure Your Shop',desc: 'Add products, services, computers, employees and set your M-Pesa shortcode.',          color: '#3b82f6' },
  { step: '03', title: 'Start Selling',      desc: 'Open a shift, scan products, start internet sessions and watch your dashboard fill up.', color: '#10b981' },
];

/* ─── tiny reusable helpers ────────────────────────────────────── */
const GradText = ({ children }) => (
  <span style={{ background:'linear-gradient(90deg,#f97316,#fbbf24)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
    {children}
  </span>
);

const ContactRow = ({ icon: Icon, label, href }) => (
  <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
     className="flex items-center gap-3 text-sm group transition-colors"
     style={{ color:'rgba(255,255,255,0.5)' }}>
    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
         style={{ background:'rgba(255,255,255,0.06)' }}
         onMouseEnter={e=>e.currentTarget.style.background='rgba(249,115,22,0.2)'}
         onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.06)'}>
      <Icon size={14} />
    </div>
    <span className="group-hover:text-orange-400 transition-colors truncate">{label}</span>
  </a>
);

/* ─── MAIN COMPONENT ────────────────────────────────────────────── */
export default function Landing() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white overflow-x-hidden"
         style={{ fontFamily:"'DM Sans',sans-serif" }}>

      {/* noise overlay */}
      <div className="fixed inset-0 pointer-events-none z-0"
           style={{ opacity:0.025, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize:'160px 160px' }} />

      {/* ══════════════════════════════════════════ NAV */}
      <nav className="sticky top-0 z-50 border-b"
           style={{ borderColor:'rgba(255,255,255,0.06)', background:'rgba(9,9,11,0.85)', backdropFilter:'blur(20px)' }}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          {/* logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                 style={{ background:'linear-gradient(135deg,#f97316,#ea580c)' }}>
              <Package size={16} className="text-white" />
            </div>
            <span className="font-black text-sm tracking-tight" style={{ fontFamily:"'Syne',sans-serif" }}>Helvino POS</span>
          </div>

          {/* right */}
          <div className="flex items-center gap-4">
            <a href="tel:0703445756"
               className="hidden sm:flex items-center gap-1.5 text-xs transition-colors hover:text-orange-400"
               style={{ color:'rgba(255,255,255,0.45)' }}>
              <Phone size={12}/> 0703445756
            </a>
            <Link to="/login"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                  style={{ background:'linear-gradient(135deg,#f97316,#ea580c)', boxShadow:'0 4px 18px rgba(249,115,22,0.35)' }}>
              Sign In <ArrowRight size={14}/>
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════ HERO */}
      <section className="relative z-10 overflow-hidden">
        {/* ambient orbs */}
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full pointer-events-none"
             style={{ background:'radial-gradient(circle,rgba(249,115,22,0.18),transparent 70%)', filter:'blur(80px)' }}/>
        <div className="absolute top-40 right-0 w-[400px] h-[400px] rounded-full pointer-events-none"
             style={{ background:'radial-gradient(circle,rgba(59,130,246,0.12),transparent 70%)', filter:'blur(80px)' }}/>

        <div className="max-w-6xl mx-auto px-5 pt-20 pb-16 lg:pt-28 lg:pb-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* LEFT copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-7"
                   style={{ background:'rgba(249,115,22,0.1)', border:'1px solid rgba(249,115,22,0.25)', color:'#fb923c' }}>
                <Zap size={11} fill="currentColor"/> All-in-One Cyber + Bookshop POS
              </div>

              <h1 className="mb-5 leading-[1.06] tracking-tight"
                  style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(2.4rem,5.5vw,4.2rem)', fontWeight:800 }}>
                Run Your Business<br/>
                <GradText>Smarter.</GradText>
              </h1>

              <p className="text-base leading-relaxed mb-8 max-w-lg"
                 style={{ color:'rgba(255,255,255,0.48)' }}>
                Complete point-of-sale, internet session management, inventory, M-Pesa integration and deep analytics —{' '}
                <span style={{ color:'rgba(255,255,255,0.78)' }}>built specifically for Kenyan cyber cafés and bookshops.</span>
              </p>

              {/* tag pills */}
              <div className="flex flex-wrap gap-2 mb-9">
                {['M-Pesa Ready','Multi-Role Access','Real-time Reports','Barcode Scanning','Shift Management'].map(t=>(
                  <span key={t} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
                        style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', color:'rgba(255,255,255,0.55)' }}>
                    <CheckCircle2 size={10} style={{ color:'#f97316' }}/> {t}
                  </span>
                ))}
              </div>

              {/* CTA row */}
              <div className="flex flex-wrap gap-3">
                <Link to="/login"
                      className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 hover:-translate-y-0.5"
                      style={{ background:'linear-gradient(135deg,#f97316,#ea580c)', boxShadow:'0 8px 28px rgba(249,115,22,0.4)' }}>
                  Get Started <ArrowRight size={15}/>
                </Link>
                <a href="tel:0703445756"
                   className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5"
                   style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.11)', color:'rgba(255,255,255,0.8)' }}>
                  <Phone size={15}/> Talk to Sales
                </a>
              </div>
            </div>

            {/* RIGHT — dashboard mockup */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 rounded-2xl"
                   style={{ background:'linear-gradient(135deg,rgba(249,115,22,0.15),rgba(59,130,246,0.1))', filter:'blur(30px)', transform:'scale(1.05)' }}/>
              <div className="relative rounded-2xl overflow-hidden"
                   style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.09)' }}>

                {/* browser chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b"
                     style={{ borderColor:'rgba(255,255,255,0.07)', background:'rgba(255,255,255,0.02)' }}>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/70"/>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70"/>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/70"/>
                  </div>
                  <div className="flex-1 mx-3 px-3 py-0.5 rounded text-[10px] text-center"
                       style={{ background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.25)' }}>
                    helvino-pos-api.onrender.com/dashboard
                  </div>
                </div>

                {/* stat cards */}
                <div className="p-4 grid grid-cols-2 gap-2">
                  {[
                    { label:"Today's Revenue", val:'KES 24,850', color:'#f97316', icon:TrendingUp },
                    { label:'Active Sessions',  val:'7 Online',   color:'#3b82f6', icon:Monitor    },
                    { label:'Items Sold',        val:'134 Units',  color:'#10b981', icon:Package    },
                    { label:'Net Profit',         val:'KES 8,340', color:'#8b5cf6', icon:BarChart3  },
                  ].map(({ label, val, color, icon:Icon }) => (
                    <div key={label} className="p-3 rounded-xl"
                         style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[10px]" style={{ color:'rgba(255,255,255,0.38)' }}>{label}</p>
                        <Icon size={11} style={{ color }}/>
                      </div>
                      <p className="text-sm font-bold" style={{ color, fontFamily:"'Syne',sans-serif" }}>{val}</p>
                    </div>
                  ))}
                </div>

                {/* bar chart */}
                <div className="px-4 pb-4">
                  <div className="rounded-xl p-3" style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-[10px] mb-2" style={{ color:'rgba(255,255,255,0.3)' }}>Monthly Revenue</p>
                    <div className="flex items-end gap-1 h-16">
                      {[38,55,42,70,50,84,62,78,55,90,68,100].map((h,i)=>(
                        <div key={i} className="flex-1 rounded-t-sm"
                             style={{ height:`${h}%`, background: i===11 ? 'linear-gradient(to top,#f97316,#fbbf24)' : `rgba(249,115,22,${0.12+h*0.003})` }}/>
                      ))}
                    </div>
                    <div className="flex justify-between mt-1.5">
                      {['J','F','M','A','M','J','J','A','S','O','N','D'].map(m=>(
                        <span key={m} className="text-[8px] flex-1 text-center" style={{ color:'rgba(255,255,255,0.18)' }}>{m}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* internet sessions row */}
                <div className="px-4 pb-4">
                  <div className="rounded-xl p-3" style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-[10px] mb-2" style={{ color:'rgba(255,255,255,0.3)' }}>Live Internet Sessions</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {['PC-01','PC-02','PC-03','PC-04','PC-05','PC-06','PC-07','PC-08'].map((pc,i)=>(
                        <div key={pc} className="px-2 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1"
                             style={{ background: i<5 ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)', border:`1px solid ${i<5?'rgba(59,130,246,0.3)':'rgba(255,255,255,0.07)'}`, color: i<5 ? '#93c5fd' : 'rgba(255,255,255,0.3)' }}>
                          <span className={`w-1.5 h-1.5 rounded-full ${i<5?'bg-blue-400':'bg-white/20'}`}/>
                          {pc}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
                     style={{ background:'linear-gradient(to bottom,transparent,#09090b)' }}/>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════ STATS STRIP */}
      <div className="relative z-10 border-y"
           style={{ borderColor:'rgba(255,255,255,0.06)', background:'rgba(249,115,22,0.04)' }}>
        <div className="max-w-6xl mx-auto px-5 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { val:'14+',   label:'Modules'     },
            { val:'7',     label:'User Roles'   },
            { val:'100%',  label:'M-Pesa Ready' },
            { val:'24/7',  label:'Support'      },
          ].map(s=>(
            <div key={s.label}>
              <p className="text-3xl sm:text-4xl font-black mb-0.5"
                 style={{ fontFamily:"'Syne',sans-serif", background:'linear-gradient(90deg,#f97316,#fbbf24)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                {s.val}
              </p>
              <p className="text-xs" style={{ color:'rgba(255,255,255,0.38)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════ FEATURES */}
      <section className="relative z-10 py-24">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] pointer-events-none"
             style={{ background:'radial-gradient(ellipse,rgba(249,115,22,0.06),transparent 70%)', filter:'blur(40px)' }}/>

        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color:'#f97316' }}>Everything You Need</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-3"
                style={{ fontFamily:"'Syne',sans-serif" }}>
              One system.{' '}
              <span style={{ color:'rgba(255,255,255,0.25)' }}>Every function.</span>
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color:'rgba(255,255,255,0.4)' }}>
              From first sale to year-end reports — Helvino POS handles every aspect of running your business.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {FEATURES.map(({ icon:Icon, title, desc, accent }) => (
              <div key={title}
                   className="group relative p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 cursor-default"
                   style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}
                   onMouseEnter={e=>{ e.currentTarget.style.borderColor=`${accent}40`; e.currentTarget.style.background=`${accent}0c`; }}
                   onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; e.currentTarget.style.background='rgba(255,255,255,0.03)'; }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors"
                     style={{ background:`${accent}18`, border:`1px solid ${accent}28` }}>
                  <Icon size={18} style={{ color:accent }}/>
                </div>
                <h3 className="font-bold text-sm mb-2" style={{ fontFamily:"'Syne',sans-serif", color:'rgba(255,255,255,0.9)' }}>{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color:'rgba(255,255,255,0.4)' }}>{desc}</p>
                <ChevronRight size={13} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color:accent }}/>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════ USE CASES */}
      <section className="relative z-10 py-20 border-t" style={{ borderColor:'rgba(255,255,255,0.05)' }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color:'#f97316' }}>Built For</p>
            <h2 className="text-4xl font-black tracking-tight" style={{ fontFamily:"'Syne',sans-serif" }}>Who uses Helvino?</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {USE_CASES.map(({ title, desc, emoji, grad }) => (
              <div key={title}
                   className="group relative rounded-3xl p-7 overflow-hidden transition-transform duration-300 hover:-translate-y-1"
                   style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                <div className={`absolute -top-12 -right-12 w-44 h-44 rounded-full blur-3xl opacity-15 bg-gradient-to-br ${grad}`}/>
                <div className="relative">
                  <div className="text-5xl mb-5 select-none">{emoji}</div>
                  <h3 className="text-xl font-black mb-3" style={{ fontFamily:"'Syne',sans-serif" }}>{title}</h3>
                  <p className="text-sm leading-relaxed mb-5" style={{ color:'rgba(255,255,255,0.5)' }}>{desc}</p>
                  <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors hover:gap-2.5" style={{ color:'#f97316' }}>
                    Get started <ArrowRight size={12}/>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════ HOW IT WORKS */}
      <section className="relative z-10 py-20">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color:'#f97316' }}>Simple Setup</p>
            <h2 className="text-4xl font-black tracking-tight" style={{ fontFamily:"'Syne',sans-serif" }}>Up and running in minutes</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {STEPS.map(({ step, title, desc, color }) => (
              <div key={step} className="relative p-6 rounded-2xl" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                <div className="absolute top-5 right-5 w-2 h-2 rounded-full" style={{ background:color }}/>
                <p className="text-7xl font-black select-none mb-3 leading-none" style={{ fontFamily:"'Syne',sans-serif", color:`${color}14` }}>{step}</p>
                <h3 className="font-bold mb-2" style={{ fontFamily:"'Syne',sans-serif" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color:'rgba(255,255,255,0.43)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════ CTA */}
      <section className="relative z-10 py-20">
        <div className="max-w-6xl mx-auto px-5">
          <div className="relative rounded-3xl overflow-hidden p-10 sm:p-16 text-center"
               style={{ background:'linear-gradient(135deg,rgba(249,115,22,0.1),rgba(234,88,12,0.05))', border:'1px solid rgba(249,115,22,0.18)' }}>
            <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full blur-3xl pointer-events-none" style={{ background:'rgba(249,115,22,0.18)' }}/>
            <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none" style={{ background:'rgba(59,130,246,0.1)' }}/>
            <div className="relative">
              <Lock size={38} className="mx-auto mb-6" style={{ color:'#f97316', opacity:0.85 }}/>
              <h2 className="text-3xl sm:text-5xl font-black mb-4 tracking-tight" style={{ fontFamily:"'Syne',sans-serif" }}>
                Ready to transform<br/>your business?
              </h2>
              <p className="mb-8 max-w-md mx-auto text-base" style={{ color:'rgba(255,255,255,0.45)' }}>
                Contact Helvino Technologies today. Setup is fast, support is personal.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/login"
                      className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 hover:-translate-y-0.5"
                      style={{ background:'linear-gradient(135deg,#f97316,#ea580c)', boxShadow:'0 8px 32px rgba(249,115,22,0.4)' }}>
                  Open Dashboard <ArrowRight size={15}/>
                </Link>
                <a href="https://helvino.org" target="_blank" rel="noreferrer"
                   className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5"
                   style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)' }}>
                  <Globe size={15}/> helvino.org
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════ FOOTER */}
      <footer className="relative z-10 border-t" style={{ borderColor:'rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-5 py-14">
          <div className="grid sm:grid-cols-3 gap-10 mb-10">

            {/* brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                     style={{ background:'linear-gradient(135deg,#f97316,#ea580c)' }}>
                  <Package size={16} className="text-white"/>
                </div>
                <div>
                  <p className="font-black text-sm leading-tight" style={{ fontFamily:"'Syne',sans-serif" }}>Helvino POS</p>
                  <p className="text-[10px]" style={{ color:'rgba(255,255,255,0.28)' }}>Cyber & Bookshop System</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color:'rgba(255,255,255,0.32)' }}>
                All-in-one management system for Kenyan cyber cafés and bookshops. Built with ❤️ by Helvino Technologies Limited.
              </p>
            </div>

            {/* quick links */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-5" style={{ color:'rgba(255,255,255,0.35)' }}>Quick Links</p>
              <ul className="space-y-3">
                <li>
                  <Link to="/login" className="flex items-center gap-2 text-sm transition-colors hover:text-orange-400" style={{ color:'rgba(255,255,255,0.45)' }}>
                    <ChevronRight size={12}/> Sign In to Dashboard
                  </Link>
                </li>
                <li>
                  <a href="https://helvino.org" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm transition-colors hover:text-orange-400" style={{ color:'rgba(255,255,255,0.45)' }}>
                    <ChevronRight size={12}/> helvino.org
                  </a>
                </li>
              </ul>
            </div>

            {/* contact */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-5" style={{ color:'rgba(255,255,255,0.35)' }}>Contact Support</p>
              <div className="space-y-3">
                <ContactRow icon={Phone} label="0703445756"             href="tel:0703445756"/>
                <ContactRow icon={Mail}  label="helvinotechltd@gmail.com" href="mailto:helvinotechltd@gmail.com"/>
                <ContactRow icon={Globe} label="helvino.org"             href="https://helvino.org"/>
              </div>
            </div>
          </div>

          {/* bottom bar */}
          <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-3"
               style={{ borderColor:'rgba(255,255,255,0.06)' }}>
            <p className="text-xs" style={{ color:'rgba(255,255,255,0.22)' }}>
              © {new Date().getFullYear()} Helvino Technologies Limited. All rights reserved.
            </p>
            <div className="flex items-center gap-1.5 text-xs" style={{ color:'rgba(255,255,255,0.18)' }}>
              <Database size={10}/>
              <span>Powered by Helvino Technologies</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
