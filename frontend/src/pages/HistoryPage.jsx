import { useEffect, useState } from 'react';
import { fetchBills } from '../services/billService';
import { useTransaction } from '../contexts/TransactionContext';
import TransactionTypeBar from '../components/TransactionTypeBar';

const statusBadge = (s) => {
  if (!s) return 'badge-blue';
  const l = s.toLowerCase();
  if (l === 'paid' || l === 'imported') return 'badge-green';
  if (l === 'cancelled') return 'badge-red';
  if (l === 'draft') return 'badge-yellow';
  return 'badge-blue';
};

const fmtDate = (d) => {
  if (!d) return '—';
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
};

const HistoryPage = () => {
  const { transactionType, fiscalYear } = useTransaction();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = { transaction_type: transactionType };
    if (fiscalYear) params.fiscal_year = fiscalYear;
    fetchBills(params)
      .then(setBills)
      .catch(() => setBills([]))
      .finally(() => setLoading(false));
  }, [transactionType, fiscalYear]);

  const filtered = bills.filter(b =>
    b.bill_number?.toLowerCase().includes(search.toLowerCase()) ||
    b.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  const typeLabel = transactionType === 'Sales' ? 'Sales' : 'Purchase';
  const totals = filtered.reduce(
    (acc, b) => ({
      taxable: acc.taxable + Number(b.taxable_amount || 0),
      vat: acc.vat + Number(b.vat_amount || 0),
      net: acc.net + Number(b.net_total || 0),
    }),
    { taxable: 0, vat: 0, net: 0 }
  );

  return (
    <div className="space-y">
      <TransactionTypeBar />

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className={`stat-card ${transactionType === 'Sales' ? 'green' : 'orange'}`}>
          <div className="stat-label">{typeLabel} Taxable</div>
          <div className="stat-value" style={{ fontSize: 18 }}>रू {totals.taxable.toLocaleString()}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">{typeLabel} VAT</div>
          <div className="stat-value" style={{ fontSize: 18 }}>रू {totals.vat.toLocaleString()}</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">{typeLabel} Total</div>
          <div className="stat-value" style={{ fontSize: 18 }}>रू {totals.net.toLocaleString()}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">{typeLabel} Bill History{fiscalYear ? ` · FY ${fiscalYear}` : ''}</span>
          <div className="flex items-center gap-2">
            <input
              className="form-input"
              style={{ width: 220, padding: '6px 12px' }}
              placeholder="🔍 Search by bill or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length} bills</span>
          </div>
        </div>
        <div className="table-wrapper">
          {loading ? (
            <div className="empty-state">⏳<p>Loading {typeLabel.toLowerCase()} bills...</p></div>
          ) : !filtered.length ? (
            <div className="empty-state">📋<p>{search ? 'No matching bills' : `No ${typeLabel.toLowerCase()} bills found`}</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Bill No.</th>
                  <th>Date</th>
                  <th>Party</th>
                  <th>PAN</th>
                  <th>Fiscal Year</th>
                  <th>Taxable</th>
                  <th>VAT</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((bill) => (
                  <tr key={bill.id}>
                    <td style={{ fontWeight: 600, color: 'var(--accent-light)' }}>{bill.bill_number}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{fmtDate(bill.bill_date || bill.created_at)}</td>
                    <td>{bill.customer_name || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{bill.pan_number || '—'}</td>
                    <td>{bill.fiscal_year}</td>
                    <td>रू {Number(bill.taxable_amount || 0).toLocaleString()}</td>
                    <td>रू {Number(bill.vat_amount || 0).toLocaleString()}</td>
                    <td style={{ fontWeight: 700 }}>रू {Number(bill.net_total || 0).toLocaleString()}</td>
                    <td><span className={`badge ${statusBadge(bill.status)}`}>{bill.status}</span></td>
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

export default HistoryPage;
