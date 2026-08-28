import { getAPI } from "../caller/axiosUrls";

/**
 * Shared cache for GET /catalogue/vehicle-models?hubId=X, keyed per hub.
 *
 * Booking responses (/bookings/mine, /bookings/{id}) only carry a raw
 * vehicleModelId — no embedded vehicle name/image at all — so showing a
 * real vehicle name/image means cross-referencing that id against this
 * per-hub model list. Cached per hub since several bookings usually share
 * the same hub.
 */
const cacheByHub = new Map();

const fetchModelsForHub = (hubId) => {
  if (!cacheByHub.has(hubId)) {
    cacheByHub.set(
      hubId,
      getAPI(`/catalogue/vehicle-models?hubId=${hubId}`)
        .then((models) => (Array.isArray(models) ? models : []))
        .catch((error) => {
          cacheByHub.delete(hubId); // let a later call retry instead of caching a failure forever
          throw error;
        })
    );
  }
  return cacheByHub.get(hubId);
};

/**
 * Resolves to a Map<vehicleModelId, model> covering every model at the
 * given hubs. Hub ids are deduped; a failed hub's models are just missing
 * from the map (falls back to whatever placeholder the caller already
 * uses for unknown vehicles) rather than failing the whole lookup.
 */
export const getVehicleModelsByHubIds = async (hubIds) => {
  const uniqueHubIds = [...new Set((hubIds || []).filter(Boolean))];
  const perHubModels = await Promise.all(
    uniqueHubIds.map((hubId) => fetchModelsForHub(hubId).catch(() => []))
  );
  const map = new Map();
  perHubModels.flat().forEach((model) => map.set(model.id, model));
  return map;
};
