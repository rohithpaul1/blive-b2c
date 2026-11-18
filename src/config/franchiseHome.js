// Which franchise this storefront is serving. One build serves every franchise:
//   1. ?franchise=<slug> in the URL (kept for the browser session) - for demos
//   2. VITE_FRANCHISE at build time - one Vercel project per franchise
//   3. the hostname (e.g. any host containing "indore")
//   4. Jaipur, the default
// Per-franchise content lives in ./franchises/<slug>.js.
import { jaipur } from "./franchises/jaipur";
import { indore } from "./franchises/indore";

export const franchises = { jaipur, indore };
export const DEFAULT_FRANCHISE = "jaipur";

const readSession = (key) => {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
};
const writeSession = (key, value) => {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    /* storage can be blocked; the URL param still works for this page */
  }
};

const resolveSlug = () => {
  if (typeof window === "undefined") return import.meta.env.VITE_FRANCHISE || DEFAULT_FRANCHISE;
  const fromUrl = new URLSearchParams(window.location.search).get("franchise");
  if (fromUrl && franchises[fromUrl]) {
    writeSession("franchise", fromUrl);
    return fromUrl;
  }
  const fromSession = readSession("franchise");
  if (fromSession && franchises[fromSession]) return fromSession;
  const fromEnv = import.meta.env.VITE_FRANCHISE;
  if (fromEnv && franchises[fromEnv]) return fromEnv;
  const host = window.location.hostname.toLowerCase();
  const byHost = Object.values(franchises).find((f) => f.domains.some((d) => host.includes(d)));
  return byHost?.slug ?? DEFAULT_FRANCHISE;
};

export const franchiseSlug = resolveSlug();
export const franchiseHome = franchises[franchiseSlug];
