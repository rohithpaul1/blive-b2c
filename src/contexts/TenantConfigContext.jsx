import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getTenantId, setTenantInStorage } from '../lib/tenant';
import { MASTER_SERVICE_URL } from '../config/env';

// Real endpoint (confirmed against the dev master service):
//   GET {MASTER_SERVICE_URL}/masterService/api/tenant/resolve/by-website-domain?domain=<hostname>
// Response is FLAT — no `data`/`branding` wrapper:
//   { tenantId, tenantName, tenantCode, websiteDomain, logoUrl, homeScreenUrl }
const RESOLVE_PATH = '/masterService/api/tenant/resolve/by-website-domain';

/**
 * Default branding — exactly what BLive B2C looks like today. Any field a
 * tenant's config omits (or every field, when no tenant config is available
 * at all — no VITE_MASTER_SERVICE_URL configured, the service is down, the
 * domain isn't mapped — confirmed the real service 404s cleanly on an
 * unmapped domain rather than erroring) falls back to these, so the current
 * single-tenant deployment renders identically to before per-tenant
 * branding existed.
 *
 * heroVideoUrl has NO equivalent in the real response — the master service
 * returns `homeScreenUrl`, which is an IMAGE, not a video (Hero.jsx renders
 * a <video>). That field is captured below as `homeScreenUrl` but is
 * deliberately NOT wired into Hero.jsx — swapping a <video> for that image
 * per tenant is a UI decision someone needs to make explicitly, not a
 * silent fallback. Until then every tenant gets BLive's default hero video.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const DEFAULT_BRANDING = {
  logoUrl: '/images/BliveLogo.svg',
  heroVideoUrl: 'https://ezy-prod.s3.ap-south-1.amazonaws.com/Blive-B2C.mp4',
  appTitle: 'BLive B2C',
  homeScreenUrl: null,
};

// The resolve call fires on every full page load (see the effect below) —
// deliberately, so an operator's branding change shows up on the very next
// refresh rather than waiting out a cache. sessionStorage here is NOT a
// skip-the-fetch cache; it only seeds the initial render with last-known-good
// branding so a refresh doesn't flash back to BLive's default logo for the
// ~100-200ms the fresh call is in flight — it gets overwritten as soon as
// that call resolves, every single time.
const BRANDING_SESSION_KEY = 'tenant_branding';

const readCachedBranding = () => {
  try {
    const raw = sessionStorage.getItem(BRANDING_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const cacheBranding = (branding) => {
  try {
    sessionStorage.setItem(BRANDING_SESSION_KEY, JSON.stringify(branding));
  } catch {
    // sessionStorage unavailable — branding is just re-fetched next tab/session.
  }
};

const TenantConfigContext = createContext({
  tenantId: null,
  branding: DEFAULT_BRANDING,
  loading: false,
});

/**
 * Resolves tenant identity + branding on EVERY full page load (mount) and
 * exposes both via context. There's no Next-style middleware in this SPA,
 * so this provider — mounted once near the app root, see main.jsx — is the
 * earliest point either is available.
 *
 * Deliberately not cached-to-skip: a client-side route change (/home →
 * /search) never remounts this provider, so it still only fires once per
 * visit either way — but an actual browser refresh does remount it, and
 * that's intentional here, so branding stays live rather than sticking to
 * whatever a tab first saw. Trade-off: on a service with heavy traffic this
 * means one extra request to the master service per page load, for every
 * user — accepted as worth it for always-current branding.
 *
 * Never blocks rendering: components render with last-known (or default)
 * branding immediately and swap in the freshly resolved branding once it
 * arrives (or keep what they had, if resolution fails — a silent fallback,
 * not a broken app).
 */
export const TenantConfigProvider = ({ children }) => {
  const hasResolved = useRef(false);
  const [tenantId, setTenantId] = useState(() => getTenantId());
  const [branding, setBranding] = useState(() => readCachedBranding() || DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Guards only against React StrictMode's double-invoked effect in dev —
    // NOT against re-fetching on a real refresh (this file mounts fresh on
    // every full page load, so the guard resets then too).
    if (hasResolved.current) return;
    hasResolved.current = true;

    if (!MASTER_SERVICE_URL) {
      console.warn('[tenant] VITE_MASTER_SERVICE_URL is not set — using default branding.');
      setLoading(false);
      return;
    }

    const resolve = async () => {
      try {
        const url = `${MASTER_SERVICE_URL}${RESOLVE_PATH}?domain=${encodeURIComponent(window.location.hostname)}`;
        const response = await fetch(url);
        if (!response.ok) {
          // A 404 here is the expected shape for "this domain has no tenant"
          // (confirmed against the real service) — not an error worth more
          // than a warning; defaults stay in place either way.
          throw new Error(`Tenant resolve failed with status ${response.status}`);
        }
        const payload = await response.json();
        const { tenantId: resolvedId, tenantName, logoUrl, homeScreenUrl } = payload || {};

        if (resolvedId) {
          setTenantInStorage(resolvedId);
          setTenantId(resolvedId);
        } else {
          console.warn('[tenant] resolve-by-website-domain response had no tenantId:', payload);
        }

        const merged = {
          ...DEFAULT_BRANDING,
          ...(logoUrl && { logoUrl }),
          ...(tenantName && { appTitle: tenantName }),
          ...(homeScreenUrl && { homeScreenUrl }),
        };
        cacheBranding(merged);
        setBranding(merged);
      } catch (error) {
        console.warn('[tenant] failed to resolve tenant/branding by domain:', error);
      } finally {
        setLoading(false);
      }
    };

    resolve();
  }, []);

  // Single place that applies the tab title for the resolved tenant.
  useEffect(() => {
    if (branding.appTitle) document.title = branding.appTitle;
  }, [branding.appTitle]);

  return (
    <TenantConfigContext.Provider value={{ tenantId, branding, loading }}>
      {children}
    </TenantConfigContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTenantConfig = () => useContext(TenantConfigContext);
