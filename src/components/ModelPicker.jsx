import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { BatteryCharging, Bluetooth, Check, Gauge, Package, Route, SlidersHorizontal, Undo2, User, Weight, Zap } from "lucide-react";
import useRentNow from "../hooks/useRentNow";
import { addPlanDuration, planUnit } from "../utils/subscription";

// Search results built for a franchise that rents one model, after Sixt's
// "Booking option" panel: the model on the left, plans and price on the right.
// With two or more models a row of model cards appears above and the selected
// card drives the panel, so the same page scales without a new layout.

const PLAN_ORDER = ["daily", "weekly", "monthly"];
const UNIT_DAYS = { daily: 1, weekly: 7, monthly: 30 };

const inr = (value) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(Number(value) || 0)));

const clock = (label) => {
  const m = /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i.exec(String(label || "").trim());
  return m ? `${m[1]}:${m[2] || "00"} ${m[3].toUpperCase()}` : label || "";
};

const fallbackImage = (e) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = "/images/home/nduro-side.png";
};

const Spec = (props) => {
  const { icon: Glyph, children } = props;
  return (
    <span className="inline-flex items-center gap-[6px] rounded-full bg-white/[0.16] px-[12px] py-[6px] text-[13px] font-semibold text-white backdrop-blur-[2px]">
      <Glyph className="size-[15px]" aria-hidden="true" />
      {children}
    </span>
  );
};

// A transparent PNG (or the model's cutoutUrl) floats on the stage with a floor shadow,
// like Sixt's cars. Anything else is a photo, faded at the edges so it has no box.
const isCutout = (src) => /\.png($|\?)/i.test(String(src || ""));

const VehicleArt = ({ src, alt, size = "card" }) => {
  const tall = size === "stage" ? "h-[clamp(220px,30vw,360px)]" : "h-[210px]";
  if (isCutout(src)) {
    return (
      <div className={`relative flex w-full items-end justify-center ${tall}`}>
        <span
          aria-hidden="true"
          className="absolute bottom-[4%] left-1/2 h-[9%] w-[72%] -translate-x-1/2 rounded-[50%] bg-black/55 blur-[14px]"
        />
        <img src={src} alt={alt} loading="lazy" onError={fallbackImage} className="relative h-full w-full object-contain object-bottom" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={fallbackImage}
      className={`w-full object-cover ${tall} [mask-image:radial-gradient(ellipse_62%_58%_at_50%_52%,#000_45%,transparent_100%)]`}
    />
  );
};

// "Lectrix · Electric scooter", without repeating a brand the model name already carries.
const byline = (model) =>
  String(model.vehicleName || "").toLowerCase().startsWith(String(model.brandName || "").toLowerCase())
    ? "Electric scooter"
    : `${model.brandName} · Electric scooter`;

const FEATURE_ICONS = {
  range: Route,
  speed: Gauge,
  battery: BatteryCharging,
  storage: Package,
  modes: SlidersHorizontal,
  reverse: Undo2,
  bluetooth: Bluetooth,
  weight: Weight,
  seats: User,
};

// Sixt's spec row: plain icon + label pairs, no chip boxes.
const FeatureRow = ({ features }) => (
  <ul className="m-0 flex list-none flex-wrap justify-center gap-x-[22px] gap-y-[10px] p-0">
    {features.map((f) => {
      const Glyph = FEATURE_ICONS[f.icon] || Zap;
      return (
        <li key={f.label} className="flex items-center gap-[8px] text-[15px] font-medium text-white">
          <Glyph className="size-[18px] shrink-0" aria-hidden="true" />
          {f.label}
        </li>
      );
    })}
  </ul>
);

const specChips = (model) =>
  [
    model.range > 0 && { icon: Route, label: `${model.range} km range` },
    model.topSpeed > 0 && { icon: Gauge, label: `${model.topSpeed} km/h` },
    model.perDayKmLimit > 0 && { icon: Zap, label: `${model.perDayKmLimit} km a day` },
  ].filter(Boolean);

function ModelCard({ model, planType, selected, onSelect, pricingFor, best }) {
  const plan = model.plans[planType] || model.plans[Object.keys(model.plans)[0]];
  const pricing = plan ? pricingFor(plan.price, planType) : null;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={`sixt-stage ${best ? "sixt-stage-warm" : ""} relative flex min-h-[540px] w-full flex-col overflow-hidden rounded-[16px] text-left text-white outline-offset-[4px] transition-[outline-color] ${
          selected ? "outline outline-[3px] outline-[#c44536]" : "outline outline-[3px] outline-transparent hover:outline-white/30"
        } ${model.isAvailable ? "" : "opacity-60"}`}
      >
        <span className="px-[22px] pt-[22px]">
          <span className="font-display block text-[34px] leading-none">{model.vehicleName}</span>
          <span className="mt-[8px] block text-[16px] text-white/90">{byline(model)}</span>
          <span className="mt-[14px] flex flex-wrap gap-[6px]">
            {best && <span className="rounded-full bg-[#c44536] px-[12px] py-[6px] text-[13px] font-semibold">Best value</span>}
            {specChips(model).map((c) => (
              <Spec key={c.label} icon={c.icon}>{c.label}</Spec>
            ))}
          </span>
        </span>
        <span className="flex flex-1 items-center px-[16px]">
          <VehicleArt src={model.cutoutUrl || model.imgUrl} alt="" />
        </span>
        <span className="block px-[22px] pb-[18px]">
          {model.perDayKmLimit > 0 && (
            <span className="flex items-center gap-[8px] text-[15px]">
              <span aria-hidden="true" className="text-[#7dd3a0]">✓</span>
              {model.perDayKmLimit} km a day included
            </span>
          )}
          <span className="mt-[8px] block">
            {model.isAvailable && pricing ? (
              <>
                <span className="text-[18px] font-bold">₹</span>
                <span className="text-[34px] font-extrabold leading-none tabular-nums">{inr(pricing.perUnit)}</span>
                <span className="text-[17px] font-bold"> /{pricing.unit}</span>
                {pricing.days ? <span className="ml-[10px] text-[15px] tabular-nums text-white/70">₹{inr(pricing.total)} total</span> : null}
              </>
            ) : (
              <span className="text-[16px] font-semibold">Not available for your dates</span>
            )}
          </span>
        </span>
        <span className="sixt-band block px-[22px] py-[14px] text-center text-[15px] font-bold underline underline-offset-[4px]">
          Subscribe and save up to 50%
        </span>
      </button>
      {selected && (
        <span
          aria-hidden="true"
          className="absolute -bottom-[14px] left-[48px] h-0 w-0 border-x-[10px] border-t-[10px] border-x-transparent border-t-[#c44536]"
        />
      )}
    </div>
  );
}

const readAddOns = () => {
  try {
    const saved = JSON.parse(sessionStorage.getItem("selectedAddOns") || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

// Sixt-style toggle row: name, price, Details disclosure, switch.
function AddOnRow({ addOn, on, open, onToggle, onDetails }) {
  return (
    <li className={`rounded-[12px] border bg-white px-[16px] py-[14px] transition-colors ${on ? "border-[#1c1a22]" : "border-[#e3e0e8]"}`}>
      <div className="flex items-center gap-[12px]">
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-bold text-[#1c1a22]">{addOn.name}</span>
          <span className="mt-[3px] block text-[14px] text-[#3d3846]">
            <span className="font-bold tabular-nums">₹{inr(addOn.price)}</span> / {addOn.per === "day" ? "day" : "one-time"}
          </span>
        </span>
        <button
          type="button"
          aria-expanded={open}
          onClick={onDetails}
          className="min-h-[44px] px-[4px] text-[14px] font-bold text-[#1c1a22] underline underline-offset-4 hover:text-[#c44536]"
        >
          Details
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={`Add ${addOn.name}`}
          onClick={onToggle}
          className={`relative h-[30px] w-[52px] shrink-0 rounded-full transition-colors ${on ? "bg-[#c44536]" : "bg-[#dcdadf] hover:bg-[#cfccd3]"}`}
        >
          <span
            aria-hidden="true"
            className={`absolute left-[3px] top-[3px] size-[24px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-transform ${on ? "translate-x-[22px]" : ""}`}
          />
        </button>
      </div>
      {open && <p className="m-0 mt-[10px] text-[14px] leading-[1.5] text-[#5a5562]">{addOn.details}</p>}
    </li>
  );
}

export default function ModelPicker({
  models,
  selectedPlanType,
  onPlanChange,
  pickup,
  dropoff,
  cutout = null,
  features = [],
  addOns = [],
  hubAddress = "",
  supportPhone = "",
  onBillingChange,
}) {
  const { rentNow, pricingFor, isSubscription, rentalDays } = useRentNow();
  const [modelId, setModelId] = useState(() => (models.find((m) => m.isAvailable) || models[0])?.id);
  const [busy, setBusy] = useState(false);
  const [addOnIds, setAddOnIds] = useState(readAddOns);
  const [detailsId, setDetailsId] = useState(null);
  // Subscriptions: a cycle the rider tapped but hasn't confirmed yet, and the last change made.
  const [pendingCycle, setPendingCycle] = useState(null);
  const [cycleChanged, setCycleChanged] = useState(null);

  useEffect(() => {
    if (!models.some((m) => m.id === modelId)) setModelId((models.find((m) => m.isAvailable) || models[0])?.id);
  }, [models, modelId]);

  const model = models.find((m) => m.id === modelId) || models[0];
  const planTypes = PLAN_ORDER.filter((pt) => model?.plans[pt]);
  // Preselect the plan that fits the rider's dates (subscriptions: monthly, else the chosen cycle).
  const fitsDates = isSubscription
    ? (planTypes.includes(selectedPlanType) ? selectedPlanType : planTypes.includes("monthly") ? "monthly" : planTypes[0])
    : rentalDays >= 30 && planTypes.includes("monthly")
    ? "monthly"
    : rentalDays >= 7 && planTypes.includes("weekly")
    ? "weekly"
    : planTypes.includes("daily")
    ? "daily"
    : planTypes[0];
  const planType = fitsDates;

  // Per-day price of each plan, for savings and the best-value badge.
  const perDay = useMemo(() => {
    const out = {};
    planTypes.forEach((pt) => {
      out[pt] = (Number(model.plans[pt].price) || 0) / UNIT_DAYS[pt];
    });
    return out;
  }, [model, planTypes]);

  if (!model) return null;

  const art = cutout || model.cutoutUrl || model.imgUrl;
  // Cheapest available model for the chosen plan gets the Best value tag.
  const cheapestId = models
    .filter((m) => m.isAvailable && m.plans[planType])
    .reduce((best, m) => (!best || Number(m.plans[planType].price) < Number(best.plans[planType].price) ? m : best), null)?.id;
  const selectedPlan = model.plans[planType];
  const pricing = pricingFor(selectedPlan?.price, planType);
  const single = models.length === 1;

  const tripLine =
    pickup?.date &&
    (isSubscription
      ? `Starts ${format(new Date(pickup.date), "d MMM")}, ${clock(pickup.time)}`
      : `${format(new Date(pickup.date), "d MMM")}, ${clock(pickup.time)} → ${
          dropoff?.date ? `${format(new Date(dropoff.date), "d MMM")}, ${clock(dropoff.time)}` : "Add return"
        }`);

  // Rentals: the dates pick the plan. Offer a longer plan only when a few more days unlock a lower daily rate.
  const extend = (() => {
    if (isSubscription || !model.isAvailable || !pricing.days) return null;
    const days = pricing.days;
    const target = days >= 4 && days < 7 ? "weekly" : days >= 20 && days < 30 ? "monthly" : null;
    if (!target || !planTypes.includes(target) || !(perDay[target] < perDay[planType])) return null;
    const targetDays = UNIT_DAYS[target];
    const extra = targetDays - days;
    const diff = Math.round(perDay[target] * targetDays - pricing.total);
    return {
      plan: target,
      days: targetDays,
      title: `Add ${extra} more ${extra === 1 ? "day" : "days"} and pay ₹${inr(perDay[target])} a day`,
      body:
        diff > 0
          ? `${targetDays} days cost just ₹${inr(diff)} more than ${days}.`
          : diff === 0
          ? `${targetDays} days for the price of ${days}.`
          : `${targetDays} days cost ₹${inr(-diff)} less than ${days}.`,
    };
  })();

  // Subscriptions: the commitment stays the same length; the cycle only changes how often you pay.
  const UNIT_WORD = { daily: "day", weekly: "week", monthly: "month" };
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const fmt = (d) => format(d, "d MMM");
  const commitDays = pickup?.date
    ? Math.max(1, Math.round((addPlanDuration(pickup.date, planType, pricing.units || 1) - new Date(pickup.date)) / 86400000))
    : 30;
  const unitsFor = (pt) =>
    pt === planType
      ? pricing.units || 1
      : pt === "monthly"
      ? Math.max(1, Math.round(commitDays / 30.44))
      : pt === "weekly"
      ? Math.max(1, Math.round(commitDays / 7))
      : commitDays;
  // A commitment is at most 24 bills, so daily billing isn't offered on long plans.
  const cycles = isSubscription ? planTypes.filter((pt) => unitsFor(pt) <= 24) : [];
  const cyclePrice = (pt) => Number(model.plans[pt]?.price) || 0;
  const cycleTotal = (pt) => cyclePrice(pt) * unitsFor(pt);
  const cycleEnd = (pt) => (pickup?.date ? addPlanDuration(pickup.date, pt, unitsFor(pt)) : null);
  const schedule = (() => {
    if (!isSubscription || !pickup?.date) return null;
    const units = unitsFor(planType);
    const start = new Date(pickup.date);
    return {
      units,
      next: units > 1 ? addPlanDuration(start, planType, 1) : null,
      last: units > 1 ? addPlanDuration(start, planType, units - 1) : null,
      end: addPlanDuration(start, planType, units),
    };
  })();
  const switchNote = (pt) => {
    const diff = cycleTotal(pt) - cycleTotal(planType);
    const endNow = cycleEnd(planType);
    const endNew = cycleEnd(pt);
    const moved = endNow && endNew && fmt(endNow) !== fmt(endNew);
    return [
      `You'll pay ₹${inr(cyclePrice(pt))} every ${UNIT_WORD[pt]} instead of ₹${inr(cyclePrice(planType))} every ${UNIT_WORD[planType]}.`,
      `That's ${plural(unitsFor(pt), "bill")} and ₹${inr(cycleTotal(pt))} in total${
        diff ? `, ₹${inr(Math.abs(diff))} ${diff > 0 ? "more" : "less"} than ${UNIT_WORD[planType]}ly billing` : ""
      }.`.replace("dayly", "daily"),
      moved ? `Your plan ends ${fmt(endNew)} instead of ${fmt(endNow)}.` : endNew ? `Your plan still ends ${fmt(endNew)}.` : "",
    ]
      .filter(Boolean)
      .join(" ");
  };
  const confirmCycle = (pt) => {
    setCycleChanged({ from: planType, to: pt });
    setPendingCycle(null);
    onBillingChange?.(pt, unitsFor(pt));
  };

  const addOnDays = isSubscription ? (pricing.units || 1) * (UNIT_DAYS[planType] || 1) : pricing.days || 1;
  const chosenAddOns = addOns.filter((a) => addOnIds.includes(a.id));
  const addOnCost = (a) => (a.per === "day" ? a.price * addOnDays : a.price);
  const addOnTotal = chosenAddOns.reduce((sum, a) => sum + addOnCost(a), 0);
  const kmBonus = chosenAddOns.reduce((sum, a) => sum + (Number(a.kmBonus) || 0), 0);

  const toggleAddOn = (id) =>
    setAddOnIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        sessionStorage.setItem("selectedAddOns", JSON.stringify(next));
      } catch {
        /* storage unavailable: the choice still holds on this page */
      }
      return next;
    });

  const overview = [
    model.perDayKmLimit > 0 &&
      `${model.perDayKmLimit + kmBonus} km a day included${model.perKmCharge ? `, then ₹${inr(model.perKmCharge)} per extra km` : ""}`,
    "Maintenance and breakdown help",
    supportPhone ? `24/7 support on ${supportPhone}` : "24/7 support",
    hubAddress && `Pick up at ${hubAddress}`,
  ].filter(Boolean);

  const handleContinue = async () => {
    setBusy(true);
    try {
      await rentNow({ ...model, ...selectedPlan.card }, planType);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="flex flex-col gap-[28px]">
      <header className="flex flex-col gap-[8px] md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display m-0 text-[clamp(36px,4.5vw,56px)] leading-[0.95] text-[#0f0d16]">
            {single ? "Get ready to ride" : "Which scooter do you want to ride?"}
          </h1>
          <p className="m-0 mt-[8px] text-[16px] text-[#5a5562]">
            {single
              ? `${model.vehicleName}${model.isAvailable ? ` · ${model.availableCount} available for your dates` : ""}`
              : `${models.filter((m) => m.isAvailable).length} of ${models.length} models available for your dates`}
          </p>
        </div>
        {tripLine && <p className="m-0 text-[15px] font-semibold tabular-nums text-[#1c1a22]">{tripLine}</p>}
      </header>

      {!single && (
        <div className="grid grid-cols-1 gap-[24px] sm:grid-cols-2 xl:grid-cols-3">
          {models.map((m) => (
            <ModelCard
              key={m.id}
              model={m}
              planType={planType}
              selected={m.id === model.id}
              onSelect={() => setModelId(m.id)}
              pricingFor={pricingFor}
              best={m.id === cheapestId}
            />
          ))}
        </div>
      )}

      <div className="grid overflow-clip rounded-[24px] border border-[#e3e0e8] bg-white lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        {/* The scooter stays in view while the add-ons column scrolls past it. */}
        <div className="sixt-stage text-white">
          <div className="flex min-h-[480px] flex-col px-[20px] pb-[26px] pt-[30px] md:px-[32px] md:pt-[40px] lg:sticky lg:top-[88px] lg:h-[min(760px,calc(100vh-108px))]">
          <h2 className="font-display m-0 text-center text-[clamp(34px,4vw,48px)] leading-none">{model.vehicleName}</h2>
          <p className="m-0 mt-[10px] text-center text-[17px] text-white/90">{byline(model)} · Maintenance included</p>
          <div className="flex flex-1 items-center py-[12px]">
            <VehicleArt src={art} alt={model.vehicleName} size="stage" />
          </div>
          {model.isAvailable && model.availableCount <= 2 && (
            <span className="mb-[14px] self-center rounded-full bg-[#c44536] px-[12px] py-[6px] text-[13px] font-semibold">
              Only {model.availableCount} left
            </span>
          )}
          {features.length > 0 ? (
            <FeatureRow features={features} />
          ) : (
            <FeatureRow features={specChips(model).map((c) => ({ icon: c.icon === Route ? "range" : c.icon === Gauge ? "speed" : "battery", label: c.label }))} />
          )}
          </div>
        </div>

        <div className="flex flex-col gap-[22px] px-[20px] py-[24px] md:px-[36px] md:py-[32px]">
          {isSubscription ? (
            model.isAvailable &&
            schedule && (
              <div className="flex flex-col gap-[10px]">
                <h3 className="m-0 text-[17px] font-bold text-[#1c1a22]">Your subscription</h3>
                <div className="flex items-baseline justify-between gap-[12px] rounded-[12px] border border-[#e3e0e8] px-[16px] py-[14px]">
                  <span className="text-[15px] text-[#3d3846]">
                    {plural(schedule.units, UNIT_WORD[planType])} · billed {{ daily: "daily", weekly: "weekly", monthly: "monthly" }[planType]}
                  </span>
                  <span className="whitespace-nowrap text-[16px] font-bold tabular-nums text-[#1c1a22]">
                    ₹{inr(cyclePrice(planType))} a {UNIT_WORD[planType]}
                  </span>
                </div>
                {cycleChanged && cycleChanged.to === planType && (
                  <p role="status" className="m-0 rounded-[10px] bg-[#eef7f1] px-[14px] py-[10px] text-[14px] text-[#1f5f3a]">
                    Billing changed from {{ daily: "daily", weekly: "weekly", monthly: "monthly" }[cycleChanged.from]} to {{ daily: "daily", weekly: "weekly", monthly: "monthly" }[cycleChanged.to]}. Your new bills are below.
                  </p>
                )}

                <div className="rounded-[12px] border border-[#e3e0e8] px-[16px] py-[14px]">
                  <p className="m-0 text-[14px] font-bold text-[#1c1a22]">When you'll pay</p>
                  <ol className="m-0 mt-[12px] flex list-none flex-col gap-[12px] p-0 text-[14px] text-[#3d3846]">
                    <li className="flex items-start gap-[10px]">
                      <span aria-hidden="true" className="mt-[5px] size-[9px] shrink-0 rounded-full bg-[#c44536]" />
                      <span className="flex-1">
                        <span className="block font-semibold text-[#1c1a22]">First bill, at checkout</span>
                        Covers {fmt(new Date(pickup.date))} to {fmt(schedule.next || schedule.end)}
                      </span>
                      <span className="font-bold tabular-nums text-[#1c1a22]">₹{inr(cyclePrice(planType))}</span>
                    </li>
                    {schedule.next && (
                      <li className="flex items-start gap-[10px]">
                        <span aria-hidden="true" className="mt-[5px] size-[9px] shrink-0 rounded-full border-2 border-[#c44536]" />
                        <span className="flex-1">
                          <span className="block font-semibold text-[#1c1a22]">Then every {UNIT_WORD[planType]}</span>
                          {fmt(schedule.next)}
                          {schedule.units > 2 ? ` to ${fmt(schedule.last)}` : ""} · {plural(schedule.units - 1, "more bill")}
                        </span>
                        <span className="font-bold tabular-nums text-[#1c1a22]">₹{inr(cyclePrice(planType))}</span>
                      </li>
                    )}
                    <li className="flex items-start gap-[10px]">
                      <span aria-hidden="true" className="mt-[5px] size-[9px] shrink-0 rounded-full bg-[#b9b5c2]" />
                      <span className="flex-1">
                        <span className="block font-semibold text-[#1c1a22]">Plan ends {fmt(schedule.end)}</span>
                        {plural(schedule.units, "bill")} in total
                      </span>
                      <span className="font-bold tabular-nums text-[#1c1a22]">₹{inr(cycleTotal(planType))}</span>
                    </li>
                  </ol>
                </div>

                {cycles.length > 1 && (
                  <div className="flex flex-wrap items-center justify-between gap-[10px]">
                    <span className="text-[14px] font-semibold text-[#3d3846]">Pay every</span>
                    <div role="radiogroup" aria-label="Billing cycle" className="inline-flex rounded-full bg-[#f2f1f4] p-[4px]">
                      {cycles.map((pt) => {
                        const on = pt === planType;
                        return (
                          <button
                            key={pt}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => setPendingCycle(on ? null : pt)}
                            className={`min-h-[36px] rounded-full px-[16px] text-[14px] font-bold capitalize transition-colors ${
                              on
                                ? "bg-white text-[#1c1a22] shadow-[0_1px_3px_rgba(0,0,0,0.15)]"
                                : pendingCycle === pt
                                ? "text-[#c44536]"
                                : "text-[#5a5562] hover:text-[#1c1a22]"
                            }`}
                          >
                            {UNIT_WORD[pt]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {pendingCycle && pendingCycle !== planType && (
                  <div role="alertdialog" aria-label="Change billing cycle" className="rounded-[12px] bg-[#fdf0ec] px-[16px] py-[14px]">
                    <p className="m-0 text-[15px] font-bold text-[#1c1a22]">Switch to {{ daily: "daily", weekly: "weekly", monthly: "monthly" }[pendingCycle]} billing?</p>
                    <p className="m-0 mt-[4px] text-[14px] leading-[1.5] text-[#5a5562]">{switchNote(pendingCycle)}</p>
                    <div className="mt-[12px] flex flex-wrap gap-[10px]">
                      <button
                        type="button"
                        onClick={() => confirmCycle(pendingCycle)}
                        className="min-h-[44px] rounded-[10px] bg-[#c44536] px-[16px] text-[15px] font-bold text-white transition-colors hover:bg-[#a8392b]"
                      >
                        Switch to {{ daily: "daily", weekly: "weekly", monthly: "monthly" }[pendingCycle]}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingCycle(null)}
                        className="min-h-[44px] rounded-[10px] px-[12px] text-[15px] font-bold text-[#1c1a22] underline underline-offset-4"
                      >
                        Keep {{ daily: "daily", weekly: "weekly", monthly: "monthly" }[planType]}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            model.isAvailable && (
              <div className="flex flex-col gap-[10px]">
                <h3 className="m-0 text-[17px] font-bold text-[#1c1a22]">Your rental</h3>
                <div className="flex items-baseline justify-between gap-[12px] rounded-[12px] border border-[#e3e0e8] px-[16px] py-[14px]">
                  <span className="text-[15px] text-[#3d3846]">
                    {pricing.days} {pricing.days === 1 ? "day" : "days"} · {{ daily: "daily", weekly: "weekly", monthly: "monthly" }[planType]} rate
                  </span>
                  <span className="whitespace-nowrap text-[16px] font-bold tabular-nums text-[#1c1a22]">₹{inr(pricing.perUnit)} a day</span>
                </div>
                {extend && (
                  <div className="flex flex-wrap items-center gap-[12px] rounded-[12px] bg-[#fdf0ec] px-[16px] py-[14px]">
                    <span className="min-w-[200px] flex-1">
                      <span className="block text-[15px] font-bold text-[#1c1a22]">{extend.title}</span>
                      <span className="mt-[2px] block text-[14px] text-[#5a5562]">{extend.body}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onPlanChange(extend.plan)}
                      className="min-h-[44px] rounded-[10px] border-2 border-[#c44536] px-[16px] text-[15px] font-bold text-[#c44536] transition-colors hover:bg-[#c44536] hover:text-white"
                    >
                      Extend to {extend.days} days
                    </button>
                  </div>
                )}
              </div>
            )
          )}

          {addOns.length > 0 && model.isAvailable && (
            <div className="flex flex-col gap-[10px]">
              <h3 className="m-0 text-[17px] font-bold text-[#1c1a22]">Add-ons for your shift</h3>
              <ul className="m-0 flex list-none flex-col gap-[10px] p-0">
                {addOns.map((a) => (
                  <AddOnRow
                    key={a.id}
                    addOn={a}
                    on={addOnIds.includes(a.id)}
                    open={detailsId === a.id}
                    onToggle={() => toggleAddOn(a.id)}
                    onDetails={() => setDetailsId((id) => (id === a.id ? null : a.id))}
                  />
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-[14px] bg-[#f4f3f6] p-[18px]">
            <h3 className="m-0 text-[17px] font-bold text-[#1c1a22]">Your booking overview</h3>
            <ul className="m-0 mt-[12px] flex list-none flex-col gap-[10px] p-0 text-[15px] leading-[1.45] text-[#3d3846]">
              {overview.map((line) => (
                <li key={line} className="flex items-start gap-[10px]">
                  <Check className="mt-[3px] size-[16px] shrink-0 text-[#1c1a22]" aria-hidden="true" />
                  {line}
                </li>
              ))}
              {chosenAddOns.map((a) => (
                <li key={a.id} className="flex items-start gap-[10px]">
                  <Check className="mt-[3px] size-[16px] shrink-0 text-[#c44536]" aria-hidden="true" />
                  <span className="flex-1">{a.name}</span>
                  <span className="tabular-nums">₹{inr(addOnCost(a))}</span>
                </li>
              ))}
            </ul>
            {Number(model.b2cDeposit) > 0 && (
              <p className="m-0 mt-[14px] border-t border-[#e1dfe5] pt-[12px] text-[14px] text-[#5a5562]">
                Refundable security deposit of ₹{inr(model.b2cDeposit)}, paid at checkout.
              </p>
            )}
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-[16px] border-t border-[#ecebef] pt-[18px]">
            {model.isAvailable ? (
              <p className="m-0">
                <span className="text-[32px] font-extrabold tabular-nums text-[#1c1a22]">
                  ₹{inr(isSubscription ? cyclePrice(planType) : pricing.total)}
                </span>
                <span className="text-[15px] text-[#5a5562]">
                  {" "}
                  {isSubscription
                    ? `today, then ₹${inr(cyclePrice(planType))} a ${planUnit(planType)}`
                    : `for ${pricing.days} ${pricing.days === 1 ? "day" : "days"}`}
                </span>
                <span className="block text-[13px] text-[#6a6573]">
                  {addOnTotal > 0
                    ? `+ ₹${inr(addOnTotal)} for add-ons, paid at the hub on pickup. Deposit and taxes are added at checkout.`
                    : "Deposit and taxes are added at checkout."}
                </span>
              </p>
            ) : (
              <p className="m-0 text-[15px] font-semibold text-[#1c1a22]">Not available for your dates. Try different dates.</p>
            )}
            <button
              type="button"
              disabled={!model.isAvailable || busy}
              onClick={handleContinue}
              className="flex min-h-[56px] min-w-[220px] flex-1 items-center justify-center rounded-[12px] bg-[#c44536] px-[24px] text-[16px] font-bold text-white transition-colors hover:bg-[#a8392b] disabled:cursor-not-allowed disabled:bg-[#d9d4d2] sm:flex-none"
            >
              {busy ? "Getting your price…" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
