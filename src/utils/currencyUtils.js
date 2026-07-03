export const formatCurrency = (amount, currency = 'IDR', usedRate) => {
  if (amount === undefined || amount === null) return '';
  const num = parseFloat(amount) || 0;
  if (!currency || currency.toUpperCase() === 'IDR') {
    return `Rp ${Math.round(num).toLocaleString('id-ID')}`;
  }
  const symbols = {
    USD: '$',
    SGD: 'S$',
    EUR: '€',
    CNY: '¥',
    JPY: '¥'
  };
  const symbol = symbols[currency.toUpperCase()] || `${currency.toUpperCase()} `;
  const foreignFormatted = `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  const rate = parseFloat(usedRate);
  if (rate && rate > 0 && rate !== 1.0) {
    const idrEquivalent = Math.round(num * rate);
    return `${foreignFormatted} (Rp ${idrEquivalent.toLocaleString('id-ID')})`;
  }
  
  return foreignFormatted;
};

export const convertToIDR = (amount, usedRate) => {
  const num = parseFloat(amount) || 0;
  const rate = parseFloat(usedRate) || 1.0;
  return num * rate;
};
