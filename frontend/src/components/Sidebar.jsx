import { NavLink, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/customers', icon: '👥', label: 'Customers' },
  { to: '/products', icon: '📦', label: 'Products' },
];

const BILL_ITEMS = [
  { to: '/bills', icon: '🧾', label: 'Create Bill' },
  { to: '/history', icon: '📋', label: 'Bill History' },
  { to: '/confirmations', icon: '✅', label: 'VAT Confirmation' },
];

const TOOLS_ITEMS = [
  { to: '/imports', icon: '📥', label: 'Import Excel' },
  { to: '/reports', icon: '📈', label: 'Reports' },
];

const NavGroup = ({ items }) => (
  <>
    {items.map(({ to, icon, label }) => (
      <NavLink
        key={to}
        to={to}
        className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
      >
        <span className="nav-icon">{icon}</span>
        {label}
      </NavLink>
    ))}
  </>
);

const Sidebar = () => (
  <aside className="sidebar">
    <div className="sidebar-brand">
      <div className="sidebar-brand-icon">🏦</div>
      <div className="sidebar-brand-text">
        <h2>Nepal VAT</h2>
        <p>Billing System</p>
      </div>
    </div>
    <nav className="sidebar-nav">
      <div className="sidebar-section-label">Main</div>
      <NavGroup items={NAV_ITEMS} />
      <div className="sidebar-section-label">Billing</div>
      <NavGroup items={BILL_ITEMS} />
      <div className="sidebar-section-label">Tools</div>
      <NavGroup items={TOOLS_ITEMS} />
    </nav>
    <div className="sidebar-footer">
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
        FY 2081/82 · VAT 13%
      </div>
    </div>
  </aside>
);

export default Sidebar;
