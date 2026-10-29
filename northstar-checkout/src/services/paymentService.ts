/**
 * Simulated payment service.
 *
 * Everything here runs locally in the browser: there is no HTTP request, no
 * payment gateway and no real card data. A call simply waits for a configurable
 * delay and then resolves or rejects.
 *
 * Every call is numbered so duplicate submissions can be spotted:
 *   - each call logs `[paymentService] call #N ...` to the console;
 *   - `getInvocationCount()` returns the number of calls since the last reset
 *     (also available in the browser as `window.__paymentDebug`, dev only).
 */
import { formatMoney } from '@lib';
import type { PaymentRequest, PaymentResult, PaymentServiceConfig } from '@/types';

let config: PaymentServiceConfig = { delayMs: 1800, outcome: 'success' };
let invocationCount = 0;

/** Error thrown when the simulated processor declines a payment. */
export class PaymentDeclinedError extends Error {
  name = 'PaymentDeclinedError';
}

export const configurePaymentService = (overrides: Partial<PaymentServiceConfig>): void => {
  config = { ...config, ...overrides };
};

/** Reads optional overrides from a query string, e.g. `?outcome=failure&delay=3000`. */
export const parseServiceOverrides = (search: string): Partial<PaymentServiceConfig> => {
  const params = new URLSearchParams(search);
  const outcome = params.get('outcome');
  const delay = Number(params.get('delay'));

  return {
    ...(outcome === 'success' || outcome === 'failure' ? { outcome } : {}),
    ...(params.has('delay') && Number.isFinite(delay) && delay >= 0 ? { delayMs: delay } : {}),
  };
};

export const getPaymentServiceConfig =(): PaymentServiceConfig => ({ ...config });

export const getInvocationCount = (): number => invocationCount;

export const resetInvocationCount = (): void => {
  invocationCount = 0;
};

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const formatSequence = (n: number) => String(n).padStart(4, '0');

/**
 * Submits a simulated payment.
 * Resolves after `config.delayMs` with a synthetic transaction, or rejects with
 * a `PaymentDeclinedError` when `config.outcome` is `"failure"`.
 */
export const submitPayment = async (request: PaymentRequest): Promise<PaymentResult> => {
  invocationCount += 1;
  const callNumber = invocationCount;
  const requestId = `req_${formatSequence(callNumber)}`;
  const { delayMs, outcome } = config;

  console.log(`[paymentService] call #${callNumber} started`, {
    requestId,
    orderId: request.orderId,
    amount: formatMoney(request.amountMinor, request.currency),
    delayMs,
    outcome,
  });

  await wait(delayMs);

  if (outcome === 'failure') {
    console.log(`[paymentService] call #${callNumber} declined`, { requestId });
    throw new PaymentDeclinedError('The payment was declined by the simulated processor.');
  }

  const result: PaymentResult = {
    requestId,
    transactionId: `NSP-TXN-${formatSequence(callNumber)}`,
    amountMinor: request.amountMinor,
    currency: request.currency,
    processedAt: new Date().toISOString(),
  };

  console.log(`[paymentService] call #${callNumber} succeeded`, {
    requestId,
    transactionId: result.transactionId,
  });

  return result;
};
