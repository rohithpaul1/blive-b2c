/**
 * Centralised runtime configuration.
 *
 * Every value here is injected by Vite at BUILD time from environment
 * variables, so they must be set in the hosting provider's dashboard
 * (Vercel / Netlify / Amplify) before the production build runs.
 *
 * IMPORTANT: anything prefixed `VITE_` is embedded in the public JS bundle
 * and is readable by anyone. Only ever put publishable values here.
 * Never put a Razorpay key_secret, a DB URL, or a private API token in a
 * VITE_ variable.
 *
 * There is deliberately NO hardcoded production fallback. vite.config.js
 * fails the build if VITE_BACKEND_URL is missing in production, so a
 * misconfigured deploy stops at CI instead of quietly shipping a storefront
 * wired to the dev backend.
 */

/** Base URL for all backend API calls, including the /b2c/api prefix. */
export const API_BASE_URL = (
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:4015/b2c/api'
).replace(/\/+$/, '');

/**
 * Razorpay publishable key id (key_id, NOT key_secret).
 * The backend also returns this on the handle-payment response; that value
 * takes precedence at the call site, and this is the fallback.
 */
export const RAZORPAY_KEY_ID = (import.meta.env.VITE_RAZORPAY_KEY_ID || '').trim();

/** True when this bundle was produced by `vite build`. */
export const IS_PRODUCTION = import.meta.env.PROD;

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

/**
 * Payment simulation.
 *
 * ON BY DEFAULT for now — the real Razorpay checkout is skipped and payments
 * are simulated as successful (the booking is still created through the normal
 * handle-payment / verify-payment calls). This removes the Razorpay dependency
 * from the flow entirely while we're pre-launch.
 *
 * To turn the REAL Razorpay integration back on later, set
 *   VITE_SIMULATE_PAYMENT=false
 * and provide a real VITE_RAZORPAY_KEY_ID.
 */
export const SIMULATE_PAYMENT = import.meta.env.VITE_SIMULATE_PAYMENT !== 'false';

if (IS_PRODUCTION && !RAZORPAY_KEY_ID && !USE_MOCKS && !SIMULATE_PAYMENT) {
  // console.error survives the production build on purpose (see vite.config.js).
  console.error(
    '[BLive config] VITE_RAZORPAY_KEY_ID is not set. Checkout will only work ' +
      'if the backend returns razorpayKey on the handle-payment response.'
  );
}
