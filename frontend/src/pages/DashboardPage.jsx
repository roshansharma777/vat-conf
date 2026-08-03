import { useEffect, useState } from 'react';
import { fetchDashboardStats } from '../services/dashboardService';

const STAT_CONFIG = [
  { key: 'totalBills', label: 'Total Bills', icon: '🧾', color: 'blue' },
  { key: 'todayBills', label: "Today's Bills", icon: '📅', color: 'purple' },
  { key: 'monthlySales', label: 'Monthly Sales', icon: '💰', color: 'green', currency: true },
  { key: 'monthlyVat', label: 'Monthly VAT', icon: '📊', color: 'orange', currency: true },
  { key: 'customers', label: 'Customers', icon: '👥', color: 'blue' },
  { key: 'products', label: 'Products', icon: '📦', color: 'purple' },
];

const formatVal = (key, value, currency) => {
  if (currency && value != null) return `रू ${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  return value ?? 0;
};

const statusColor = (s) => {
  if (!s) return 'badge-blue';
  const l = s.toLowerCase();
  if (l === 'paid') return 'badge-green';
  if (l === 'cancelled') return 'badge-red';
  if (l === 'draft') return 'badge-yellow';
  return 'badge-blue';
};

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch(() => setStats({ stats: {}, recentBills: [] }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)' }}>
      ⏳ Loading dashboard...
    </div>
  );

  return (
    <div>
      {/* Stats */}
      <div className="stat-grid">
        {STAT_CONFIG.map(({ key, label, icon, color, currency }) => (
          <div key={key} className={`stat-card ${color}`}>
            <div className={`stat-icon ${color}`}>{icon}</div>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{formatVal(key, stats?.stats?.[key], currency)}</div>
          </div>
        ))}
      </div>

      {/* Recent Bills */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Bills</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last 10 bills</span>
        </div>
        <div className="table-wrapper">
          {!stats?.recentBills?.length ? (
            <div className="empty-state">🧾<p>No bills yet</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Bill No.</th>
                  <th>Customer</th>
                  <th>Fiscal Year</th>
                  <th>Taxable</th>
                  <th>VAT</th>
                  <th>Net Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentBills.map((bill) => (
                  <tr key={bill.id}>
                    <td style={{ fontWeight: 600, color: 'var(--accent-light)' }}>{bill.bill_number}</td>
                    <td>{bill.customer_name || <span style={{ color: 'var(--text-muted)' }}>N/A</span>}</td>
                    <td>{bill.fiscal_year}</td>
                    <td>रू {Number(bill.taxable_amount || 0).toLocaleString()}</td>
                    <td>रू {Number(bill.vat_amount || 0).toLocaleString()}</td>
                    <td style={{ fontWeight: 700 }}>रू {Number(bill.net_total || 0).toLocaleString()}</td>
                    <td><span className={`badge ${statusColor(bill.status)}`}>{bill.status}</span></td>
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

export default DashboardPage;
