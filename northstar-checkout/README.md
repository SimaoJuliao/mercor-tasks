# Northstar Payments – checkout debugging exercise

A small, synthetic checkout page for the fictional company **Northstar Payments**, used to practise a
25-minute frontend debugging task: reproduce a bug, investigate it, fix it, add regression tests and
verify the fix in Google Chrome.

The starting code contains a known defect: **rapidly clicking "Pay now" while a payment is pending
can submit the same payment more than once.**

> **All payments are simulated.** The app sends `POST /api/payments` to a local mock API that runs
> inside the Vite dev and preview servers (`mock-api/paymentsApi.ts`). It waits for a timer and then approves or
> declines. No payment provider is contacted and no real card, customer or account data exists
> anywhere in this project.

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

The simulated payment API defaults to a **1800 ms** delay and a **successful** outcome. Override either
via the page URL (the app forwards both values to the mock API as query parameters):

- `http://localhost:5173/?outcome=failure` – every call is declined
- `http://localhost:5173/?delay=3000` – 3 second artificial latency
- Both can be combined: `?outcome=failure&delay=3000`

## Observing payment requests

Every payment request is visible in four places:

- The DevTools **Network** tab shows one `POST /api/payments` request per call (filter by
  `api/payments` or Fetch/XHR). Each request is pending for the configured delay; the
  `X-Request-Id` header (`req_0001`, `req_0002`, …) identifies the call, and the response holds the
  transaction id (`200`) or the decline message (`402`).
- The terminal running `npm run dev` logs `[mock-api] payment #N received` and
  `payment #N captured` / `payment #N declined` for every request the mock API receives. Its counter
  (and the `NSP-TXN-…` transaction ids) only resets when the dev server restarts.
- The DevTools **Console** shows `[paymentService] call #N started` and `call #N succeeded` /
  `call #N declined` for each call (synthetic order id and amount only). These are plain
  `console.log` calls in `src/services/paymentService.ts`.
- In development mode, the console helper `__paymentDebug` is available:

  ```js
  __paymentDebug.getInvocationCount()   // calls since page load or last reset
  __paymentDebug.resetInvocationCount()
  __paymentDebug.getConfig()            // current delay/outcome
  ```

## Reproducing the bug

1. `npm run dev` and open http://localhost:5173 in Chrome.
2. Open DevTools (F12): **Network** tab (filter `api/payments`) and **Console**.
3. Optionally run `__paymentDebug.resetInvocationCount()`.
4. Click **Pay now** several times in quick succession while "Processing payment…" is shown.
5. Watch the Network tab: one `POST /api/payments` request appears per click, all pending at the
   same time. The console shows one `call #N started` line per click and
   `__paymentDebug.getInvocationCount()` returns more than `1`. Each request creates its own
   transaction (`NSP-TXN-…`), so the same order is charged several times.

Expected behaviour: exactly one payment request per checkout attempt, however many times the button is
clicked while a payment is in progress.

## Where to look

| File                                                  | What it contains                                                                                           |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `src/screens/CheckoutScreen/CheckoutScreen.helper.ts` | `useCheckoutScreen` hook: payment state, service call and the click handler                                |
| `src/screens/CheckoutScreen/CheckoutScreen.tsx`       | Checkout screen: page layout (`Header`, `CheckoutIntro`, `OrderSummary`, `PaymentPanel`) wired to the hook |
| `src/components/PaymentPanel/PaymentPanel.tsx`        | Payment panel: card, pay button, result (props only, no service)                                           |
| `src/components/PayButton/PayButton.tsx`              | The "Pay now" button and its processing state                                                              |
| `src/services/paymentService.ts`                      | Payment API client (`fetch`), call counter, configuration, URL override parsing                            |
| `mock-api/paymentsApi.ts`                             | Local mock of `POST /api/payments` (delay, approve/decline)                                                |
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
  lib/utils.ts                 formatMoney
  lib/paymentApi.ts            endpoint, decline message, formatSequence (shared with mock-api)
  lib/index.ts
  services/paymentService.ts, index.ts
  types/payment.ts, index.ts
  App.tsx                      renders CheckoutScreen
  main.tsx                     entry point, URL overrides, debug helper
  styles.css
tests/
  setup.ts                     jest-dom matchers + RTL cleanup
  CheckoutScreen.test.tsx
mock-api/paymentsApi.ts        local POST /api/payments mock (Vite dev + preview server)
vite.config.ts                 Vite + Vitest configuration, path aliases, mock API plugin
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
