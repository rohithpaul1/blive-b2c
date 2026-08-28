/**
 * REST auth session storage (phone-OTP login against the new B2C backend).
 *
 * The access token is stored under the SAME 'token' key axiosConfig.js's
 * request interceptor already reads — so attaching it to every request
 * needed zero changes there. The refresh token gets its own key.
 */

const ACCESS_TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';

/** Reads the current access token, if any. */
export const getAccessToken = () =>
  localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY);

/** Reads the current refresh token, if any. */
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

/** Persists a token pair from a successful /auth/verify-otp or /auth/refresh call. */
export const setSessionTokens = ({ accessToken, refreshToken } = {}) => {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

/** Clears the session (logout, or a 401 that couldn't be recovered). */
export const clearSessionTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
};
