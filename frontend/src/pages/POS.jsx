import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, salesApi, customersApi, servicesApi } from '../lib/api';
import { formatCurrency, getErrorMessage } from '../lib/utils';
import {
  Search, Plus, Minus, Trash2, ShoppingCart, User, X,
  CreditCard, Smartphone, Banknote, Receipt, Package, Wrench,
  ChevronUp, ChevronDown
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { value: 'cash',  label: 'Cash',   icon: Banknote    },
  { value: 'mpesa', label: 'M-Pesa', icon: Smartphone  },
  { value: 'card',  label: 'Card',   icon: CreditCard  },
];

export default function POS() {
  const queryClient = useQueryClient();
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  const [customer, setCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [mpesaRef, setMpesaRef] = useState('');
  const [discount, setDiscount] = useState('');
  const [lastReceipt, setLastReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [cartOpen, setCartOpen] = useState(false); // mobile cart drawer
  const barcodeRef = useRef('');
  const searchRef = useRef();

  const subtotal = cart.reduce((s, i) => s + i.total, 0);
  const discountAmt = parseFloat(discount) || 0;
  const total = Math.max(0, subtotal - discountAmt);
  const paid = parseFloat(paidAmount) || 0;
  const change = Math.max(0, paid - total);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['pos-products', search],
    queryFn: () => productsApi.list({ search, limit: 50, is_active: 'true' }),
    enabled: activeTab === 'products',
    select: r => r.data.data,
  });

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.list(),
    select: r => r.data.data,
  });

  const { data: customers } = useQuery({
    queryKey: ['pos-customers', customerSearch],
    queryFn: () => customersApi.list({ search: customerSearch, limit: 10 }),
    enabled: customerSearch.length > 1,
    select: r => r.data.data,
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement !== searchRef.current) {
        if (e.key === 'Enter' && barcodeRef.current.length > 3) {
          handleBarcodeSearch(barcodeRef.current);
          barcodeRef.current = '';
        } else if (e.key.length === 1) {
          barcodeRef.current += e.key;
          setTimeout(() => { barcodeRef.current = ''; }, 300);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleBarcodeSearch = async (code) => {
    try {
      const res = await productsApi.byBarcode(code);
      addProductToCart(res.data.data);
      toast.success(`Added: ${res.data.data.name}`);
    } catch { toast.error('Product not found: ' + code); }
  };

  const addProductToCart = (p) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id && i.type === 'product');
      if (ex) {
        if (ex.qty >= p.quantity) { toast.error('Insufficient stock'); return prev; }
        return prev.map(i => i.id === p.id && i.type === 'product'
          ? { ...i, qty: i.qty + 1, total: (i.qty + 1) * i.price } : i);
      }
      if (p.quantity < 1) { toast.error('Out of stock'); return prev; }
      return [...prev, {
        id: p.id, type: 'product', name: p.name, sku: p.sku,
        price: parseFloat(p.selling_price), qty: 1,
        total: parseFloat(p.selling_price), maxQty: p.quantity,
      }];
    });
  };

  const addServiceToCart = (s) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === s.id && i.type === 'service');
      if (ex) return prev.map(i => i.id === s.id && i.type === 'service'
        ? { ...i, qty: i.qty + 1, total: (i.qty + 1) * i.price } : i);
      return [...prev, {
        id: s.id, type: 'service', name: s.name,
        price: parseFloat(s.rate), qty: 1, total: parseFloat(s.rate),
      }];
    });
  };

  const updateQty = (id, type, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id !== id || i.type !== type) return i;
      const newQty = Math.max(1, i.qty + delta);
      if (type === 'product' && newQty > i.maxQty) { toast.error('Insufficient stock'); return i; }
      return { ...i, qty: newQty, total: newQty * i.price };
    }));
  };

  const removeItem = (id, type) => setCart(prev => prev.filter(i => !(i.id === id && i.type === type)));

  const saleMutation = useMutation({
    mutationFn: (data) => salesApi.create(data),
    onSuccess: (res) => {
      setLastReceipt(res.data.data);
      setShowPaymentModal(false);
      setShowReceiptModal(true);
      setCartOpen(false);
      setCart([]); setCustomer(null); setDiscount('');
      setPaidAmount(''); setMpesaRef('');
      queryClient.invalidateQueries(['dashboard']);
      queryClient.invalidateQueries(['pos-products']);
      toast.success('Sale completed!');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const completeSale = () => {
    if (!cart.length) return toast.error('Cart is empty');
    if (paid < total && paymentMethod !== 'credit') return toast.error('Paid amount is less than total');
    saleMutation.mutate({
      customer_id: customer?.id || null,
      items: cart.map(i => ({
        item_type: i.type,
        ...(i.type === 'product' ? { product_id: i.id } : { service_id: i.id }),
        name: i.name, quantity: i.qty, unit_price: i.price, discount_amount: 0,
      })),
      payment_method: paymentMethod,
      paid_amount: paymentMethod === 'credit' ? 0 : paid,
      cash_amount:  paymentMethod === 'cash'  ? paid : 0,
      mpesa_amount: paymentMethod === 'mpesa' ? paid : 0,
      card_amount:  paymentMethod === 'card'  ? paid : 0,
      mpesa_ref: mpesaRef || null,
      discount_amount: discountAmt,
    });
  };

  /* ── Cart Panel (shared between desktop sidebar and mobile drawer) ── */
  const CartPanel = () => (
    <div className="flex flex-col h-full">
      {/* Customer */}
      <div className="px-3 py-2 border-b border-surface-100">
        <button onClick={() => setShowCustomerModal(true)}
          className="w-full flex items-center gap-2 p-2 rounded-lg border border-dashed border-surface-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all">
          <User size={14} className="text-surface-400 flex-shrink-0" />
          {customer ? (
            <div className="flex-1 text-left">
              <p className="font-medium text-surface-700 text-xs">{customer.name}</p>
              <p className="text-[10px] text-surface-400">{customer.phone}</p>
            </div>
          ) : (
            <span className="text-surface-400 text-xs">Add customer (optional)</span>
          )}
          {customer && (
            <button onClick={e => { e.stopPropagation(); setCustomer(null); }}
              className="ml-auto text-surface-300 hover:text-red-500">
              <X size={12} />
            </button>
          )}
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-2 space-y-1">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-surface-300 gap-2">
            <ShoppingCart size={28} />
            <p className="text-sm">Cart is empty</p>
          </div>
        ) : cart.map(item => (
          <div key={`${item.type}-${item.id}`}
               className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-50 group">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-surface-800 truncate">{item.name}</p>
              <p className="text-[10px] text-surface-400">{formatCurrency(item.price)} each</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => updateQty(item.id, item.type, -1)}
                className="w-6 h-6 rounded-lg flex items-center justify-center bg-surface-100 hover:bg-surface-200 transition-colors">
                <Minus size={10} />
              </button>
              <span className="w-6 text-center text-xs font-bold">{item.qty}</span>
              <button onClick={() => updateQty(item.id, item.type, 1)}
                className="w-6 h-6 rounded-lg flex items-center justify-center bg-surface-100 hover:bg-surface-200 transition-colors">
                <Plus size={10} />
              </button>
            </div>
            <p className="text-xs font-bold text-surface-800 w-14 text-right flex-shrink-0">{formatCurrency(item.total)}</p>
            <button onClick={() => removeItem(item.id, item.type)}
              className="text-surface-200 hover:text-red-500 transition-colors flex-shrink-0">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Totals + Charge */}
      <div className="px-3 py-3 border-t border-surface-100 space-y-2">
        <div className="flex justify-between text-sm text-surface-600">
          <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-surface-600">Discount</span>
          <input type="number" value={discount} onChange={e => setDiscount(e.target.value)}
            placeholder="0" className="input text-xs py-1 ml-auto w-24 text-right" />
        </div>
        <div className="flex justify-between font-bold text-surface-900 pt-1 border-t border-surface-100">
          <span>Total</span>
          <span className="text-primary-600">{formatCurrency(total)}</span>
        </div>
        <button
          onClick={() => cart.length > 0 && setShowPaymentModal(true)}
          disabled={cart.length === 0}
          className="btn btn-primary w-full justify-center py-3 text-sm">
          <Receipt size={15} /> Charge {formatCurrency(total)}
        </button>
        {cart.length > 0 && (
          <button onClick={() => setCart([])}
            className="btn btn-ghost w-full justify-center text-xs text-red-500 hover:bg-red-50">
            Clear Cart
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ══ DESKTOP layout ══ */}
      <div className="hidden lg:flex h-[calc(100vh-56px)] gap-4 p-4 overflow-hidden">
        {/* Product grid */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="card p-3 mb-3 flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search products or scan barcode..." className="input pl-9 text-sm" />
            </div>
            <div className="flex bg-surface-100 rounded-lg p-0.5 gap-0.5">
              {[{ key:'products', icon:Package },{ key:'services', icon:Wrench }].map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`p-1.5 rounded-md transition-all ${activeTab === t.key ? 'bg-white shadow-sm text-primary-600' : 'text-surface-500'}`}>
                  <t.icon size={16} />
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 pb-4">
              {activeTab === 'products' && (productsLoading
                ? Array.from({length:8}).map((_,i) => (
                    <div key={i} className="card p-3 h-24 animate-pulse">
                      <div className="h-3 bg-surface-100 rounded mb-2 w-3/4" />
                      <div className="h-3 bg-surface-100 rounded w-1/2" />
                    </div>
                  ))
                : (products||[]).map(p => (
                    <button key={p.id} onClick={() => addProductToCart(p)}
                      disabled={p.quantity < 1}
                      className={`card p-3 text-left hover:shadow-card-hover hover:border-primary-200 transition-all active:scale-[0.97] ${p.quantity < 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <p className="text-xs font-semibold text-surface-800 leading-snug line-clamp-2">{p.name}</p>
                      <p className="text-xs text-surface-400 mt-1">{p.sku}</p>
                      <div className="flex items-end justify-between mt-2">
                        <p className="text-sm font-bold text-primary-600">{formatCurrency(p.selling_price)}</p>
                        <span className={`text-[10px] ${p.quantity < 5 ? 'text-red-500' : 'text-surface-400'}`}>{p.quantity} left</span>
                      </div>
                    </button>
                  ))
              )}
              {activeTab === 'services' && (services||[]).map(s => (
                <button key={s.id} onClick={() => addServiceToCart(s)}
                  className="card p-3 text-left hover:shadow-card-hover hover:border-primary-200 transition-all active:scale-[0.97] cursor-pointer">
                  <p className="text-xs font-semibold text-surface-800 leading-snug">{s.name}</p>
                  <p className="text-[10px] text-surface-400 mt-0.5 capitalize">{s.service_type}</p>
                  <p className="text-sm font-bold text-primary-600 mt-2">{formatCurrency(s.rate)}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Cart sidebar */}
        <div className="w-80 xl:w-96 flex flex-col card overflow-hidden">
          <CartPanel />
        </div>
      </div>

      {/* ══ MOBILE layout ══ */}
      <div className="lg:hidden flex flex-col h-[calc(100vh-56px)] overflow-hidden">
        {/* Search + tabs */}
        <div className="px-3 pt-3 pb-2 bg-white border-b border-surface-100 flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search or scan barcode..." className="input pl-9 text-sm" />
          </div>
          <div className="flex bg-surface-100 rounded-lg p-0.5 gap-0.5">
            {[{ key:'products', icon:Package },{ key:'services', icon:Wrench }].map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`p-2 rounded-md transition-all ${activeTab === t.key ? 'bg-white shadow-sm text-primary-600' : 'text-surface-500'}`}>
                <t.icon size={16} />
              </button>
            ))}
          </div>
        </div>

        {/* Product grid — scrollable */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pt-3">
          <div className="grid grid-cols-2 gap-2 pb-4">
            {activeTab === 'products' && (productsLoading
              ? Array.from({length:6}).map((_,i) => (
                  <div key={i} className="card p-3 h-20 animate-pulse">
                    <div className="h-3 bg-surface-100 rounded mb-2 w-3/4" />
                    <div className="h-3 bg-surface-100 rounded w-1/2" />
                  </div>
                ))
              : (products||[]).map(p => (
                  <button key={p.id} onClick={() => { addProductToCart(p); }}
                    disabled={p.quantity < 1}
                    className={`card p-3 text-left active:scale-[0.97] transition-all ${p.quantity < 1 ? 'opacity-50' : ''}`}>
                    <p className="text-xs font-semibold text-surface-800 leading-snug line-clamp-2">{p.name}</p>
                    <div className="flex items-end justify-between mt-2">
                      <p className="text-sm font-bold text-primary-600">{formatCurrency(p.selling_price)}</p>
                      <span className={`text-[10px] ${p.quantity < 5 ? 'text-red-500' : 'text-surface-400'}`}>{p.quantity}</span>
                    </div>
                  </button>
                ))
            )}
            {activeTab === 'services' && (services||[]).map(s => (
              <button key={s.id} onClick={() => addServiceToCart(s)}
                className="card p-3 text-left active:scale-[0.97] transition-all">
                <p className="text-xs font-semibold text-surface-800 leading-snug">{s.name}</p>
                <p className="text-sm font-bold text-primary-600 mt-2">{formatCurrency(s.rate)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Floating cart button */}
        {cartCount > 0 && !cartOpen && (
          <div className="px-3 pb-2">
            <button onClick={() => setCartOpen(true)}
              className="btn btn-primary w-full justify-between py-3.5 text-sm shadow-lg">
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} />
                <span>{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">{formatCurrency(total)}</span>
                <ChevronUp size={16} />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* ══ MOBILE CART DRAWER ══ */}
      {cartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />

          {/* Drawer */}
          <div className="relative bg-white rounded-t-2xl flex flex-col"
               style={{ maxHeight: '90vh' }}>
            {/* Handle */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100">
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} className="text-primary-600" />
                <span className="font-semibold text-sm text-surface-900">
                  Cart ({cartCount} item{cartCount !== 1 ? 's' : ''})
                </span>
              </div>
              <button onClick={() => setCartOpen(false)}
                className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-500">
                <ChevronDown size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <CartPanel />
            </div>
          </div>
        </div>
      )}

      {/* Customer Modal */}
      <Modal open={showCustomerModal} onClose={() => setShowCustomerModal(false)} title="Select Customer">
        <input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
          placeholder="Search by name or phone..." className="input mb-3" autoFocus />
        <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin">
          {(customers||[]).map(c => (
            <button key={c.id}
              onClick={() => { setCustomer(c); setShowCustomerModal(false); setCustomerSearch(''); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 text-left transition-colors">
              <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
                {c.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-800">{c.name}</p>
                <p className="text-xs text-surface-400">{c.phone}</p>
              </div>
              <span className={`text-xs flex-shrink-0 ${parseFloat(c.account_balance) < 0 ? 'text-red-500' : 'text-green-600'}`}>
                {formatCurrency(c.account_balance)}
              </span>
            </button>
          ))}
          {customerSearch.length > 1 && !(customers||[]).length && (
            <p className="text-center text-sm text-surface-400 py-4">No customers found</p>
          )}
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal open={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Complete Payment" size="sm">
        <div className="space-y-4">
          <div className="bg-surface-50 rounded-xl p-4 text-center">
            <p className="text-xs text-surface-500 mb-1">Amount Due</p>
            <p className="text-3xl font-black text-surface-900" style={{ fontFamily:"'Syne',sans-serif" }}>{formatCurrency(total)}</p>
            {customer && <p className="text-xs text-surface-400 mt-1">Customer: {customer.name}</p>}
          </div>
          <div>
            <label className="label">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(m => (
                <button key={m.value} onClick={() => setPaymentMethod(m.value)}
                  className={`p-3 rounded-xl border-2 transition-all text-sm font-medium flex flex-col items-center gap-1 ${paymentMethod === m.value ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-surface-200 text-surface-600'}`}>
                  <m.icon size={18} />{m.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Amount Tendered</label>
            <input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)}
              placeholder={total.toFixed(2)} className="input text-lg font-bold" autoFocus />
            {/* Quick amount buttons */}
            <div className="flex gap-2 mt-2 flex-wrap">
              {[total, Math.ceil(total/100)*100, Math.ceil(total/500)*500, Math.ceil(total/1000)*1000]
                .filter((v,i,a) => a.indexOf(v) === i && v >= total)
                .slice(0, 4)
                .map(amt => (
                  <button key={amt} onClick={() => setPaidAmount(amt.toString())}
                    className="px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 text-xs font-medium text-surface-700 transition-colors">
                    {formatCurrency(amt)}
                  </button>
                ))}
            </div>
          </div>
          {paymentMethod === 'mpesa' && (
            <div>
              <label className="label">M-Pesa Reference</label>
              <input value={mpesaRef} onChange={e => setMpesaRef(e.target.value)}
                placeholder="e.g. QDE7XXXXXX" className="input" />
            </div>
          )}
          {paid > 0 && paid >= total && (
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-xs text-green-600">Change</p>
              <p className="text-xl font-black text-green-700" style={{ fontFamily:"'Syne',sans-serif" }}>{formatCurrency(change)}</p>
            </div>
          )}
          <button onClick={completeSale} disabled={saleMutation.isPending}
            className="btn btn-primary w-full justify-center py-3.5 text-base">
            {saleMutation.isPending
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : `Confirm Payment`}
          </button>
        </div>
      </Modal>

      {/* Receipt Modal */}
      <Modal open={showReceiptModal} onClose={() => setShowReceiptModal(false)} title="Receipt" size="sm">
        {lastReceipt && (
          <div className="space-y-3">
            <div className="text-center pb-3 border-b border-surface-100">
              <p className="font-black text-surface-900" style={{ fontFamily:"'Syne',sans-serif" }}>Helvino Cyber & Bookshop</p>
              <p className="text-xs text-surface-400">Tel: 0703445756</p>
              <p className="font-mono text-sm font-bold text-primary-600 mt-2">{lastReceipt.receipt_number}</p>
            </div>
            <div className="space-y-1">
              {(lastReceipt.items||[]).filter(Boolean).map((item,i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-surface-700">{item.name} x{item.quantity}</span>
                  <span className="font-medium">{formatCurrency(item.total_price)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-surface-100 pt-2 space-y-1">
              <div className="flex justify-between text-sm font-bold">
                <span>Total</span><span>{formatCurrency(lastReceipt.total)}</span>
              </div>
              <div className="flex justify-between text-xs text-surface-400">
                <span>Paid ({lastReceipt.payment_method})</span>
                <span>{formatCurrency(lastReceipt.paid_amount)}</span>
              </div>
              {parseFloat(lastReceipt.change_given) > 0 && (
                <div className="flex justify-between text-xs text-green-600 font-medium">
                  <span>Change</span><span>{formatCurrency(lastReceipt.change_given)}</span>
                </div>
              )}
            </div>
            <div className="text-center pt-2 border-t border-surface-100">
              <p className="text-xs text-surface-400">Thank you for your business!</p>
              <p className="text-xs text-surface-400">helvino.org</p>
            </div>
            <button onClick={() => { setShowReceiptModal(false); window.print(); }}
              className="btn btn-secondary w-full justify-center">
              <Receipt size={14} /> Print Receipt
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}
