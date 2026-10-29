import type React from 'react';
import type { CheckoutStatus } from '@/types';

interface PaymentStatusAnnouncerProps {
  status: CheckoutStatus;
}

/** Visually hidden live region that announces progress and success to screen readers. */
export const PaymentStatusAnnouncer: React.FC<PaymentStatusAnnouncerProps> = ({ status }) => (
  <p className="sr-only" role="status" aria-live="polite">
    {status.kind === 'processing' && 'Processing your payment. Please wait.'}
    {status.kind === 'success' &&
      `Payment successful. Transaction reference ${status.result.transactionId}.`}
  </p>
);
