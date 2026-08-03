/** SQL expression resolving Sales/Purchase from transaction_type or legacy payment_method */
const TX_TYPE_EXPR = `COALESCE(
  NULLIF(b.transaction_type, ''),
  CASE WHEN b.payment_method IN ('Sales', 'Purchase') THEN b.payment_method ELSE NULL END
)`;

const TX_TYPE_EXPR_PLAIN = `COALESCE(
  NULLIF(transaction_type, ''),
  CASE WHEN payment_method IN ('Sales', 'Purchase') THEN payment_method ELSE NULL END
)`;

module.exports = { TX_TYPE_EXPR, TX_TYPE_EXPR_PLAIN };
