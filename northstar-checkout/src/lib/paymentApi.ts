// Shared by the browser client (src/services) and the local mock API (mock-api/).
// The mock is type-checked for Node, so keep this file free of path aliases and DOM APIs.

export const PAYMENTS_ENDPOINT = '/api/payments';

export const DECLINE_MESSAGE = 'The payment was declined by the simulated processor.';

// Pad a call or transaction number for display, e.g. 3 -> "0003"
export const formatSequence = (n: number): string => String(n).padStart(4, '0');
