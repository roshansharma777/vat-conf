import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { fetchCustomers } from '../services/customerService';
import { fetchCompany } from '../services/companyService';
import {
  createConfirmation, fetchConfirmation, fetchConfirmationSummary,
  fetchConfirmations, fetchFiscalYears,
} from '../services/confirmationService';
import { useTransaction } from '../contexts/TransactionContext';
import TransactionTypeBar from '../components/TransactionTypeBar';
import { normalizeFiscalYear } from '../utils/fiscalYear';
import { buildConfirmationPdf } from '../utils/confirmationPdf';

const statusBadge = (s) => {
  if (!s) return 'badge-blue';
  const l = s.toLowerCase();
  if (l === 'confirmed') return 'badge-green';
  if (l === 'draft') return 'badge-yellow';
  return 'badge-blue';
};

const ConfirmationsPage = () => {
  const { transactionType, fiscalYear, fiscalYears, setFiscalYear } = useTransaction();
  const [customers, setCustomers] = useState([]);
  const [confirmations, setConfirmations] = useState([]);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState({
    customer_id: '',
    fiscal_year: '',
    confirmation_number: '',
    letter_date: '',
    signed_by: '',
    designation: '',
  });
  const [loading, setLoading] = useState(false);

  const typeLabel = transactionType === 'Sales' ? 'Sales' : 'Purchase';

  const loadConfirmations = () => {
    fetchConfirmations(transactionType)
      .then(setConfirmations)
      .catch((err) => toast.error(err.response?.data?.message || 'Could not fetch confirmations'));
  };

  const loadSummary = async (customerId, fy) => {
    if (!customerId || !fy) { setSummary(null); return; }
    try {
      const totals = await fetchConfirmationSummary(customerId, fy, transactionType);
      setSummary(totals);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not fetch summary');
      setSummary(null);
    }
  };

  useEffect(() => {
    fetchCustomers().then(setCustomers).catch(() => {});
    fetchCompany().then((c) => {
      setCompanyInfo(c);
      setForm((f) => ({
        ...f,
        signed_by: c?.contact_person || '',
        designation: c?.designation || 'Accountant',
      }));
    }).catch(() => {});
    fetchFiscalYears().then((years) => {
      const normalized = years.map(normalizeFiscalYear).filter(Boolean);
      if (normalized.length && !fiscalYear) setFiscalYear(normalized[0]);
    }).catch(() => {});
    loadConfirmations();
    setForm((f) => ({
      ...f,
      confirmation_number: `${transactionType.slice(0, 1)}CONF-${Date.now().toString().slice(-6)}`,
      letter_date: new Date().toISOString().slice(0, 10),
      fiscal_year: fiscalYear || f.fiscal_year,
    }));
  }, [transactionType]);

  useEffect(() => {
    setForm((f) => ({ ...f, fiscal_year: fiscalYear || f.fiscal_year }));
    if (form.customer_id && fiscalYear) loadSummary(form.customer_id, fiscalYear);
  }, [fiscalYear]);

  const set = (field) => async (e) => {
    const value = e.target.value;
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);
    if (field === 'customer_id' || field === 'fiscal_year') {
      const fy = field === 'fiscal_year' ? value : nextForm.fiscal_year;
      const cid = field === 'customer_id' ? value : nextForm.customer_id;
      if (cid && fy) await loadSummary(cid, fy);
      else setSummary(null);
    }
  };

  const getTypeTotals = (totals) => {
    if (transactionType === 'Sales') {
      return { taxable: totals.sales_taxable, vat: totals.sales_vat, total: totals.sales_total };
    }
    return { taxable: totals.purchase_taxable, vat: totals.purchase_vat, total: totals.purchase_total };
  };

  const isZeroSummary = (s) => {
    if (!s) return true;
    const t = getTypeTotals(s);
    return (t.taxable || 0) === 0 && (t.vat || 0) === 0 && (t.total || 0) === 0;
  };

  const generate = async () => {
    if (!form.confirmation_number.trim()) { toast.error('Confirmation number is required'); return; }
    if (!form.customer_id) { toast.error('Please select a customer'); return; }
    if (!form.fiscal_year.trim()) { toast.error('Fiscal year is required'); return; }
    setLoading(true);
    try {
      const totals = await fetchConfirmationSummary(form.customer_id, form.fiscal_year, transactionType);
      await createConfirmation({
        ...form,
        customer_id: form.customer_id || null,
        confirmation_type: transactionType,
        sales_taxable: transactionType === 'Sales' ? totals.sales_taxable : 0,
        sales_vat: transactionType === 'Sales' ? totals.sales_vat : 0,
        sales_total: transactionType === 'Sales' ? totals.sales_total : 0,
        purchase_taxable: transactionType === 'Purchase' ? totals.purchase_taxable : 0,
        purchase_vat: transactionType === 'Purchase' ? totals.purchase_vat : 0,
        purchase_total: transactionType === 'Purchase' ? totals.purchase_total : 0,
        opening_balance: 0, closing_balance: 0,
        status: 'Draft', created_by: 1,
      });
      toast.success(`✅ ${typeLabel} VAT confirmation generated`);
      setForm({
        customer_id: '',
        fiscal_year: fiscalYear || fiscalYears[0] || '',
        confirmation_number: `${transactionType.slice(0, 1)}CONF-${Date.now().toString().slice(-6)}`,
        letter_date: new Date().toISOString().slice(0, 10),
        signed_by: form.signed_by,
        designation: form.designation,
      });
      setSummary(null);
      loadConfirmations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not generate confirmation');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (value) => `रू ${Number(value || 0).toLocaleString('en-IN')}`;

  const downloadPdf = async (id) => {
    try {
      const confirmation = await fetchConfirmation(id);
      const doc = buildConfirmationPdf(confirmation, companyInfo);
      doc.save(`${confirmation.confirmation_number || 'VAT-Confirmation'}.pdf`);
    } catch (error) {
      toast.error(error.message || 'Could not generate PDF');
    }
  };

  const filteredConfirmations = confirmations.filter((c) => {
    if (fiscalYear && c.fiscal_year !== fiscalYear) return false;
    const ctype = c.confirmation_type || c.confirmationType;
    if (ctype && ctype !== 'Both') return ctype === transactionType;
    if (transactionType === 'Sales') return (c.sales_total || 0) > 0;
    return (c.purchase_total || 0) > 0;
  });

  const displayTotal = (c) =>
    transactionType === 'Sales'
      ? Number(c.sales_total || 0)
      : Number(c.purchase_total || 0);

  return (
    <div className="space-y">
      <TransactionTypeBar />

      <div className="card">
        <div className="card-header">
          <span className="card-title">✅ Generate {typeLabel} VAT Confirmation</span>
        </div>
        <div className="card-body">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Confirmation Number</label>
              <input className="form-input" value={form.confirmation_number} onChange={set('confirmation_number')} />
            </div>
            <div className="form-group">
              <label className="form-label">Fiscal Year</label>
              <select className="form-select" value={form.fiscal_year || fiscalYear} onChange={set('fiscal_year')}>
                <option value="">— Select Fiscal Year —</option>
                {(fiscalYears.length ? fiscalYears : [fiscalYear]).filter(Boolean).map((fy) => (
                  <option key={fy} value={fy}>{fy}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{transactionType === 'Sales' ? 'Customer' : 'Supplier'}</label>
              <select className="form-select" value={form.customer_id} onChange={set('customer_id')}>
                <option value="">— Select party —</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.customer_name}</option>)}
              </select>
            </div>
            {summary && (
              <div className="form-group card card-secondary" style={{ padding: '1rem', gridColumn: '1 / -1' }}>
                <div style={{ marginBottom: '0.5rem', fontWeight: 700 }}>
                  {typeLabel} totals for {form.fiscal_year || fiscalYear}
                </div>
                {isZeroSummary(summary) ? (
                  <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    ⚠️ No {typeLabel.toLowerCase()} bills found for this party and fiscal year.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                    <div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Taxable</div><div>{formatAmount(getTypeTotals(summary).taxable)}</div></div>
                    <div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>VAT</div><div>{formatAmount(getTypeTotals(summary).vat)}</div></div>
                    <div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total</div><div>{formatAmount(getTypeTotals(summary).total)}</div></div>
                  </div>
                )}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Letter Date</label>
              <input type="date" className="form-input" value={form.letter_date} onChange={set('letter_date')} />
            </div>
            <div className="form-group">
              <label className="form-label">Signed By</label>
              <input className="form-input" value={form.signed_by} onChange={set('signed_by')} />
            </div>
            <div className="form-group">
              <label className="form-label">Designation</label>
              <input className="form-input" value={form.designation} onChange={set('designation')} />
            </div>
          </div>
          <div className="mt-4">
            <button className="btn btn-primary" onClick={generate} disabled={loading}>
              {loading ? '⏳ Generating...' : `✅ Generate ${typeLabel} Confirmation`}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex justify-between items-center">
          <div>
            <span className="card-title">{typeLabel} Confirmations</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
              {filteredConfirmations.length} records{fiscalYear ? ` · FY ${fiscalYear}` : ''}
            </span>
          </div>
          <a
            href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reports/export/excel?type=${transactionType.toLowerCase()}${fiscalYear ? `&fiscal_year=${encodeURIComponent(fiscalYear)}` : ''}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: 13 }}
          >
            📊 Export {typeLabel} (Excel)
          </a>
        </div>
        <div className="table-wrapper">
          {!filteredConfirmations.length ? (
            <div className="empty-state">✅<p>No {typeLabel.toLowerCase()} confirmations yet</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Confirmation No.</th>
                  <th>Party</th>
                  <th>Fiscal Year</th>
                  <th>Taxable</th>
                  <th>VAT</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredConfirmations.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600, color: 'var(--accent-light)' }}>{c.confirmation_number}</td>
                    <td>{c.customer_name || '—'}</td>
                    <td>{c.fiscal_year}</td>
                    <td>रू {Number(transactionType === 'Sales' ? c.sales_taxable : c.purchase_taxable || 0).toLocaleString()}</td>
                    <td>रू {Number(transactionType === 'Sales' ? c.sales_vat : c.purchase_vat || 0).toLocaleString()}</td>
                    <td style={{ fontWeight: 700 }}>रू {displayTotal(c).toLocaleString()}</td>
                    <td><span className={`badge ${statusBadge(c.status)}`}>{c.status}</span></td>
                    <td>
                      <button className="btn btn-ghost" type="button" onClick={() => downloadPdf(c.id)}>Download PDF</button>
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

export default ConfirmationsPage;
