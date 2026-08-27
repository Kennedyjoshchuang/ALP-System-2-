import React, { useRef, useLayoutEffect, forwardRef, useImperativeHandle } from 'react';

/**
 * Format a numeric string with spaces separating thousands.
 * e.g. "1234567.89" -> "1 234 567.89"
 */
export const formatWithThousandsSpace = (val, allowDecimal = true) => {
  if (val === undefined || val === null || val === '') return '';
  const str = String(val).replace(/\s+/g, '');
  if (str === '' || str === '-') return str;

  const isNegative = str.startsWith('-');
  const unsigned = isNegative ? str.slice(1) : str;

  const parts = unsigned.split('.');
  // Format integer portion with spaces every 3 digits
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  if (allowDecimal && parts.length > 1) {
    return `${isNegative ? '-' : ''}${integerPart}.${parts.slice(1).join('')}`;
  }
  return `${isNegative ? '-' : ''}${integerPart}`;
};

/**
 * Strips formatting spaces and non-numeric characters from input value.
 */
export const unformatThousandsSpace = (val, allowDecimal = true, allowNegative = true) => {
  if (val === undefined || val === null) return '';
  let str = String(val).replace(/\s+/g, '').replace(/,/g, '.');

  if (!allowNegative) {
    str = str.replace(/-/g, '');
  } else {
    // Only allow '-' at the very beginning
    const isNegative = str.startsWith('-');
    str = (isNegative ? '-' : '') + str.replace(/-/g, '');
  }

  if (!allowDecimal) {
    return str.replace(/[^0-9-]/g, '');
  }

  // Allow only one decimal point
  const parts = str.split('.');
  if (parts.length > 1) {
    const intPart = parts[0].replace(/[^0-9-]/g, '');
    const decPart = parts.slice(1).join('').replace(/[^0-9]/g, '');
    return `${intPart}.${decPart}`;
  }
  return str.replace(/[^0-9-]/g, '');
};

const FormattedNumberInput = forwardRef(function FormattedNumberInput(
  {
    value,
    onChange,
    allowDecimal = true,
    allowNegative = false,
    placeholder = '0',
    className = '',
    style = {},
    disabled = false,
    readOnly = false,
    required = false,
    min,
    max,
    name,
    id,
    'aria-label': ariaLabel,
    onBlur,
    onFocus,
    onKeyDown,
    ...rest
  },
  ref
) {
  const internalInputRef = useRef(null);
  useImperativeHandle(ref, () => internalInputRef.current);

  const cursorRef = useRef(null);

  // Derive displayed formatted value from raw value prop
  const rawString = value !== undefined && value !== null ? String(value) : '';
  const displayValue = formatWithThousandsSpace(rawString, allowDecimal);

  useLayoutEffect(() => {
    if (cursorRef.current !== null && internalInputRef.current) {
      const { rawCharsBeforeCursor } = cursorRef.current;
      const currentFormatted = internalInputRef.current.value;

      // Find the new cursor position by counting raw (non-space) characters
      let rawCount = 0;
      let newPos = currentFormatted.length;

      for (let i = 0; i < currentFormatted.length; i++) {
        if (currentFormatted[i] !== ' ') {
          rawCount++;
        }
        if (rawCount === rawCharsBeforeCursor) {
          newPos = i + 1;
          break;
        }
      }

      if (rawCharsBeforeCursor === 0) {
        newPos = 0;
      }

      internalInputRef.current.setSelectionRange(newPos, newPos);
      cursorRef.current = null;
    }
  }, [displayValue]);

  const handleChange = (e) => {
    const input = e.target;
    const inputValue = input.value;
    const cursorPos = input.selectionStart || 0;

    // Count non-space characters before the current cursor position
    const textBeforeCursor = inputValue.slice(0, cursorPos);
    const rawCharsBeforeCursor = textBeforeCursor.replace(/\s+/g, '').length;

    cursorRef.current = { rawCharsBeforeCursor };

    // Clean input value
    const cleaned = unformatThousandsSpace(inputValue, allowDecimal, allowNegative);

    if (onChange) {
      // Create synthetic change event with cleaned numeric string value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          name: name || e.target.name,
          value: cleaned
        }
      };
      onChange(syntheticEvent);
    }
  };

  return (
    <input
      ref={internalInputRef}
      type="text"
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      autoComplete="off"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      style={style}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      name={name}
      id={id}
      aria-label={ariaLabel}
      onBlur={onBlur}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      {...rest}
    />
  );
});

export default FormattedNumberInput;
