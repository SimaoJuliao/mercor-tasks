import type { CurrencyCode } from '@/types';

// Format an amount in minor units (cents) as a localized currency string, e.g. 14990 -> "€149.90"
export const formatMoney = (amountMinor: number, currency: CurrencyCode): string =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format(amountMinor / 100);
