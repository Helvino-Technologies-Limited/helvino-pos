import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, categoriesApi, suppliersApi } from '../lib/api';
import { formatCurrency, statusColor, getErrorMessage, generateSKU } from '../lib/utils';
import { Table, Pagination } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { FormField, Select } from '../components/ui/FormField';
import { StatsCard } from '../components/ui/StatsCard';
import { Plus, Search, Package, TrendingDown, AlertTriangle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

export default function Products() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [showAdjModal, setShowAdjModal] = useState(null);
  const [adjForm, setAdjForm] = useState({ type: 'add', qty: '', reason: '' });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', page, search, lowStock, categoryFilter],
    queryFn: () => productsApi.list({ page, limit: 20, search, low_stock: lowStock ? 'true' : undefined, category_id: categoryFilter || undefined }),
    select: (res) => res.data,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list({ type: 'product' }),
    select: (res) => res.data.data,
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-all'],
    queryFn: () => suppliersApi.list({ limit: 100 }),
    select: (res) => res.data.data,
  });

  const createMutation = useMutation({
    mutationFn: (data) => editProduct ? productsApi.update(editProduct.id, data) : productsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setShowModal(false);
      reset();
      setEditProduct(null);
      toast.success(editProduct ? 'Product updated' : 'Product created');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const adjMutation = useMutation({
    mutationFn: ({ id, data }) => productsApi.adjustStock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setShowAdjModal(null);
      toast.success('Stock adjusted');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const openEdit = (product) => {
    setEditProduct(product);
    reset({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      category_id: product.category_id,
      supplier_id: product.supplier_id,
      cost_price: product.cost_price,
      selling_price: product.selling_price,
      reorder_level: product.reorder_level,
    });
    setShowModal(true);
  };

  const columns = [
    { key: 'name', label: 'Product', render: (v, r) => (
      <div>
        <p className="font-medium text-surface-800">{v}</p>
        <p className="text-xs text-surface-400">{r.sku}</p>
      </div>
    )},
    { key: 'category_name', label: 'Category', render: v => v || '—' },
    { key: 'selling_price', label: 'Price', render: v => formatCurrency(v) },
    { key: 'cost_price', label: 'Cost', render: v => formatCurrency(v) },
    { key: 'quantity', label: 'Stock', render: (v, r) => (
      <span className={`font-bold text-sm ${v <= 0 ? 'text-red-600' : v <= r.reorder_level ? 'text-yellow-600' : 'text-green-600'}`}>{v}</span>
    )},
    { key: 'quantity', label: 'Status', cellClassName: 'hidden sm:table-cell', render: (v, r) => {
      const s = v <= 0 ? 'out_of_stock' : v <= r.reorder_level ? 'low_stock' : 'in_stock';
      return <span className={statusColor(s)}>{s.replace('_', ' ')}</span>;
    }},
    { key: 'id', label: 'Actions', render: (v, r) => (
      <div className="flex gap-1">
        <button onClick={(e) => { e.stopPropagation(); openEdit(r); }} className="btn-secondary btn-sm">Edit</button>
        <button onClick={(e) => { e.stopPropagation(); setShowAdjModal(r); setAdjForm({ type: 'add', qty: '', reason: '' }); }} className="btn-ghost btn-sm">Stock</button>
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-header">Products</h1>
        <button onClick={() => { setEditProduct(null); reset({}); setShowModal(true); }} className="btn-primary btn-sm">
          <Plus size={14} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="card p-3 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search products..." className="input pl-9 text-sm" />
        </div>
        <Select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
          options={(categories || []).map(c => ({ value: c.id, label: c.name }))}
          placeholder="All categories" className="w-44" />
        <label className="flex items-center gap-2 text-sm text-surface-600 cursor-pointer">
          <input type="checkbox" checked={lowStock} onChange={e => setLowStock(e.target.checked)} className="rounded text-primary-600" />
          Low stock only
        </label>
      </div>

      <Table
        columns={columns}
        data={(productsData?.data || [])}
        loading={isLoading}
        emptyMessage="No products found"
      />
      <Pagination pagination={productsData?.pagination} onPage={setPage} />

      {/* Add/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setEditProduct(null); reset(); }}
        title={editProduct ? 'Edit Product' : 'Add Product'}
        size="lg"
        footer={
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowModal(false); setEditProduct(null); reset(); }} className="btn-secondary">Cancel</button>
            <button form="product-form" type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? '...' : editProduct ? 'Update' : 'Create Product'}
            </button>
          </div>
        }
      >
        <form id="product-form" onSubmit={handleSubmit(d => createMutation.mutate(d))} className="grid grid-cols-2 gap-4">
          <FormField label="Product Name" required className="col-span-2">
            <input className={`input ${errors.name ? 'input-error' : ''}`} {...register('name', { required: 'Required' })} />
          </FormField>
          <FormField label="SKU">
            <input className="input" {...register('sku')} placeholder="Auto-generated if blank" />
          </FormField>
          <FormField label="Barcode">
            <input className="input" {...register('barcode')} />
          </FormField>
          <FormField label="Category">
            <Select {...register('category_id')} options={(categories || []).map(c => ({ value: c.id, label: c.name }))} placeholder="Select category" />
          </FormField>
          <FormField label="Supplier">
            <Select {...register('supplier_id')} options={(suppliers || []).map(s => ({ value: s.id, label: s.name }))} placeholder="Select supplier" />
          </FormField>
          <FormField label="Cost Price (KES)" required>
            <input type="number" step="0.01" className={`input ${errors.cost_price ? 'input-error' : ''}`} {...register('cost_price', { required: 'Required' })} />
          </FormField>
          <FormField label="Selling Price (KES)" required>
            <input type="number" step="0.01" className={`input ${errors.selling_price ? 'input-error' : ''}`} {...register('selling_price', { required: 'Required' })} />
          </FormField>
          {!editProduct && (
            <FormField label="Initial Stock" required>
              <input type="number" className={`input ${errors.quantity ? 'input-error' : ''}`} {...register('quantity', { valueAsNumber: true })} defaultValue={0} />
            </FormField>
          )}
          <FormField label="Reorder Level">
            <input type="number" className="input" {...register('reorder_level', { valueAsNumber: true })} defaultValue={5} />
          </FormField>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal open={!!showAdjModal} onClose={() => setShowAdjModal(null)} title="Adjust Stock" size="sm"
        footer={
          <button onClick={() => adjMutation.mutate({ id: showAdjModal?.id, data: { adjustment_type: adjForm.type, quantity: adjForm.qty, reason: adjForm.reason } })}
            disabled={!adjForm.qty || adjMutation.isPending} className="btn-primary w-full justify-center">
            {adjMutation.isPending ? '...' : 'Apply Adjustment'}
          </button>
        }
      >
        {showAdjModal && (
          <div className="space-y-4">
            <div className="bg-surface-50 rounded-xl p-3">
              <p className="font-medium text-surface-800">{showAdjModal.name}</p>
              <p className="text-sm text-surface-500">Current stock: <strong>{showAdjModal.quantity}</strong></p>
            </div>
            <FormField label="Adjustment Type">
              <Select value={adjForm.type} onChange={e => setAdjForm(p => ({ ...p, type: e.target.value }))}
                options={[
                  { value: 'add', label: 'Add Stock (Restock)' },
                  { value: 'remove', label: 'Remove Stock' },
                  { value: 'damage', label: 'Damage / Write-off' },
                  { value: 'correction', label: 'Stock Correction' },
                ]} />
            </FormField>
            <FormField label="Quantity">
              <input type="number" className="input" value={adjForm.qty} onChange={e => setAdjForm(p => ({ ...p, qty: e.target.value }))} min={1} />
            </FormField>
            <FormField label="Reason" required>
              <input className="input" value={adjForm.reason} onChange={e => setAdjForm(p => ({ ...p, reason: e.target.value }))} placeholder="Explain the reason" />
            </FormField>
          </div>
        )}
      </Modal>
    </div>
  );
}
