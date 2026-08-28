// Cloudflare Worker: serves the static site, routing haalandtracker.no
// requests to the /no/ folder (mirrors the host-based rewrite that
// vercel.json does for a Vercel deployment). Requires
// `assets.run_worker_first: true` in wrangler.jsonc so this runs before
// Cloudflare's default static-asset lookup.
const NO_HOST = 'haalandtracker.no';
const PASSTHROUGH_PREFIXES = ['/assets/', '/no/'];
const PASSTHROUGH_EXACT = ['/robots.txt', '/sitemap.xml'];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.hostname === NO_HOST) {
      const isPassthrough =
        PASSTHROUGH_PREFIXES.some((p) => url.pathname.startsWith(p)) ||
        PASSTHROUGH_EXACT.includes(url.pathname) ||
        url.pathname.startsWith('/favicon');

      if (!isPassthrough) {
        const rewritten = new URL(request.url);
        rewritten.pathname = '/no' + (url.pathname === '/' ? '/index.html' : url.pathname);
        return env.ASSETS.fetch(new Request(rewritten, request));
      }
    }

    return env.ASSETS.fetch(request);
  }
};
