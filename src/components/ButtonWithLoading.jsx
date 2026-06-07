import React, { useState } from 'react';

export const ButtonWithLoading = ({ onClick, children, className = '', disabled = false, ...props }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async (e) => {
    if (disabled || loading) return;
    setLoading(true);
    try {
      await onClick(e);
    } catch (err) {
      console.error('Button action failed:', err);
      alert('Action failed: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={className}
      onClick={handleClick}
      disabled={disabled || loading}
      style={{ opacity: disabled || loading ? 0.6 : 1, cursor: disabled || loading ? 'not-allowed' : 'pointer' }}
      {...props}
    >
      {loading ? 'Processing…' : children}
    </button>
  );
};

