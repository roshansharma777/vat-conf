import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer } from '../services/customerService';

const initialForm = { customer_name: '', company_name: '', pan_number: '', address: '', phone: '', email: '' };

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadCustomers = async () => {
    try {
      const data = await fetchCustomers();
      setCustomers(data);
    } catch {
      toast.error('Failed to load customers');
    }
  };

  useEffect(() => { loadCustomers(); }, []);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.customer_name.trim()) { toast.error('Customer name is required'); return; }
    setLoading(true);
    try {
      if (editingId) {
        await updateCustomer(editingId, form);
        toast.success('Customer updated');
      } else {
        await createCustomer(form);
        toast.success('Customer added');
      }
      setForm(initialForm);
      setEditingId(null);
      loadCustomers();
    } catch {
      toast.error('Could not save customer');
    } finally {
      setLoading(false);
    }
  };

  const edit = (customer) => {
    setForm({
      customer_name: customer.customer_name || '',
      company_name: customer.company_name || '',
      pan_number: customer.pan_number || '',
      address: customer.address || '',
      phone: customer.phone || '',
      email: customer.email || '',
    });
    setEditingId(customer.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id) => {
    if (!confirm('Delete this customer?')) return;
    try {
      await deleteCustomer(id);
      toast.success('Customer deleted');
      loadCustomers();
    } catch {
      toast.error('Could not delete customer');
    }
  };

  const cancelEdit = () => { setForm(initialForm); setEditingId(null); };

  return (
    <div className="two-col">
      {/* Form */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">{editingId ? '✏️ Edit Customer' : '➕ Add Customer'}</span>
        </div>
        <div className="card-body">
          <form onSubmit={submit} className="space-y">
            <div className="form-group">
              <label className="form-label">Customer Name *</label>
              <input className="form-input" placeholder="Full name" value={form.customer_name} onChange={set('customer_name')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input className="form-input" placeholder="Company / Business name" value={form.company_name} onChange={set('company_name')} />
            </div>
            <div className="form-group">
              <label className="form-label">PAN / VAT Number</label>
              <input className="form-input" placeholder="e.g. 123456789" value={form.pan_number} onChange={set('pan_number')} />
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-input" placeholder="Street, City" value={form.address} onChange={set('address')} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" placeholder="+977-" value={form.phone} onChange={set('phone')} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="email@example.com" value={form.email} onChange={set('email')} />
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn btn-primary w-full" disabled={loading}>
                {loading ? '⏳ Saving...' : editingId ? '💾 Update' : '➕ Add Customer'}
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
          <span className="card-title">Customers</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{customers.length} records</span>
        </div>
        <div className="table-wrapper">
          {!customers.length ? (
            <div className="empty-state">👥<p>No customers yet. Add one on the left.</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Company</th>
                  <th>PAN</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.customer_name}</td>
                    <td>{c.company_name || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>{c.pan_number || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>{c.phone || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>{c.address || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn btn-ghost btn-sm" onClick={() => edit(c)}>✏️</button>
                        <button className="btn btn-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }} onClick={() => remove(c.id)}>🗑️</button>
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

export default CustomersPage;
