import type React from 'react';
import { CheckoutIntro, Header, OrderSummary, PaymentPanel } from '@components';
import useCheckoutScreen from './CheckoutScreen.helper';

export const CheckoutScreen: React.FC = () => {
  const { order, status, isLoading, total, handlePay } = useCheckoutScreen();

  return (
    <>
      <Header />

      <main className="app__main">
        <section aria-labelledby="checkout-heading">
          <CheckoutIntro />

          <div className="checkout__grid">
            <OrderSummary order={order} />

            <PaymentPanel
              total={total}
              status={status}
              isLoading={isLoading}
              onPay={handlePay}
            />
          </div>
        </section>
      </main>
    </>
  );
};
