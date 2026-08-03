import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { fetchCustomers } from '../services/customerService';
import { fetchProducts } from '../services/productService';
import { createBill, fetchFiscalYears } from '../services/billService';
import { useTransaction } from '../contexts/TransactionContext';
import TransactionTypeBar from '../components/TransactionTypeBar';
import { normalizeFiscalYear } from '../utils/fiscalYear';

const newItem = () => ({
  product_id: '', product_name: '', product_code: '', hs_code: '',
  unit: '', quantity: 1, rate: 0, discount: 0,
  taxable_amount: 0, vat_rate: 13, vat_amount: 0, total: 0,
});

const fmt = (n) => Number(n || 0).toFixed(2);

const BillsPage = () => {
  const { transactionType, fiscalYear, fiscalYears, setFiscalYear } = useTransaction();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    bill_number: '',
    fiscal_year: '',
    customer_id: '',
    payment_method: 'Cash',
    status: 'Draft',
  });
  const [items, setItems] = useState([newItem()]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCustomers().then(setCustomers).catch(() => {});
    fetchProducts().then(setProducts).catch(() => {});
    fetchFiscalYears().then((years) => {
      const normalized = years.map(normalizeFiscalYear).filter(Boolean);
      if (normalized.length && !fiscalYear) setFiscalYear(normalized[0]);
    }).catch(() => {});
    const prefix = transactionType === 'Sales' ? 'S' : 'P';
    setForm((f) => ({
      ...f,
      bill_number: `${prefix}-${Date.now().toString().slice(-6)}`,
      fiscal_year: fiscalYear || f.fiscal_year,
    }));
  }, [transactionType, fiscalYear]);

  const setField = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'product_id') {
      const product = products.find((p) => Number(p.id) === Number(value));
      if (product) {
        updated[index].product_name = product.product_name;
        updated[index].product_code = product.product_code || '';
        updated[index].hs_code = product.hs_code || '';
        updated[index].unit = product.unit || '';
        updated[index].rate = product.selling_price || 0;
        updated[index].vat_rate = product.vat_rate ?? 13;
      }
    }

    const qty = Number(updated[index].quantity || 0);
    const rate = Number(updated[index].rate || 0);
    const discount = Number(updated[index].discount || 0);
    const taxable = qty * rate - discount;
    const vat = taxable * (Number(updated[index].vat_rate || 0) / 100);
    updated[index].taxable_amount = taxable;
    updated[index].vat_amount = vat;
    updated[index].total = taxable + vat;
    setItems(updated);
  };

  const addRow = () => setItems([...items, newItem()]);
  const removeRow = (i) => { if (items.length > 1) setItems(items.filter((_, idx) => idx !== i)); };

  const subtotal = useMemo(() => items.reduce((s, it) => s + Number(it.taxable_amount || 0), 0), [items]);
  const vatTotal = useMemo(() => items.reduce((s, it) => s + Number(it.vat_amount || 0), 0), [items]);
  const grand = subtotal + vatTotal;
  const net = Math.round(grand);
  const roundOff = net - grand;

  const saveBill = async () => {
    if (!form.bill_number.trim()) { toast.error('Bill number is required'); return; }
    setLoading(true);
    try {
      await createBill({
        ...form,
        fiscal_year: form.fiscal_year || fiscalYear,
        transaction_type: transactionType,
        bill_date: new Date().toISOString().slice(0, 10),
        customer_id: form.customer_id || null,
        subtotal, discount: 0, taxable_amount: subtotal,
        vat_amount: vatTotal, grand_total: grand,
        round_off: roundOff, net_total: net, items,
      });
      toast.success(`✅ ${transactionType} bill saved!`);
      const prefix = transactionType === 'Sales' ? 'S' : 'P';
      setForm({
        bill_number: `${prefix}-${Date.now().toString().slice(-6)}`,
        fiscal_year: fiscalYear || form.fiscal_year,
        customer_id: '',
        payment_method: 'Cash',
        status: 'Draft',
      });
      setItems([newItem()]);
    } catch {
      toast.error('Failed to save bill');
    } finally {
      setLoading(false);
    }
  };

  const typeLabel = transactionType === 'Sales' ? 'Sales' : 'Purchase';

  return (
    <div className="space-y">
      <TransactionTypeBar />

      <div className="card">
        <div className="card-header">
          <span className="card-title">🧾 Create {typeLabel} Bill</span>
        </div>
        <div className="card-body">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Bill Number *</label>
              <input className="form-input" value={form.bill_number} onChange={setField('bill_number')} />
            </div>
            <div className="form-group">
              <label className="form-label">Fiscal Year</label>
              <select className="form-select" value={form.fiscal_year || fiscalYear} onChange={setField('fiscal_year')}>
                <option value="">— Select —</option>
                {(fiscalYears.length ? fiscalYears : [fiscalYear]).filter(Boolean).map((fy) => (
                  <option key={fy} value={fy}>{fy}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{transactionType === 'Sales' ? 'Customer' : 'Supplier'}</label>
              <select className="form-select" value={form.customer_id} onChange={setField('customer_id')}>
                <option value="">— Select party —</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.customer_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select className="form-select" value={form.payment_method} onChange={setField('payment_method')}>
                <option>Cash</option>
                <option>Cheque</option>
                <option>Bank Transfer</option>
                <option>Online</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">📦 Line Items</span>
          <button className="btn btn-ghost btn-sm" type="button" onClick={addRow}>➕ Add Row</button>
        </div>
        <div className="table-wrapper">
          <table className="bill-table">
            <thead>
              <tr>
                <th style={{ minWidth: 160 }}>Product</th>
                <th>HS Code</th>
                <th>Unit</th>
                <th>Qty</th>
                <th>Rate (रू)</th>
                <th>Disc (रू)</th>
                <th>VAT %</th>
                <th>Taxable</th>
                <th>VAT</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td>
                    <select className="form-select" value={item.product_id} onChange={(e) => updateItem(i, 'product_id', e.target.value)} style={{ minWidth: 140 }}>
                      <option value="">Select...</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.product_name}</option>)}
                    </select>
                  </td>
                  <td><input className="form-input" value={item.hs_code} onChange={(e) => updateItem(i, 'hs_code', e.target.value)} style={{ width: 80 }} /></td>
                  <td><input className="form-input" value={item.unit} onChange={(e) => updateItem(i, 'unit', e.target.value)} style={{ width: 60 }} /></td>
                  <td><input className="form-input" type="number" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} style={{ width: 64 }} /></td>
                  <td><input className="form-input" type="number" value={item.rate} onChange={(e) => updateItem(i, 'rate', e.target.value)} style={{ width: 90 }} /></td>
                  <td><input className="form-input" type="number" value={item.discount} onChange={(e) => updateItem(i, 'discount', e.target.value)} style={{ width: 80 }} /></td>
                  <td><input className="form-input" type="number" value={item.vat_rate} onChange={(e) => updateItem(i, 'vat_rate', e.target.value)} style={{ width: 60 }} /></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{fmt(item.taxable_amount)}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{fmt(item.vat_amount)}</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent-light)' }}>{fmt(item.total)}</td>
                  <td>
                    <button type="button" className="btn btn-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }} onClick={() => removeRow(i)} disabled={items.length === 1}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="summary-box" style={{ flex: 1 }}>
          <div className="summary-item"><label>Subtotal (Taxable)</label><span>रू {fmt(subtotal)}</span></div>
          <div className="summary-item"><label>VAT Amount</label><span>रू {fmt(vatTotal)}</span></div>
          <div className="summary-item"><label>Grand Total</label><span>रू {fmt(grand)}</span></div>
          <div className="summary-item"><label>Round Off</label><span>रू {fmt(roundOff)}</span></div>
          <div className="summary-item highlight"><label>Net Total</label><span>रू {fmt(net)}</span></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 160 }}>
          <select className="form-select" value={form.status} onChange={setField('status')}>
            <option value="Draft">Draft</option>
            <option value="Paid">Paid</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button className="btn btn-success" onClick={saveBill} disabled={loading} style={{ padding: '12px 20px' }}>
            {loading ? '⏳ Saving...' : `💾 Save ${typeLabel} Bill`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillsPage;
