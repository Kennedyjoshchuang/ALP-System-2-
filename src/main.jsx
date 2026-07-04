import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ReactQueryProvider } from './api/queryClient.jsx';

// Global monkey-patch to ensure toLocaleString() preserves all decimal places (cents) exactly as they are
const originalToLocaleString = Number.prototype.toLocaleString;
Number.prototype.toLocaleString = function (locales, options) {
  const numStr = this.toString();
  const dotIdx = numStr.indexOf('.');
  const d = dotIdx === -1 ? 0 : numStr.length - dotIdx - 1;

  const opt = { ...options };
  if (d > 0) {
    opt.maximumFractionDigits = Math.max(d, opt.maximumFractionDigits ?? 0);
  }
  return originalToLocaleString.call(this, locales, opt);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ReactQueryProvider>
      <App />
    </ReactQueryProvider>
  </React.StrictMode>
);

