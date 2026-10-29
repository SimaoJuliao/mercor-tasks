import type { Order } from '@/types';

/** Synthetic order. None of these details belong to a real person or account. */
export const DEMO_ORDER: Order = {
  id: 'ORD-2026-10482',
  customerName: 'Alex Rivera',
  customerEmail: 'alex.rivera@example.com',
  lineItems: [
    { label: 'Team plan · 5 seats · monthly', amountMinor: 12388 },
    { label: 'VAT (21%)', amountMinor: 2602 },
  ],
  amountMinor: 14990,
  currency: 'EUR',
};
