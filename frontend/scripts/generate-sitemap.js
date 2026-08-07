// Runs after `vite build` (see package.json) to emit dist/sitemap.xml.
// Always writes the static routes; product URLs are added on a best-effort
// basis by fetching the live API — if that fails (API down at build time,
// no SITEMAP_API_URL configured, network hiccup on the build runner) the
// build must NOT fail because of it, so every failure path here just logs
// and falls back to the static-only sitemap.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');

// The public origin these URLs should resolve to, e.g. https://techgadgets.com
// Set SITE_URL as a build-time env var once the production domain is known.
const siteUrl = (process.env.SITE_URL || '').replace(/\/+$/, '');
// Where to fetch products from at build time, e.g. https://api.techgadgets.onrender.com/api
const apiUrl = process.env.SITEMAP_API_URL || process.env.VITE_API_URL;

if (!siteUrl) {
  console.warn(
    '[sitemap] SITE_URL is not set — writing sitemap.xml with relative-looking placeholder URLs. ' +
      'Set SITE_URL to your production domain (e.g. https://techgadgets.com) for a correct sitemap.'
  );
}

const origin = siteUrl || 'https://example.com';

const staticRoutes = ['/', '/products', '/login', '/register'];

async function fetchProductUrls() {
  if (!apiUrl || apiUrl.startsWith('/')) {
    console.warn('[sitemap] No absolute SITEMAP_API_URL/VITE_API_URL configured — skipping product URLs.');
    return [];
  }
  const base = apiUrl.replace(/\/+$/, '');
  const urls = [];
  const pageLimit = 100; // sitemap is capped at a few pages of products; fine for this store's catalog size
  try {
    for (let page = 1; page <= 5; page += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      // eslint-disable-next-line no-await-in-loop
      const res = await fetch(`${base}/products?page=${page}&limit=${pageLimit}`, {
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // eslint-disable-next-line no-await-in-loop
      const data = await res.json();
      (data.products || []).forEach((p) => urls.push(`/products/${p._id}`));
      if (!data.products?.length || page >= (data.pages || 1)) break;
    }
  } catch (err) {
    console.warn(`[sitemap] Could not fetch products for the sitemap (${err.message}) — continuing with static routes only.`);
    return [];
  }
  return urls;
}

function buildXml(urls) {
  const entries = urls
    .map((u) => `  <url><loc>${origin}${u}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

const productUrls = await fetchProductUrls();
const xml = buildXml([...staticRoutes, ...productUrls]);

fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), xml);
console.log(`[sitemap] Wrote sitemap.xml with ${staticRoutes.length + productUrls.length} URLs (${productUrls.length} products).`);
