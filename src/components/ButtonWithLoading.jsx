import React, { useState } from 'react';
import toast from 'react-hot-toast';

export const ButtonWithLoading = ({ 
  onClick, 
  children, 
  className = '', 
  disabled = false, 
  loading: externalLoading, 
  ...props 
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = !!(externalLoading || internalLoading);

  const handleClick = async (e) => {
    if (disabled || isLoading) return;
    setInternalLoading(true);
    try {
      if (onClick) {
        await onClick(e);
      }
    } catch (err) {
      console.error('Button action failed:', err);
      toast.error('Action failed: ' + (err.message || err));
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <button
      className={className}
      onClick={handleClick}
      disabled={disabled || isLoading}
      style={{ opacity: disabled || isLoading ? 0.6 : 1, cursor: disabled || isLoading ? 'not-allowed' : 'pointer' }}
      {...props}
    >
      {isLoading ? 'Processing…' : children}
    </button>
  );
};

