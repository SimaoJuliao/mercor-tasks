import type React from 'react';
import { formatMoney } from '@lib';
import type { PaymentResult } from '@/types';

interface PaymentSuccessProps {
  result: PaymentResult;
}

export const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ result }) => (
  <div className="result result--success">
    <p className="result__title">Payment successful</p>
    <p>{formatMoney(result.amountMinor, result.currency)} was captured by the simulated processor.</p>
    <p className="muted">
      Transaction reference <code>{result.transactionId}</code>
    </p>
  </div>
);
