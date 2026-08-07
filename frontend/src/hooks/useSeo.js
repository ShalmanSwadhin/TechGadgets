import { useEffect } from 'react';

/**
 * Sets this page's <title> and description/OG/Twitter meta tags for as long
 * as it's mounted, restoring the previous values on unmount. index.html only
 * has one static title/description for the whole SPA, which is wrong for
 * search snippets and link previews (e.g. sharing a specific product on
 * WhatsApp/Facebook shows the homepage's title, not the product's).
 *
 * This only helps crawlers that execute JS (Google does; many social-card
 * scrapers don't) — full coverage would need SSR/prerendering, which is a
 * bigger architectural change than a per-page meta tag fix.
 */
export function useSeo({ title, description } = {}) {
  useEffect(() => {
    if (!title && !description) return undefined;

    const descEl = document.head.querySelector('meta[name="description"]');
    const ogTitleEl = document.head.querySelector('meta[property="og:title"]');
    const ogDescEl = document.head.querySelector('meta[property="og:description"]');
    const twTitleEl = document.head.querySelector('meta[name="twitter:title"]');

    const prev = {
      title: document.title,
      desc: descEl?.getAttribute('content'),
      ogTitle: ogTitleEl?.getAttribute('content'),
      ogDesc: ogDescEl?.getAttribute('content'),
      twTitle: twTitleEl?.getAttribute('content'),
    };

    if (title) {
      document.title = title;
      ogTitleEl?.setAttribute('content', title);
      twTitleEl?.setAttribute('content', title);
    }
    if (description) {
      descEl?.setAttribute('content', description);
      ogDescEl?.setAttribute('content', description);
    }

    return () => {
      document.title = prev.title;
      if (prev.desc != null) descEl?.setAttribute('content', prev.desc);
      if (prev.ogTitle != null) ogTitleEl?.setAttribute('content', prev.ogTitle);
      if (prev.ogDesc != null) ogDescEl?.setAttribute('content', prev.ogDesc);
      if (prev.twTitle != null) twTitleEl?.setAttribute('content', prev.twTitle);
    };
  }, [title, description]);
}
