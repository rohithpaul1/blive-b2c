import { getAPI } from "../caller/axiosUrls";

/**
 * Shared cache for GET /catalogue/hubs.
 *
 * Several independent places need the hub list (LocationDropdown, Catalogs'
 * default-hub resolution, Booking's hub picker) — without this they'd each
 * fire their own request on mount, hitting the same endpoint 3+ times per
 * page load for identical data. This memoizes the in-flight/resolved
 * promise so every caller shares one network call.
 */
let hubsPromise = null;

/** Resolves to the hub list (always an array, even on a malformed response). */
export const getHubs = () => {
  if (!hubsPromise) {
    hubsPromise = getAPI("/catalogue/hubs")
      .then((hubs) => (Array.isArray(hubs) ? hubs : []))
      .catch((error) => {
        hubsPromise = null; // let the next call retry instead of caching a failure forever
        throw error;
      });
  }
  return hubsPromise;
};
