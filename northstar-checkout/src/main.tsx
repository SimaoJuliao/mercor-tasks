import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import {
  configurePaymentService,
  getInvocationCount,
  getPaymentServiceConfig,
  parseServiceOverrides,
  resetInvocationCount,
} from '@/services';
import './styles.css';

// Optional URL overrides for the simulated service, e.g. `/?outcome=failure&delay=3000`.
configurePaymentService(parseServiceOverrides(window.location.search));

// Local debugging helper: run `__paymentDebug.getInvocationCount()` in the DevTools console.
if (import.meta.env.DEV) {
  window.__paymentDebug = {
    getInvocationCount,
    resetInvocationCount,
    getConfig: getPaymentServiceConfig,
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
