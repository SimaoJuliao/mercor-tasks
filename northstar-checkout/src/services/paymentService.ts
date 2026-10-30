/**
 * Client for the simulated payment API.
 *
 * `submitPayment` sends `POST /api/payments` to the local mock API served by Vite
 * (`mock-api/paymentsApi.ts`), so each call shows up in the DevTools Network tab.
 * There is no payment gateway and no real card data: the mock waits for the
 * configured delay and then approves or declines the payment.
 *
 * Every call is numbered so duplicate submissions can be spotted:
 *   - each call logs `[paymentService] call #N ...` to the console;
 *   - `getInvocationCount()` returns the number of calls since the last reset
 *     (also available in the browser as `window.__paymentDebug`, dev only).
 */
import { PAYMENTS_ENDPOINT, formatMoney, formatSequence } from '@lib';
import type {
  PaymentApiError,
  PaymentApiSuccess,
  PaymentRequest,
  PaymentResult,
  PaymentServiceConfig,
} from '@/types';

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

export const getPaymentServiceConfig = (): PaymentServiceConfig => ({ ...config });

export const getInvocationCount = (): number => invocationCount;

export const resetInvocationCount = (): void => {
  invocationCount = 0;
};

/**
 * Submits a payment to the local mock API, forwarding `config.delayMs` and
 * `config.outcome` so the mock knows how long to wait and whether to approve.
 * Rejects with a `PaymentDeclinedError` when the mock declines (`402`).
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

  const query = new URLSearchParams({ delay: String(delayMs), outcome });
  const response = await fetch(`${PAYMENTS_ENDPOINT}?${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Request-Id': requestId },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const { message } = (await response.json()) as PaymentApiError;
    console.log(`[paymentService] call #${callNumber} declined`, {
      requestId,
      status: response.status,
    });
    throw response.status === 402 ? new PaymentDeclinedError(message) : new Error(message);
  }

  const { transactionId, processedAt } = (await response.json()) as PaymentApiSuccess;
  const result: PaymentResult = {
    requestId,
    transactionId,
    amountMinor: request.amountMinor,
    currency: request.currency,
    processedAt,
  };

  console.log(`[paymentService] call #${callNumber} succeeded`, { requestId, transactionId });

  return result;
};
