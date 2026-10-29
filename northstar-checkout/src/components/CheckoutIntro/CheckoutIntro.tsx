import type React from 'react';

export const CheckoutIntro: React.FC = () => (
  <header className="checkout__intro">
    <h1 id="checkout-heading">Payment checkout</h1>
    <p className="checkout__lead">
      This is a synthetic payment demonstration. No real card is charged and no payment data
      leaves your browser.
    </p>
  </header>
);
