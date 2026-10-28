// Pickup and return time slots for the search sheet.
// Times use the app's existing label format ("10 AM", "10:30 AM") so the
// booking, pricing and API code that parses selectedPickup.time keeps working.

export const DEFAULT_TIME = "10 AM";

// Hub hours: first slot 8 AM, last slot 8:30 PM (the hub closes at 9 PM).
export const HUB_OPEN_MINUTES = 8 * 60;
export const HUB_CLOSE_MINUTES = 21 * 60;

// A same-day pickup needs this much notice so the hub can get the vehicle ready.
export const PICKUP_LEAD_MINUTES = 120;

const SLOT_STEP_MINUTES = 30;

export const minutesToLabel = (minutes) => {
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const modifier = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return mins === 0
    ? `${hours12} ${modifier}`
    : `${hours12}:${String(mins).padStart(2, "0")} ${modifier}`;
};

// "10 AM" / "10:30 AM" / "10:00 AM" → minutes after midnight, or null.
export const labelToMinutes = (label) => {
  const match = /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i.exec(String(label || "").trim());
  if (!match) return null;
  let hours = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hours += 12;
  return hours * 60 + Number(match[2] || 0);
};

const buildSlots = () => {
  const slots = [];
  for (let m = HUB_OPEN_MINUTES; m < HUB_CLOSE_MINUTES; m += SLOT_STEP_MINUTES) {
    slots.push({ minutes: m, label: minutesToLabel(m) });
  }
  return slots;
};

export const TIME_SLOTS = buildSlots();

export const TIME_SLOT_GROUPS = [
  { label: "Morning", from: 0, to: 12 * 60 },
  { label: "Afternoon", from: 12 * 60, to: 17 * 60 },
  { label: "Evening", from: 17 * 60, to: 24 * 60 },
].map((group) => ({
  label: group.label,
  slots: TIME_SLOTS.filter((slot) => slot.minutes >= group.from && slot.minutes < group.to),
}));

// Snap any stored time to a valid slot label (falls back to the default).
export const normaliseTimeLabel = (label) => {
  const minutes = labelToMinutes(label);
  const slot = TIME_SLOTS.find((s) => s.minutes === minutes);
  return slot ? slot.label : DEFAULT_TIME;
};

const sameDay = (a, b) =>
  a && b &&
  new Date(a).getFullYear() === new Date(b).getFullYear() &&
  new Date(a).getMonth() === new Date(b).getMonth() &&
  new Date(a).getDate() === new Date(b).getDate();

// Why a pickup slot can't be chosen on this date, or null when it can.
export const pickupSlotBlocked = (date, minutes, now = new Date()) => {
  if (!date || !sameDay(date, now)) return null;
  const earliest = now.getHours() * 60 + now.getMinutes() + PICKUP_LEAD_MINUTES;
  return minutes < earliest ? "too-soon" : null;
};

// A return slot can't be at or before pickup when both are on the same day.
export const returnSlotBlocked = (pickup, returnDate, minutes) => {
  if (!pickup?.date || !returnDate || !sameDay(pickup.date, returnDate)) return null;
  const pickupMinutes = labelToMinutes(pickup.time) ?? labelToMinutes(DEFAULT_TIME);
  return minutes <= pickupMinutes ? "before-pickup" : null;
};

export const firstOpenSlot = (isBlocked) =>
  TIME_SLOTS.find((slot) => !isBlocked(slot.minutes))?.label ?? null;

// Billable days for a rental: every started 24 hours counts as a day (min 1).
export const billableDays = (pickupDate, pickupTime, returnDate, returnTime) => {
  if (!pickupDate || !returnDate) return 0;
  const start = new Date(pickupDate);
  start.setHours(0, (labelToMinutes(pickupTime) ?? 600), 0, 0);
  const end = new Date(returnDate);
  end.setHours(0, (labelToMinutes(returnTime) ?? 600), 0, 0);
  const diff = end - start;
  if (diff <= 0) return 1;
  return Math.max(1, Math.ceil(diff / (24 * 60 * 60 * 1000)));
};
