/**
 * Local mock of the Northstar payments API, served by the Vite dev and preview servers.
 *
 * `POST /api/payments?delay=<ms>&outcome=<success|failure>` waits for `delay`
 * milliseconds and then answers `200` with a synthetic transaction or `402` with a
 * decline. The browser client always sends both parameters (see `src/services`).
 * Nothing leaves the machine: there is no payment provider behind it.
 * Each request is logged in the terminal as `[mock-api] payment #N ...`.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Connect, Plugin } from 'vite';
import { DECLINE_MESSAGE, PAYMENTS_ENDPOINT, formatSequence } from '../src/lib/paymentApi';
import type { PaymentApiError, PaymentApiSuccess, PaymentRequest } from '../src/types/payment';

let paymentCount = 0;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const readJson = (req: IncomingMessage) =>
  new Promise<unknown>((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });

const sendJson = (res: ServerResponse, statusCode: number, body: PaymentApiSuccess | PaymentApiError) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

const handlePayment: Connect.NextHandleFunction = async (req, res, next) => {
  if (req.method !== 'POST') {
    next();
    return;
  }

  let payment: PaymentRequest;
  try {
    payment = (await readJson(req)) as PaymentRequest;
  } catch {
    sendJson(res, 400, { message: 'The request body is not valid JSON.' });
    return;
  }

  // `req.url` is relative to the mount point, e.g. "/?delay=1800&outcome=success".
  const params = new URL(req.url ?? '/', 'http://localhost').searchParams;
  const delayMs = Number(params.get('delay'));
  const outcome = params.get('outcome');

  paymentCount += 1;
  const paymentNumber = paymentCount;
  console.log(`[mock-api] payment #${paymentNumber} received`, {
    requestId: req.headers['x-request-id'],
    orderId: payment.orderId,
    delayMs,
    outcome,
  });

  await wait(delayMs);

  if (outcome === 'failure') {
    console.log(`[mock-api] payment #${paymentNumber} declined`);
    sendJson(res, 402, { message: DECLINE_MESSAGE });
    return;
  }

  const transactionId = `NSP-TXN-${formatSequence(paymentNumber)}`;
  console.log(`[mock-api] payment #${paymentNumber} captured`, { transactionId });
  sendJson(res, 200, { transactionId, processedAt: new Date().toISOString() });
};

export const mockPaymentsApi = (): Plugin => ({
  name: 'northstar-mock-payments-api',
  configureServer: (server) => {
    server.middlewares.use(PAYMENTS_ENDPOINT, handlePayment);
  },
  configurePreviewServer: (server) => {
    server.middlewares.use(PAYMENTS_ENDPOINT, handlePayment);
  },
});
