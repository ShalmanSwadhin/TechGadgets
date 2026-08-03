/**
 * Modular visitor-analytics adapter.
 *
 * The store does not currently track page visitors. This service defines a
 * stable interface so a real provider (Google Analytics 4, Plausible,
 * Umami, etc.) can be plugged in later without changing the dashboard UI.
 *
 * To integrate:
 *   1. Implement `fetchVisitorMetrics` to call your provider's reporting API.
 *   2. Return `{ available: true, metrics: { daily, weekly, monthly, unique, returning } }`.
 * Until then it reports `available: false` and the dashboard shows an
 * informative placeholder instead of fake numbers.
 */
export const visitorAnalytics = {
  provider: null,

  isConfigured() {
    return Boolean(this.provider);
  },

  async fetchVisitorMetrics() {
    if (!this.isConfigured()) {
      return { available: false, metrics: null };
    }
    // Placeholder for a real provider integration.
    return { available: false, metrics: null };
  },
};
