import axios from 'axios';

const TOKEN_KEY = 'techgadgets_token';

// Bounded, backoff-based retry. This never loops forever and only ever
// replays requests that are safe to repeat (see isReplaySafe).
const MAX_RETRIES = 4;
const RETRY_DELAYS_MS = [300, 700, 1500, 3000];

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A "transient" failure means the request never received a real application
 * response: a network error, a reset/refused connection, a request timeout,
 * or a gateway/unavailable status produced while the backend is restarting or
 * not yet ready. These are the only errors we consider safe to retry.
 */
function isTransient(error) {
  if (error.code === 'ECONNABORTED') return true; // client-side timeout
  if (!error.response) return true; // ECONNRESET / ECONNREFUSED / network down
  return [502, 503, 504].includes(error.response.status);
}

/**
 * Only replay requests that cannot cause unintended side effects when repeated:
 * idempotent HTTP methods, or requests explicitly flagged idempotent. Order
 * creation opts in via `_idempotent` because it carries a clientRequestId that
 * the server de-duplicates, so a replay returns the original order.
 */
function isReplaySafe(config = {}) {
  if (config._idempotent) return true;
  const method = (config.method || 'get').toLowerCase();
  return ['get', 'head', 'options'].includes(method);
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};
    const transient = isTransient(error);

    if (transient && !config._skipRetry && isReplaySafe(config)) {
      config._retryCount = (config._retryCount || 0) + 1;
      if (config._retryCount <= MAX_RETRIES) {
        await sleep(RETRY_DELAYS_MS[config._retryCount - 1] ?? 3000);
        return api(config);
      }
    }

    // Build a clean, user-facing error. Only genuine unavailability gets the
    // "server is starting" message — real application errors keep their own.
    const message = transient
      ? 'We couldn’t reach the server. It may be starting up — please try again in a moment.'
      : error.response?.data?.message || error.message || 'Something went wrong';

    const wrapped = new Error(message);
    wrapped.status = error.response?.status;
    wrapped.code = error.code;
    wrapped.isBackendUnavailable = transient;
    wrapped.original = error;
    return Promise.reject(wrapped);
  }
);

/**
 * Wait (with a bounded budget) until the backend reports it is ready to serve
 * critical requests. Used to gate order submission so we never fire a write at
 * a backend that is still starting or mid-restart. Returns true once ready,
 * false if the budget elapses first. No endless polling.
 */
export async function waitForBackendReady({ timeoutMs = 15000, signal } = {}) {
  const start = Date.now();
  let attempt = 0;
  while (Date.now() - start < timeoutMs) {
    if (signal?.aborted) return false;
    try {
      const { data } = await api.get('/health/ready', {
        _skipRetry: true,
        timeout: 4000,
      });
      if (data?.ready) return true;
    } catch {
      // Backend not up yet (restart gap / DB connecting). Keep trying within
      // the time budget with a gentle backoff.
    }
    attempt += 1;
    await sleep(Math.min(1500, 250 * attempt));
  }
  return false;
}

export default api;
