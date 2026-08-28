import axios from 'axios';
import { API_BASE_URL } from '../config/env';
import { getTenantId } from '../lib/tenant';
import { getAccessToken, getRefreshToken, setSessionTokens, clearSessionTokens } from '../lib/authSession';

// Header names agreed with the backend for tenant/CSRF pass-through. Keep
// this the single place these are defined — every outgoing request gets
// them from here, no call site sets them itself.
const TENANT_HEADER = 'x-tenant-id';
const CSRF_HEADER = 'x-csrf-token';
const CSRF_COOKIE_NAME = 'csrf_token';

const getCsrfToken = () => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
};

/**
 * Clears the current session (tokens + cached profile) on a 401 that
 * couldn't be recovered by refreshing. Shared by this module's response
 * interceptor and axiosUrls.js's error handler so the two 401 paths can't
 * drift out of sync.
 *
 * Deliberately does NOT touch tenant_id. Tenant identity is a property of
 * the domain, not of who's logged in — clearing it here was a real bug: an
 * expired token on one in-flight request could wipe tenant_id out from
 * under a completely unrelated concurrent request (e.g. the hub list),
 * making that one fail with "x-tenant-id header is required" — a
 * confusing, unrelated-looking failure caused entirely by a stale token.
 */
export const clearAuthState = () => {
    clearSessionTokens();
    localStorage.removeItem('userData');
    sessionStorage.removeItem('userData');
};

const instance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: false,
});

// Dev-only: free ngrok tunnels intercept some browser requests with an
// HTML "you're about to visit..." interstitial (ERR_NGROK_6024) instead of
// proxying to the real backend — the browser then reports it as a CORS
// failure since that page has no CORS headers. BE has added this header to
// their CORS allowedHeaders, so it's safe to send now. Scoped to ngrok
// hosts only so it never rides along to a real production backend.
const IS_NGROK_TUNNEL = /\bngrok(-free)?\.(app|dev)\b/i.test(API_BASE_URL);

// Request interceptor — the single place every cross-cutting request header
// (auth, tenant, CSRF) gets attached. No component should set these itself.
instance.interceptors.request.use(
    (config) => {
        const accessToken = getAccessToken();
        if (accessToken) {
            config.headers['Authorization'] = "Bearer " + accessToken;
        }

        const tenantId = getTenantId();
        if (tenantId) {
            config.headers[TENANT_HEADER] = tenantId;
        }

        const csrfToken = getCsrfToken();
        if (csrfToken) {
            config.headers[CSRF_HEADER] = csrfToken;
        }

        if (IS_NGROK_TUNNEL) {
            config.headers['ngrok-skip-browser-warning'] = 'true';
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// --- Silent token refresh on 401 ---
// Access tokens are short-lived (30 min). Without this, any session that
// outlasts that window 401s on its very next call and force-logs the user
// out — even though a perfectly good refreshToken is sitting right there
// in storage, unused. This refreshes once via /auth/refresh and retries
// the original request transparently; concurrent 401s (several requests
// in flight when the token ages out) share the one in-flight refresh
// instead of each firing their own.
let refreshPromise = null;

const refreshAccessToken = () => {
    if (!refreshPromise) {
        const refreshToken = getRefreshToken();
        if (!refreshToken) return Promise.reject(new Error('No refresh token available'));

        const tenantId = getTenantId();
        const headers = {};
        if (tenantId) headers[TENANT_HEADER] = tenantId; // /auth/refresh requires this too
        if (IS_NGROK_TUNNEL) headers['ngrok-skip-browser-warning'] = 'true';

        // Plain axios call, NOT the shared `instance` — going through it
        // here would recurse straight back into this same 401 handling.
        refreshPromise = axios
            .post(`${API_BASE_URL}/auth/refresh`, { refreshToken }, { headers })
            .then((res) => {
                setSessionTokens(res.data);
                return res.data.accessToken;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }
    return refreshPromise;
};

// Response interceptor for global auth error handling
instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.message;
        const originalRequest = error.config;

        // Try exactly one silent refresh-and-retry per request before
        // giving up and logging out.
        if (status === 401 && originalRequest && !originalRequest._retriedAfterRefresh && getRefreshToken()) {
            originalRequest._retriedAfterRefresh = true;
            try {
                const newAccessToken = await refreshAccessToken();
                originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
                return instance(originalRequest);
            } catch {
                // Refresh token is also invalid/expired — fall through to
                // the clear-and-redirect below, same as a normal 401.
            }
        }

        // Handle 401 Unauthorized or 403 Session Expired
        if (status === 401 || (status === 403 && message === 'Session Expired')) {
            clearAuthState();

            console.log('🔍 Session expired/unauthorized - clearing auth and redirecting to login');

            // Redirect to home/login page
            window.location.href = '/';

            return Promise.reject({
                ...error,
                isAuthError: true,
                message: 'Session expired. Please login again.'
            });
        }
        return Promise.reject(error);
    }
);

export default instance;
