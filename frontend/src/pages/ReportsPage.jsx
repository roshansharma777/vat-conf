import { useEffect, useState } from 'react';
import api from '../services/api';

const ReportsPage = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports')
      .then((res) => setReport(res.data))
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)' }}>
      ⏳ Loading reports...
    </div>
  );

  if (!report) return (
    <div className="card">
      <div className="card-body empty-state">📈<p>Could not load report data</p></div>
    </div>
  );

  return (
    <div className="space-y">
      {/* Summary Cards */}
      <div className="stat-grid">
        <div className="stat-card green">
          <div className="stat-icon green">💰</div>
          <div className="stat-label">Total Sales</div>
          <div className="stat-value" style={{ fontSize: 18 }}>रू {Number(report.totalSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon orange">📊</div>
          <div className="stat-label">Total VAT Collected</div>
          <div className="stat-value" style={{ fontSize: 18 }}>रू {Number(report.totalVat || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon blue">🧾</div>
          <div className="stat-label">Total Bills (last 20)</div>
          <div className="stat-value">{report.totalBills || 0}</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon purple">👥</div>
          <div className="stat-label">Total Customers</div>
          <div className="stat-value">{report.customers?.length || 0}</div>
        </div>
      </div>

      {/* Export Action Bar */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">📥 Export Reports (Excel)</span>
        </div>
        <div className="card-body flex gap-3 flex-wrap">
          <a
            href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reports/export/excel?type=sales`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
          >
            📊 Download Sales (Excel)
          </a>
          <a
            href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reports/export/excel?type=purchase`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
          >
            🛒 Download Purchase (Excel)
          </a>
          <a
            href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reports/export/excel?type=combined`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost"
            style={{ border: '1px solid var(--border)' }}
          >
            📦 Download All Combined (Excel)
          </a>
        </div>
      </div>

      {/* Recent Sales Table */}
      {report.sales?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">📋 Recent Sales (last 20)</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Bill No.</th>
                  <th>Fiscal Year</th>
                  <th>Taxable</th>
                  <th>VAT</th>
                  <th>Net Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {report.sales.map((bill) => (
                  <tr key={bill.id}>
                    <td style={{ fontWeight: 600, color: 'var(--accent-light)' }}>{bill.bill_number}</td>
                    <td>{bill.fiscal_year}</td>
                    <td>रू {Number(bill.taxable_amount || 0).toLocaleString()}</td>
                    <td>रू {Number(bill.vat_amount || 0).toLocaleString()}</td>
                    <td style={{ fontWeight: 700 }}>रू {Number(bill.net_total || 0).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${bill.status === 'Paid' ? 'badge-green' : bill.status === 'Cancelled' ? 'badge-red' : 'badge-yellow'}`}>
                        {bill.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Products Overview */}
      {report.products?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">📦 Products Overview</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Selling Price</th>
                  <th>VAT %</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {report.products.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.product_name}</td>
                    <td>{p.category || '—'}</td>
                    <td>रू {Number(p.selling_price || 0).toLocaleString()}</td>
                    <td>{p.vat_rate ?? 13}%</td>
                    <td>{p.stock ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
