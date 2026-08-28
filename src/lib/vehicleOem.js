import { getAPI } from "../caller/axiosUrls";

/**
 * Shared cache for GET /catalogue/vehicle-oem (the "Brand" filter's real
 * data source — a tenant-wide OEM list, not something derived from vehicle
 * names). Same one-resolved-promise-per-page-load pattern as lib/hubs.js,
 * for the same reason: this is tenant-wide, rarely-changing data that every
 * SearchPage visit needs, so it's fetched once and shared instead of once
 * per component that wants it.
 */
let oemsPromise = null;

/** Resolves to the tenant's vehicle-OEM list (always an array). */
export const getVehicleOems = () => {
  if (!oemsPromise) {
    oemsPromise = getAPI("/catalogue/vehicle-oem")
      .then((oems) => (Array.isArray(oems) ? oems : []))
      .catch((error) => {
        oemsPromise = null; // let the next call retry instead of caching a failure forever
        throw error;
      });
  }
  return oemsPromise;
};
