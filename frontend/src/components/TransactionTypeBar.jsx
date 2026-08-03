import { useTransaction } from '../contexts/TransactionContext';

const TransactionTypeBar = ({ showFiscalYear = true }) => {
  const { transactionType, fiscalYear, fiscalYears, setTransactionType, setFiscalYear } = useTransaction();

  return (
    <div className="transaction-bar">
      <div className="transaction-toggle">
        <button
          type="button"
          className={`transaction-btn ${transactionType === 'Sales' ? 'active sales' : ''}`}
          onClick={() => setTransactionType('Sales')}
        >
          📈 Sales
        </button>
        <button
          type="button"
          className={`transaction-btn ${transactionType === 'Purchase' ? 'active purchase' : ''}`}
          onClick={() => setTransactionType('Purchase')}
        >
          🛒 Purchase
        </button>
      </div>
      {showFiscalYear && (
        <div className="transaction-fy">
          <label htmlFor="fy-select">Fiscal Year</label>
          <select
            id="fy-select"
            className="form-select"
            value={fiscalYear}
            onChange={(e) => setFiscalYear(e.target.value)}
          >
            <option value="">All Years</option>
            {fiscalYears.map((fy) => (
              <option key={fy} value={fy}>{fy}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default TransactionTypeBar;
