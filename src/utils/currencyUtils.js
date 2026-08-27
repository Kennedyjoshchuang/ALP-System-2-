/**
 * Formats a number with spaces separating thousands.
 * e.g. 1234567.89 -> "1 234 567.89"
 */
export const formatNumber = (value, options = {}) => {
  if (value === undefined || value === null || value === '') return '';
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/\s+/g, '').replace(/,/g, '.'));
  if (isNaN(num)) return String(value);

  const { minimumFractionDigits, maximumFractionDigits, useGrouping = true } = options;

  let str = '';
  if (minimumFractionDigits !== undefined || maximumFractionDigits !== undefined) {
    const minDec = minimumFractionDigits ?? 0;
    const maxDec = maximumFractionDigits ?? (minimumFractionDigits ?? 2);
    str = num.toLocaleString('en-US', { minimumFractionDigits: minDec, maximumFractionDigits: maxDec, useGrouping: false });
  } else {
    str = String(num);
  }

  const parts = str.split('.');
  if (useGrouping) {
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
  return parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
};

/**
 * Removes spaces from number strings.
 */
export const cleanNumberString = (val) => {
  if (val === undefined || val === null) return '';
  return String(val).replace(/\s+/g, '');
};

export const formatCurrency = (amount, currency = 'IDR', usedRate) => {
  if (amount === undefined || amount === null || amount === '') return '';
  const num = parseFloat(amount) || 0;
  if (!currency || currency.toUpperCase() === 'IDR') {
    return `Rp ${formatNumber(num)}`;
  }
  const symbols = {
    USD: '$',
    SGD: 'S$',
    EUR: '€',
    CNY: '¥',
    JPY: '¥'
  };
  const symbol = symbols[currency.toUpperCase()] || `${currency.toUpperCase()} `;
  const foreignFormatted = `${symbol}${formatNumber(num, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  const rate = parseFloat(usedRate);
  if (rate && rate > 0 && rate !== 1.0) {
    const idrEquivalent = num * rate;
    return `${foreignFormatted} (Rp ${formatNumber(idrEquivalent)})`;
  }
  
  return foreignFormatted;
};

export const convertToIDR = (amount, usedRate) => {
  const num = parseFloat(amount) || 0;
  const rate = parseFloat(usedRate) || 1.0;
  return num * rate;
};

