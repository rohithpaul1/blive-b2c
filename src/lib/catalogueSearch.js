import { getAPI } from "../caller/axiosUrls";
import { getHubs } from "./hubs";

/**
 * Shared helpers for GET /catalogue/search (the real B2C backend's priced,
 * available-vehicle listing) — used by both the home page's Catalogs.jsx
 * and SearchPage.jsx so the two don't drift into two different mappings of
 * the same API.
 */

// SUBSCRIPTION searches take a `howLong` enum, not a date range — the
// existing Daily/Weekly/Monthly tabs don't map 1:1 onto it (that enum has 5
// options: 1week/1 month/3 months/6 months/12 months). Approximated here;
// worth a product call on whether subscription needs its own tab set.
export const HOW_LONG_FOR_PLAN_TYPE = {
  daily: "1week",
  weekly: "1 month",
  monthly: "3 months",
};

export const toApiIsoString = (date, time) => {
  if (!date) return null;
  const base = new Date(date);
  const [, timeVal, modifier] = /^(\d{1,2}(?::\d{2})?)\s*(AM|PM)?$/i.exec((time || "10 AM").trim()) || [];
  let [hours, minutes = "0"] = (timeVal || "10").split(":");
  hours = parseInt(hours, 10);
  if (modifier?.toUpperCase() === "PM" && hours < 12) hours += 12;
  if (modifier?.toUpperCase() === "AM" && hours === 12) hours = 0;
  base.setHours(hours, parseInt(minutes, 10) || 0, 0, 0);
  return base.toISOString();
};

// /catalogue/search is scoped to one hub per call — there's no "every hub
// at once" version, and no hub-picker UI exists yet (see conversation), so
// this defaults to the first hub /catalogue/hubs returns.
export const getDefaultHubId = async () => {
  const hubs = await getHubs();
  return hubs?.[0]?.id ?? null;
};

/**
 * One FilterPage.jsx "Range" pill (e.g. {from: 40, to: 80} or the open-ended
 * {from: 120} for "120 kms & above") -> the `rangeBuckets` query value the
 * real endpoint expects (confirmed against BE: `rangeBuckets=40-80`).
 */
export const rangeToBucket = (range) => {
  if (!range) return null;
  return range.to ? `${range.from}-${range.to}` : `${range.from}+`;
};

/**
 * Calls /catalogue/search with the right params for FIXED_TERM vs
 * SUBSCRIPTION per the real API's documented behavior. planId/sessionId
 * deliberately omitted (optional, not needed here per instruction).
 * minPrice/maxPrice/rangeBuckets/oemIds are optional server-side filters
 * (FilterPage's price slider, range pills, and brand pills — brand is a real
 * GET /catalogue/vehicle-oem id now, see lib/vehicleOem.js, not guessed from
 * the vehicle name) — sent as real query params so filtering happens on the
 * full catalogue instead of just the one page of results already fetched,
 * same as everything else this endpoint already filters by (hub, dates,
 * term). Always resolves to an array, even on a malformed response.
 */
export const searchVehicles = async ({ hubId, isSubscription, planType, pickup, dropoff, minPrice, maxPrice, rangeBucket, oemId }) => {
  if (!hubId) return [];

  const params = new URLSearchParams({
    hubId,
    rentalTerm: isSubscription ? "SUBSCRIPTION" : "FIXED_TERM",
    pickupDateTime: toApiIsoString(pickup?.date, pickup?.time) || new Date().toISOString(),
  });

  if (isSubscription) {
    params.append("howLong", HOW_LONG_FOR_PLAN_TYPE[planType] || "1 month");
  } else {
    const dropoffDateTime = toApiIsoString(dropoff?.date, dropoff?.time);
    if (dropoffDateTime) params.append("dropoffDateTime", dropoffDateTime);
  }

  if (minPrice != null) params.append("minPrice", minPrice);
  if (maxPrice != null) params.append("maxPrice", maxPrice);
  if (rangeBucket) params.append("rangeBuckets", rangeBucket);
  if (oemId) params.append("oemIds", oemId);

  const results = await getAPI(`/catalogue/search?${params}`);
  return Array.isArray(results) ? results : [];
};

/**
 * Maps one /catalogue/search result to the shape <Cards> already expects.
 * Search already returns the ONE plan tier matching the requested
 * dates/howLong (server picks daily/weekly/monthly based on duration), so
 * unlike the old endpoint there's no per-tab plan lookup needed here.
 *
 * Fields with no real source in this endpoint's response are approximated
 * (documented inline): brandName/brandLogoUrl (no brand object at all —
 * derived from the vehicle name's first word) and several spec fields
 * (batteryType, currentMileage, vehicleSpeed, engineType, vehicleCategory)
 * that simply aren't returned — defaulted to generic placeholders, same as
 * the old code already defaulted missing values.
 */
export const transformSearchResult = (item, { isSubscription, rentalMode }) => {
  const plan = item.plan || {};
  const perDayPrice = plan.perDayPrice ?? plan.baseRate ?? 0;
  const totalAmount = plan.totalAmount ?? perDayPrice;
  const durationDays = plan.durationDays ?? 1;
  // Mirrors the old "what it'd cost at the daily rate" strike-through,
  // shown only when the plan's actual price is a real discount off that.
  const dailyRateEquivalent = perDayPrice * durationDays;
  const availableCount = item.availableUnits ?? 0;

  return {
    id: item.vehicleModelId,
    vehicleName: item.name,
    manufacturer: item.vehicleType || "",
    brandName: item.name?.split(" ")[0] || "EV",
    imgUrl: item.modelImages?.[0] || "/images/CartoonScooter.png",
    price: totalAmount,
    actualPrice: dailyRateEquivalent > totalAmount ? dailyRateEquivalent : null,

    range: item.rangePerCharge || 0,
    topSpeed: item.topSpeed || 0,
    chargeTime: item.chargingDuration || 0,

    batteryType: "charging",
    batteryCapacity: item.batteryCapacity || 0,
    perDayKmLimit: plan.defaultValues?.includedKm || 0,
    perKmCharge: plan.defaultValues?.extraKmCharge ?? null,
    currentMileage: 0,
    vehicleSpeed: "standard",
    engineType: item.fuelType === "BEV" ? "ev" : "fuel",
    vehicleCategory: item.vehicleType === "SCOOTERS_BIKES" ? "two-wheeler" : "vehicle",
    b2cDeposit: plan.depositAmount,
    onboardingFee: plan.defaultValues?.onboardingFee ?? 0,
    isAvailable: availableCount > 0,
    nextAvailableDate: availableCount > 0 ? "Available Now" : "Contact hub",
    availableCount,
    planId: plan.id,
    planName: plan.name,
    usageModel: isSubscription ? "payg" : "one_off",
    rentalMode,
    billingPolicy: null,
  };
};
