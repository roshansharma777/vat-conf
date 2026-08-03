import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard', sub: 'Overview of your VAT billing activity' },
  '/customers': { title: 'Customers', sub: 'Manage customer records and contact info' },
  '/products': { title: 'Products', sub: 'Manage product catalog and pricing' },
  '/bills': { title: 'Create Bill', sub: 'Generate new VAT invoices' },
  '/history': { title: 'Bill History', sub: 'View and manage past bills' },
  '/confirmations': { title: 'VAT Confirmations', sub: 'Generate VAT confirmation documents' },
  '/imports': { title: 'Import Excel', sub: 'Import purchase or sales data from Excel' },
  '/reports': { title: 'Reports', sub: 'Financial summaries and analytics' },
};

const AppLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const pageInfo = PAGE_TITLES[location.pathname] || { title: 'Nepal VAT Billing', sub: '' };
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-title">
            <h1>{pageInfo.title}</h1>
            {pageInfo.sub && <p>{pageInfo.sub}</p>}
          </div>
          <div className="topbar-actions">
            <div className="user-badge">
              <div className="user-avatar">{initials}</div>
              <span className="user-name">{user?.name || 'User'}</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={logout}>
              🚪 Logout
            </button>
          </div>
        </header>
        <main className="page-wrapper">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
