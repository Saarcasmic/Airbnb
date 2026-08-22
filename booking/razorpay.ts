/* Razorpay checkout.js, loaded on booking intent instead of on page load.

   The old page carried `<script defer src="checkout.razorpay.com/v1/checkout.js">`
   in every response, so all ~100% of visitors paid for a script that only the
   small fraction who actually reach payment ever use. Here it is fetched the
   first time a guest shows intent (opening the calendar), which is at least two
   taps before the money step — so it is warm by the time Reserve is pressed, but
   never on the critical path for someone who is only reading the page.

   ensureRazorpay() is idempotent and safe to call from anywhere: concurrent
   callers share one <script> tag and one promise. */

const SRC = 'https://checkout.razorpay.com/v1/checkout.js';

export type RazorpayOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  theme: { color: string };
  notes: Record<string, string>;
  handler: (response: RazorpayHandlerResponse) => void;
  modal: { ondismiss: () => void };
};

export type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type RazorpayFailure = {
  error?: { code?: string; description?: string };
};

export type RazorpayInstance = {
  open: () => void;
  on: (event: 'payment.failed', cb: (resp: RazorpayFailure) => void) => void;
};

type RazorpayCtor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayCtor;
  }
}

let pending: Promise<RazorpayCtor | null> | null = null;

/** Resolves with the Razorpay constructor, or null when the script can't load
    (blocked by an extension, offline, third-party cookies walled off). Callers
    must handle null — the guest still gets the WhatsApp fallback. */
export function ensureRazorpay(): Promise<RazorpayCtor | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (pending) return pending;

  pending = new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SRC}"]`);
    const script = existing ?? document.createElement('script');

    const done = () => resolve(window.Razorpay ?? null);
    // A failed load must not poison the cache: clearing `pending` lets the next
    // Reserve tap retry rather than failing forever on a transient blip.
    const failed = () => { pending = null; resolve(null); };

    script.addEventListener('load', done, { once: true });
    script.addEventListener('error', failed, { once: true });

    if (!existing) {
      script.src = SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return pending;
}

/** Opens a connection to Razorpay's origin early, so the eventual script fetch
    skips DNS + TLS. Cheap enough to fire on first interaction. */
export function preconnectRazorpay(): void {
  if (typeof document === 'undefined') return;
  if (document.querySelector('link[data-rzp-preconnect]')) return;
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = 'https://checkout.razorpay.com';
  link.crossOrigin = 'anonymous';
  link.setAttribute('data-rzp-preconnect', '');
  document.head.appendChild(link);
}
