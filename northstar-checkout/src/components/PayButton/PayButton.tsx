import type React from 'react';

interface PayButtonProps {
  isLoading: boolean;
  total: string;
  onPay: () => void;
}

export const PayButton: React.FC<PayButtonProps> = ({ isLoading, total, onPay }) => (
  <button type="button" className="pay-button" onClick={onPay} disabled={isLoading}>
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
