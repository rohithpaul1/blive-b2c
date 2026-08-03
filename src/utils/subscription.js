export const RENTAL_MODES = {
  fixed: "fixed",
  subscription: "subscription",
};

export const planUnit = (planType) => {
  const normalized = String(planType || "").toLowerCase();
  if (normalized.startsWith("month")) return "month";
  if (normalized.startsWith("week")) return "week";
  return "day";
};

export const planUnitLabel = (planType, duration = 1) => {
  const unit = planUnit(planType);
  return `${unit}${Number(duration) === 1 ? "" : "s"}`;
};

export const startingPeriodLabel = (planType, duration = 1) =>
  `${Number(duration) || 1} ${planUnitLabel(planType, duration)}`;

export const renewalCadenceLabel = (planType) => {
  const unit = planUnit(planType);
  return unit === "day" ? "daily" : unit === "week" ? "weekly" : "monthly";
};

export const normaliseDuration = (value) =>
  Math.min(24, Math.max(1, Math.floor(Number(value) || 1)));

/** Calendar-accurate commitment end (months are not treated as 30 days). */
export const addPlanDuration = (start, planType, duration = 1) => {
  const date = new Date(start);
  const units = normaliseDuration(duration);
  if (planType === "monthly") date.setMonth(date.getMonth() + units);
  else if (planType === "weekly") date.setDate(date.getDate() + units * 7);
  else date.setDate(date.getDate() + units);
  return date;
};

export const rentalPlanFor = (vehicle, rentalMode, planType) => {
  const modeKey = rentalMode === RENTAL_MODES.subscription ? "subscription" : "fixed";
  return vehicle?.rentalPlans?.[modeKey]?.[planType] ?? null;
};
