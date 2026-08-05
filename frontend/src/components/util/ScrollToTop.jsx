import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Opt out of the browser restoring scroll on refresh/back-forward so we can
// deterministically control it ourselves.
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

/**
 * Global scroll manager. On every route change (Navbar, footer, hero buttons,
 * cards, pagination, search, filters, back/forward, refresh) the new page
 * starts at the top. `useLayoutEffect` resets the position before paint so the
 * user never sees the previous scroll position flash.
 *
 * We intentionally jump instantly (not smooth) on navigation — a smooth
 * animated scroll on every route change feels janky. In-page anchor smoothness
 * is handled separately via CSS `scroll-behavior`.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    // `instant` overrides the global CSS smooth-scroll so route changes snap
    // to the top rather than animating up from the previous position.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
