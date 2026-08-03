import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchFiscalYears } from '../services/billService';
import { normalizeFiscalYear } from '../utils/fiscalYear';

const TransactionContext = createContext(null);

export const useTransaction = () => {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error('useTransaction must be used within TransactionProvider');
  return ctx;
};

const typeFromPath = (pathname) => {
  if (pathname.startsWith('/purchase')) return 'Purchase';
  if (pathname.startsWith('/sales')) return 'Sales';
  return null;
};

export const TransactionProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathType = typeFromPath(location.pathname);

  const [transactionType, setTransactionTypeState] = useState(() =>
    localStorage.getItem('vat_transaction_type') || 'Sales'
  );
  const [fiscalYear, setFiscalYearState] = useState('');
  const [fiscalYears, setFiscalYears] = useState([]);

  useEffect(() => {
    fetchFiscalYears()
      .then((years) => {
        const normalized = years.map(normalizeFiscalYear).filter(Boolean);
        setFiscalYears(normalized);
        if (normalized.length && !fiscalYear) {
          setFiscalYearState(normalized[0]);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (pathType && pathType !== transactionType) {
      setTransactionTypeState(pathType);
      localStorage.setItem('vat_transaction_type', pathType);
    }
  }, [pathType]);

  const setTransactionType = (type) => {
    setTransactionTypeState(type);
    localStorage.setItem('vat_transaction_type', type);
    const sub = location.pathname.split('/').slice(2).join('/') || 'history';
    navigate(`/${type.toLowerCase()}/${sub || 'history'}`);
  };

  const setFiscalYear = (fy) => setFiscalYearState(fy);

  const value = useMemo(() => ({
    transactionType: pathType || transactionType,
    fiscalYear,
    fiscalYears,
    setTransactionType,
    setFiscalYear,
    isSales: (pathType || transactionType) === 'Sales',
    isPurchase: (pathType || transactionType) === 'Purchase',
  }), [transactionType, pathType, fiscalYear, fiscalYears, location.pathname]);

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

export default TransactionContext;
