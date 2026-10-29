import type React from 'react';

interface PayButtonProps {
  isLoading: boolean;
  total: string;
  onPay: () => void;
}

export const PayButton: React.FC<PayButtonProps> = ({ isLoading, total, onPay }) => (
  // aria-disabled (rather than disabled) keeps the button focusable so screen readers
  // can still reach it and announce the processing state.
  <button type="button" className="pay-button" onClick={onPay} aria-disabled={isLoading}>
    {isLoading ? (
      <>
        <span className="spinner" aria-hidden="true" />
        Processing payment…
      </>
    ) : (
      <>Pay now · {total}</>
    )}
  </button>
);
