import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ReactQueryProvider } from './api/queryClient.jsx';

// Global monkey-patch to ensure toLocaleString() formats to exactly 2 decimal places by default
const originalToLocaleString = Number.prototype.toLocaleString;
Number.prototype.toLocaleString = function (locales, options) {
  const opt = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  };
  return originalToLocaleString.call(this, locales, opt);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ReactQueryProvider>
      <App />
    </ReactQueryProvider>
  </React.StrictMode>
);

