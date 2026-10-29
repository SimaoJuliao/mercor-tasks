import type React from 'react';
import { formatMoney } from '@lib';
import type { Order } from '@/types';

interface OrderSummaryProps {
  order: Order;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({ order }) => (
  <section className="panel" aria-labelledby="summary-heading">
    <h2 id="summary-heading" className="panel__title">
      Order summary
    </h2>

    <dl className="details">
      <div className="details__row">
        <dt>Order</dt>
        <dd>{order.id}</dd>
      </div>
      <div className="details__row">
        <dt>Billed to</dt>
        <dd>
          {order.customerName}
          <span className="muted">{order.customerEmail}</span>
        </dd>
      </div>
    </dl>

    <ul className="line-items" aria-label="Line items">
      {order.lineItems.map((item) => (
        <li key={item.label} className="line-items__row">
          <span>{item.label}</span>
          <span>{formatMoney(item.amountMinor, order.currency)}</span>
        </li>
      ))}
    </ul>

    <div className="total">
      <span>Total due</span>
      <strong className="total__amount">{formatMoney(order.amountMinor, order.currency)}</strong>
    </div>
  </section>
);
