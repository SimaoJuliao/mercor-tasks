import { useCallback, useState } from 'react';
import { formatMoney } from '@lib';
import { submitPayment } from '@/services';
import type { CheckoutStatus } from '@/types';
import { DEMO_ORDER } from './CheckoutScreen.mock';

const GENERIC_ERROR_MESSAGE = 'Something went wrong while processing the payment.';


const useCheckoutScreen = () => {
  const order = DEMO_ORDER;
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<CheckoutStatus>({ kind: 'idle' });

  const total = formatMoney(order.amountMinor, order.currency);

  const handlePay = useCallback(async () => {
    // Ignore clicks while a payment is already in progress.
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setStatus({ kind: 'processing' });

    try {
      const result = await submitPayment({
        orderId: order.id,
        amountMinor: order.amountMinor,
        currency: order.currency,
      });
      setStatus({ kind: 'success', result });
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE,
      });
    } finally {
      setIsLoading(false);
    }
  }, [order]);

  return { order, status, isLoading, total, handlePay };
};

export default useCheckoutScreen;
