/**
 * Indonesian Number to Words Converter (Terbilang)
 * Converts numbers like 1032000 into "Satu juta tiga puluh dua ribu"
 */

const ONES = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

function toWords(n) {
  n = Math.floor(Math.abs(n));
  if (n === 0) return 'nol';
  if (n < 12) return ONES[n];
  if (n < 20) return ONES[n - 10] + ' belas';
  if (n < 100) return ONES[Math.floor(n / 10)] + ' puluh' + (n % 10 !== 0 ? ' ' + ONES[n % 10] : '');
  if (n < 200) return 'seratus' + (n - 100 !== 0 ? ' ' + toWords(n - 100) : '');
  if (n < 1000) return ONES[Math.floor(n / 100)] + ' ratus' + (n % 100 !== 0 ? ' ' + toWords(n % 100) : '');
  if (n < 2000) return 'seribu' + (n - 1000 !== 0 ? ' ' + toWords(n - 1000) : '');
  if (n < 1000000) return toWords(Math.floor(n / 1000)) + ' ribu' + (n % 1000 !== 0 ? ' ' + toWords(n % 1000) : '');
  if (n < 1000000000) return toWords(Math.floor(n / 1000000)) + ' juta' + (n % 1000000 !== 0 ? ' ' + toWords(n % 1000000) : '');
  if (n < 1000000000000) return toWords(Math.floor(n / 1000000000)) + ' milyar' + (n % 1000000000 !== 0 ? ' ' + toWords(n % 1000000000) : '');
  return toWords(Math.floor(n / 1000000000000)) + ' triliun' + (n % 1000000000000 !== 0 ? ' ' + toWords(n % 1000000000000) : '');
}

function terbilang(n, withCurrency = false) {
  const num = typeof n === 'string' ? parseFloat(n.replace(/[^0-9.-]/g, '')) : Number(n);
  if (isNaN(num)) return '';
  let words = toWords(num).trim();
  if (!words) return '';
  // Capitalize first letter
  words = words.charAt(0).toUpperCase() + words.slice(1);
  if (withCurrency) {
    words += ' rupiah';
  }
  return words;
}

module.exports = { terbilang, toWords };
