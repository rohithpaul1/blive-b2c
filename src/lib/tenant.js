/**
 * Tenant identity storage.
 *
 * The resolved tenant id is written to BOTH localStorage (read by client JS —
 * the axios request interceptor in src/caller/axiosConfig.js) and a
 * `tenant_id` cookie (path=/, 1yr, SameSite=Lax) so a future server-rendered
 * or BFF layer can read the same value without round-tripping through JS.
 *
 * There is deliberately NO hardcoded fallback tenant id. getTenantId()
 * returns null when nothing is stored yet; callers (the request interceptor,
 * TenantResolve) must handle that explicitly instead of silently defaulting.
 */

const TENANT_STORAGE_KEY = 'tenant_id';
const TENANT_COOKIE_NAME = 'tenant_id';
const TENANT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

const setCookie = (name, value, maxAgeSeconds) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
};

const clearCookie = (name) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
};

const readCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

/** Reads the current tenant id — localStorage first, falling back to the cookie. */
export const getTenantId = () => {
  try {
    const fromStorage = localStorage.getItem(TENANT_STORAGE_KEY);
    if (fromStorage) return fromStorage;
  } catch {
    // localStorage unavailable (private mode, etc.) — fall through to the cookie.
  }
  return readCookie(TENANT_COOKIE_NAME);
};

/** Persists the resolved tenant id to both localStorage and the cookie. */
export const setTenantInStorage = (tenantId) => {
  if (!tenantId) return;
  try {
    localStorage.setItem(TENANT_STORAGE_KEY, tenantId);
  } catch {
    // localStorage write failed — the cookie below still lets a BFF layer see it.
  }
  setCookie(TENANT_COOKIE_NAME, tenantId, TENANT_COOKIE_MAX_AGE_SECONDS);
};

/** Clears the tenant id from both storage locations (e.g. on 401 / logout). */
export const clearTenantFromStorage = () => {
  try {
    localStorage.removeItem(TENANT_STORAGE_KEY);
  } catch {
    // ignore
  }
  clearCookie(TENANT_COOKIE_NAME);
};
