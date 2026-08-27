import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ReactQueryProvider } from './api/queryClient.jsx';

// Global monkey-patch to ensure toLocaleString() formats thousands separated by a space and defaults to 2 decimal places
const originalToLocaleString = Number.prototype.toLocaleString;
Number.prototype.toLocaleString = function (locales, options) {
  const isID = Array.isArray(locales) ? locales.includes('id-ID') : locales === 'id-ID';
  const opt = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  };
  try {
    const targetLocale = locales || 'id-ID';
    const result = originalToLocaleString.call(this, targetLocale, opt);
    if (targetLocale === 'id-ID' || isID) {
      return result.replace(/\./g, ' ');
    } else {
      return result.replace(/,/g, ' ');
    }
  } catch {
    return originalToLocaleString.call(this, locales, opt);
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ReactQueryProvider>
      <App />
    </ReactQueryProvider>
  </React.StrictMode>
);

