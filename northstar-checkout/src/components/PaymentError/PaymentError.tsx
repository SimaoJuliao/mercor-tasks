import type React from 'react';

interface PaymentErrorProps {
  message: string;
}

export const PaymentError: React.FC<PaymentErrorProps> = ({ message }) => (
  <div className="result result--error" role="alert">
    <p className="result__title">Payment failed</p>
    <p>{message}</p>
    <p className="muted">No money was taken. You can try again.</p>
  </div>
);
