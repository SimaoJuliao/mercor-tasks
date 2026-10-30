/** ISO 4217 currency code. The demo only uses EUR. */
export type CurrencyCode = 'EUR';

export interface OrderLineItem {
  label: string;
  /** Amount in minor units (cents). */
  amountMinor: number;
}

/** A synthetic order shown on the checkout page. */
export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  lineItems: OrderLineItem[];
  /** Total amount due, in minor units (cents). */
  amountMinor: number;
  currency: CurrencyCode;
}

/** Payload sent to the simulated payment service. */
export interface PaymentRequest {
  orderId: string;
  amountMinor: number;
  currency: CurrencyCode;
}

/** Result of a successful `submitPayment` call. */
export interface PaymentResult {
  /** Sequential id of the service call that produced this result, e.g. "req_0003". */
  requestId: string;
  transactionId: string;
  amountMinor: number;
  currency: CurrencyCode;
  processedAt: string;
}

/** Body of a `200` response from `POST /api/payments`. */
export interface PaymentApiSuccess {
  transactionId: string;
  processedAt: string;
}

/** Body of an error response from `POST /api/payments` (`402` decline or `400`). */
export interface PaymentApiError {
  message: string;
}

export type SimulatedOutcome = 'success' | 'failure';

export interface PaymentServiceConfig {
  /** Artificial network latency in milliseconds. */
  delayMs: number;
  /** Whether simulated calls resolve or reject. */
  outcome: SimulatedOutcome;
}

/** UI state of the checkout. */
export type CheckoutStatus =
  | { kind: 'idle' }
  | { kind: 'processing' }
  | { kind: 'success'; result: PaymentResult }
  | { kind: 'error'; message: string };
