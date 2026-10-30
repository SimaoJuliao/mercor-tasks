import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DECLINE_MESSAGE } from '@lib';
import { CheckoutScreen } from '@screens';
import { DEMO_ORDER } from '@screens/CheckoutScreen/CheckoutScreen.mock';
import { PaymentDeclinedError, submitPayment } from '@/services';
import type { PaymentResult } from '@/types';

vi.mock('@/services/paymentService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/paymentService')>();
  return { ...actual, submitPayment: vi.fn() };
});

const mockedSubmitPayment = vi.mocked(submitPayment);

const SUCCESS_RESULT: PaymentResult = {
  requestId: 'req_0001',
  transactionId: 'NSP-TXN-0001',
  amountMinor: DEMO_ORDER.amountMinor,
  currency: DEMO_ORDER.currency,
  processedAt: '2026-01-01T00:00:00.000Z',
};

const payButton = () => screen.getByRole('button', { name: /pay now/i });

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

describe('CheckoutScreen', () => {
  beforeEach(() => {
    mockedSubmitPayment.mockReset();
  });

  it('renders the heading, amount and pay button', () => {
    render(<CheckoutScreen />);

    expect(screen.getByRole('heading', { level: 1, name: 'Payment checkout' })).toBeInTheDocument();
    expect(screen.getByText(/synthetic payment demonstration/i)).toBeInTheDocument();
    expect(screen.getAllByText('€149.90').length).toBeGreaterThan(0);
    expect(payButton()).toBeEnabled();
  });

  it('shows a processing state and then a success message for a single payment', async () => {
    const user = userEvent.setup();
    const pending = deferred<PaymentResult>();
    mockedSubmitPayment.mockReturnValueOnce(pending.promise);

    render(<CheckoutScreen />);
    await user.click(payButton());

    expect(screen.getByRole('button', { name: /processing payment/i })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent(/processing your payment/i);

    pending.resolve(SUCCESS_RESULT);

    expect(await screen.findByText('Payment successful')).toBeInTheDocument();
    expect(screen.getByText('NSP-TXN-0001')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /pay now/i })).not.toBeInTheDocument();
    expect(mockedSubmitPayment).toHaveBeenCalledWith({
      orderId: DEMO_ORDER.id,
      amountMinor: DEMO_ORDER.amountMinor,
      currency: DEMO_ORDER.currency,
    });
  });

  it('shows an error message when the payment fails and allows a retry', async () => {
    const user = userEvent.setup();
    mockedSubmitPayment
      .mockRejectedValueOnce(new PaymentDeclinedError(DECLINE_MESSAGE))
      .mockResolvedValueOnce(SUCCESS_RESULT);

    render(<CheckoutScreen />);
    await user.click(payButton());

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Payment failed');
    expect(alert).toHaveTextContent(DECLINE_MESSAGE);
    expect(payButton()).toBeEnabled();

    await user.click(payButton());

    expect(await screen.findByText('Payment successful')).toBeInTheDocument();
    expect(mockedSubmitPayment).toHaveBeenCalledTimes(2);
  });

  describe('duplicate submissions (regression)', () => {
    it('ignores repeated clicks while the payment is processing', async () => {
      const user = userEvent.setup();
      const pending = deferred<PaymentResult>();
      mockedSubmitPayment.mockReturnValueOnce(pending.promise);

      render(<CheckoutScreen />);
      const button = payButton();
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(mockedSubmitPayment).toHaveBeenCalledTimes(1);

      pending.resolve(SUCCESS_RESULT);
      expect(await screen.findByText('Payment successful')).toBeInTheDocument();
    });

    it('ignores clicks that arrive before React re-renders the disabled button', async () => {
      const pending = deferred<PaymentResult>();
      mockedSubmitPayment.mockReturnValueOnce(pending.promise);

      render(<CheckoutScreen />);
      const button = payButton();
      // One act() keeps React from re-rendering between the clicks, so the button is not
      // disabled yet and only the in-flight ref can stop the second and third click.
      act(() => {
        button.click();
        button.click();
        button.click();
      });

      expect(mockedSubmitPayment).toHaveBeenCalledTimes(1);

      pending.resolve(SUCCESS_RESULT);
      expect(await screen.findByText('Payment successful')).toBeInTheDocument();
    });
  });
});
