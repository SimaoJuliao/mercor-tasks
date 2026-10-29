# Northstar Payments – checkout debugging exercise

A small, synthetic checkout page for the fictional company **Northstar Payments**, used to practise a
25-minute frontend debugging task: reproduce a bug, investigate it, fix it, add regression tests and
verify the fix in Google Chrome.

The starting code contains a known defect: **rapidly clicking "Pay now" while a payment is pending
can submit the same payment more than once.**

> **All payments are simulated.** The payment service is a local function that waits for a timer and
> then resolves or rejects. No network request is made, no payment provider is contacted and no real
> card, customer or account data exists anywhere in this project.

## Tech stack

- React 19 + TypeScript (strict)
- Vite 7
- Vitest 4, React Testing Library, `@testing-library/user-event`, `@testing-library/jest-dom`, jsdom
- npm

## Getting started

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open http://localhost:5173 in Google Chrome.

Other scripts:

| Command              | Purpose                                   |
| -------------------- | ----------------------------------------- |
| `npm test`           | Run the test suite once                   |
| `npm run test:watch` | Run tests in watch mode                   |
| `npm run typecheck`  | Type-check the app, tests and Vite config |
| `npm run build`      | Type-check and build for production       |
| `npm run preview`    | Serve the production build                |

## Simulating outcomes

The simulated service defaults to a **1800 ms** delay and a **successful** outcome. Override either via
the URL:

- `http://localhost:5173/?outcome=failure` – every call is declined
- `http://localhost:5173/?delay=3000` – 3 second artificial latency
- Both can be combined: `?outcome=failure&delay=3000`

## Observing payment service calls

Every call to the simulated service is numbered:

- The DevTools **Console** shows `[paymentService] call #N started` and `call #N succeeded` /
  `call #N declined` for each call (synthetic order id and amount only). These are plain
  `console.log` calls in `src/services/paymentService.ts`.
- In development mode, the console helper `__paymentDebug` is available:

  ```js
  __paymentDebug.getInvocationCount()   // calls since page load or last reset
  __paymentDebug.resetInvocationCount()
  __paymentDebug.getConfig()            // current delay/outcome
  ```

The **Network** tab should show only requests to `localhost` (Vite modules); there is no payment
traffic.

## Reproducing the bug

1. `npm run dev` and open http://localhost:5173 in Chrome.
2. Open DevTools (F12) → **Console**.
3. Optionally run `__paymentDebug.resetInvocationCount()`.
4. Click **Pay now** several times in quick succession while "Processing payment…" is shown.
5. Watch the console: one `call #N started` line appears per click, and
   `__paymentDebug.getInvocationCount()` returns more than `1`. The transaction reference shown on
   success also reflects the last of several calls (e.g. `NSP-TXN-0004`).

Expected behaviour: exactly one payment request per checkout attempt, however many times the button is
clicked while a payment is in progress.

## Where to look

| File                                                  | What it contains                                                                                           |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `src/screens/CheckoutScreen/CheckoutScreen.helper.ts` | `useCheckoutScreen` hook: payment state, service call and the click handler                                |
| `src/screens/CheckoutScreen/CheckoutScreen.tsx`       | Checkout screen: page layout (`Header`, `CheckoutIntro`, `OrderSummary`, `PaymentPanel`) wired to the hook |
| `src/components/PaymentPanel/PaymentPanel.tsx`        | Payment panel: card, pay button, result (props only, no service)                                           |
| `src/components/PayButton/PayButton.tsx`              | The "Pay now" button and its processing state                                                              |
| `src/services/paymentService.ts`                      | Simulated payment service, call counter, configuration, URL override parsing                               |
| `src/types/payment.ts`                                | Shared types (order, request, result, UI status)                                                           |
| `tests/CheckoutScreen.test.tsx`                       | Baseline screen tests (service is mocked)                                                                  |
| `src/main.tsx`                                        | Applies the URL overrides, sets the dev-only `__paymentDebug` helper                                       |

The baseline tests cover rendering, a single successful payment and a failed payment. There is
intentionally **no** test for repeated clicks yet.

## Project structure

```
src/
  screens/
    CheckoutScreen/
      CheckoutScreen.tsx       screen (JSX only): page layout + all sections
      CheckoutScreen.helper.ts useCheckoutScreen hook: state, service call, handlers
      CheckoutScreen.mock.ts   synthetic demo order (DEMO_ORDER)
      index.ts                 export * from './CheckoutScreen'
    index.ts
  components/
    Header/                    top bar with brand and "Synthetic demo" badge
    PaymentPanel/              payment panel: card, pay button, success/error, live region
    CheckoutIntro/             heading + synthetic-demo notice
    OrderSummary/              order details, line items, total
    CardPreview/               synthetic test card
    PayButton/                 "Pay now" / "Processing payment…" button
    PaymentSuccess/            success message
    PaymentError/              error alert
    PaymentStatusAnnouncer/    screen-reader live region
    index.ts
  hooks/index.ts               shared hooks (none yet)
  lib/utils.ts, index.ts       formatMoney
  services/paymentService.ts, index.ts
  types/payment.ts, index.ts
  App.tsx                      renders CheckoutScreen
  main.tsx                     entry point, URL overrides, debug helper
  styles.css
tests/
  setup.ts                     jest-dom matchers + RTL cleanup
  CheckoutScreen.test.tsx
vite.config.ts                 Vite + Vitest configuration, path aliases
```

### Conventions

- One folder per component: `Name.tsx` (view, JSX only), `Name.helper.ts` (default-exported
  `useName` hook with all state and logic), `index.ts` barrel. Purely presentational
  components have no state, so they have no hook file.
- Screens live in `src/screens` and own the logic and service calls; reusable components in
  `src/components` receive data and callbacks through props (`CheckoutScreen` calls the
  payment service, `PaymentPanel` only renders).
- Components are arrow functions typed with `React.FC`; all other functions are arrow functions too.
- Every shared folder has an `index.ts` barrel. Imports use path aliases (configured in
  `vite.config.ts` and `tsconfig.app.json`):

  ```ts
  import { CheckoutScreen } from '@screens';
  import { PaymentPanel } from '@components';
  import { formatMoney } from '@lib';
  import { submitPayment } from '@/services';
  import type { Order } from '@/types';
  import useCheckoutScreen from './CheckoutScreen.helper'; // local logic, always relative
  ```
