import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../services/productService';

const initialForm = {
  product_name: '', product_code: '', hs_code: '', category: '', unit: '',
  purchase_price: '', selling_price: '', vat_rate: '13', stock: '', description: '', status: 'Active'
};

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadProducts = async () => {
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch {
      toast.error('Failed to load products');
    }
  };

  useEffect(() => { loadProducts(); }, []);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.product_name.trim()) { toast.error('Product name is required'); return; }
    setLoading(true);
    try {
      if (editingId) {
        await updateProduct(editingId, form);
        toast.success('Product updated');
      } else {
        await createProduct(form);
        toast.success('Product added');
      }
      setForm(initialForm);
      setEditingId(null);
      loadProducts();
    } catch {
      toast.error('Could not save product');
    } finally {
      setLoading(false);
    }
  };

  const edit = (product) => {
    setForm({
      product_name: product.product_name || '',
      product_code: product.product_code || '',
      hs_code: product.hs_code || '',
      category: product.category || '',
      unit: product.unit || '',
      purchase_price: product.purchase_price ?? '',
      selling_price: product.selling_price ?? '',
      vat_rate: product.vat_rate ?? '13',
      stock: product.stock ?? '',
      description: product.description || '',
      status: product.status || 'Active',
    });
    setEditingId(product.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await deleteProduct(id);
      toast.success('Product deleted');
      loadProducts();
    } catch {
      toast.error('Could not delete product');
    }
  };

  const cancelEdit = () => { setForm(initialForm); setEditingId(null); };

  return (
    <div className="two-col">
      {/* Form */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">{editingId ? '✏️ Edit Product' : '➕ Add Product'}</span>
        </div>
        <div className="card-body">
          <form onSubmit={submit} className="space-y">
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input className="form-input" placeholder="Name" value={form.product_name} onChange={set('product_name')} required />
            </div>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label className="form-label">Product Code</label>
                <input className="form-input" placeholder="e.g. PRD-001" value={form.product_code} onChange={set('product_code')} />
              </div>
              <div className="form-group">
                <label className="form-label">HS Code</label>
                <input className="form-input" placeholder="HS Code" value={form.hs_code} onChange={set('hs_code')} />
              </div>
            </div>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input className="form-input" placeholder="General" value={form.category} onChange={set('category')} />
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <input className="form-input" placeholder="PCS" value={form.unit} onChange={set('unit')} />
              </div>
            </div>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label className="form-label">Purchase Price</label>
                <input className="form-input" type="number" placeholder="0" value={form.purchase_price} onChange={set('purchase_price')} />
              </div>
              <div className="form-group">
                <label className="form-label">Selling Price</label>
                <input className="form-input" type="number" placeholder="0" value={form.selling_price} onChange={set('selling_price')} />
              </div>
            </div>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label className="form-label">VAT Rate (%)</label>
                <input className="form-input" type="number" placeholder="13" value={form.vat_rate} onChange={set('vat_rate')} />
              </div>
              <div className="form-group">
                <label className="form-label">Stock</label>
                <input className="form-input" type="number" placeholder="0" value={form.stock} onChange={set('stock')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={set('status')}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn btn-primary w-full" disabled={loading}>
                {loading ? '⏳ Saving...' : editingId ? '💾 Update' : '➕ Add Product'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-ghost" onClick={cancelEdit}>Cancel</button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Products</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{products.length} items</span>
        </div>
        <div className="table-wrapper">
          {!products.length ? (
            <div className="empty-state">📦<p>No products yet. Add one on the left.</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Price</th>
                  <th>VAT %</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.product_name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.product_code || '—'}</td>
                    <td>रू {Number(p.selling_price || 0).toLocaleString()}</td>
                    <td>{p.vat_rate ?? 13}%</td>
                    <td>{p.stock ?? 0}</td>
                    <td>
                      <span className={`badge ${p.status === 'Active' ? 'badge-green' : 'badge-red'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn btn-ghost btn-sm" onClick={() => edit(p)}>✏️</button>
                        <button className="btn btn-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }} onClick={() => remove(p.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
