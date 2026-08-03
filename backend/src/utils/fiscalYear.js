/**
 * Normalizes fiscal year strings into canonical 'YYYY/YY' format (e.g., '2081/82').
 * Handles variations such as '2081-82', '081/82', '2081/082', '2081/2082'.
 */
function normalizeFiscalYear(input) {
  if (!input || typeof input !== 'string') return '';
  const str = input.trim();

  // Match pattern like 2081/82, 2081-82, 081/82, 2081/082, 2081-2082
  const match = str.match(/^(\d{2,4})[\/\-](\d{2,4})$/);
  if (!match) return str;

  let [, start, end] = match;
  if (start.length === 2) start = '20' + start;
  else if (start.length === 3 && start.startsWith('0')) start = '2' + start;
  if (end.length === 4) end = end.slice(-2);
  else if (end.length === 3) end = end.slice(-2);
  
  return `${start}/${end}`;
}

module.exports = { normalizeFiscalYear };
