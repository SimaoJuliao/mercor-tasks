/// <reference types="vite/client" />

interface Window {
  /** Dev-only helper for inspecting the simulated payment service. */
  __paymentDebug?: {
    getInvocationCount: typeof import('@/services').getInvocationCount;
    resetInvocationCount: typeof import('@/services').resetInvocationCount;
    getConfig: typeof import('@/services').getPaymentServiceConfig;
  };
}
