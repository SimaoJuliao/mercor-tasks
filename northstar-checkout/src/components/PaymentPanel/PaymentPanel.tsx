import type React from 'react';
import { CardPreview } from '@components/CardPreview';
import { PayButton } from '@components/PayButton';
import { PaymentError } from '@components/PaymentError';
import { PaymentStatusAnnouncer } from '@components/PaymentStatusAnnouncer';
import { PaymentSuccess } from '@components/PaymentSuccess';
import type { CheckoutStatus } from '@/types';

interface PaymentPanelProps {
  total: string;
  status: CheckoutStatus;
  isLoading: boolean;
  onPay: () => void;
}

export const PaymentPanel: React.FC<PaymentPanelProps> = ({
  total,
  status,
  isLoading,
  onPay,
}) => (
  <section
    className="panel panel--payment"
    aria-labelledby="payment-heading"
    aria-busy={isLoading}
  >
    <h2 id="payment-heading" className="panel__title">
      Payment method
    </h2>

    <CardPreview />

    {status.kind === 'success' ? (
      <PaymentSuccess result={status.result} />
    ) : (
      <>
        {status.kind === 'error' && <PaymentError message={status.message} />}
        <PayButton isLoading={isLoading} total={total} onPay={onPay} />
      </>
    )}

    <PaymentStatusAnnouncer status={status} />

    <p className="fine-print">
      Payments on this page are simulated by a local service. Nothing is sent to a payment
      provider.
    </p>
  </section>
);
