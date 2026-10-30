import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { BatteryCharging, Bluetooth, Gauge, Headphones, Package, Route, SlidersHorizontal, Undo2, User, Weight, Wrench, Zap } from "lucide-react";
import useRentNow from "../hooks/useRentNow";
import { planUnit } from "../utils/subscription";

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

export default function ModelPicker({ models, selectedPlanType, onPlanChange, pickup, dropoff, cutout = null, features = [] }) {
  const { rentNow, pricingFor, isSubscription, rentalDays } = useRentNow();
  const [modelId, setModelId] = useState(() => (models.find((m) => m.isAvailable) || models[0])?.id);
  const [busy, setBusy] = useState(false);

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
  // Selected plan first, then the nudges.
  const orderedPlans = [planType, ...planTypes.filter((pt) => pt !== planType)];

  // Per-day price of each plan, for savings and the best-value badge.
  const perDay = useMemo(() => {
    const out = {};
    planTypes.forEach((pt) => {
      out[pt] = (Number(model.plans[pt].price) || 0) / UNIT_DAYS[pt];
    });
    return out;
  }, [model, planTypes]);
  const bestPlan = planTypes.length > 1 ? planTypes.reduce((a, b) => (perDay[b] < perDay[a] ? b : a)) : null;

  if (!model) return null;

  const art = cutout || model.cutoutUrl || model.imgUrl;
  // Cheapest available model for the chosen plan gets the Best value tag.
  const cheapestId = models
    .filter((m) => m.isAvailable && m.plans[planType])
    .reduce((best, m) => (!best || Number(m.plans[planType].price) < Number(best.plans[planType].price) ? m : best), null)?.id;
  const selectedPlan = model.plans[planType];
  const pricing = pricingFor(selectedPlan?.price, planType);
  const single = models.length === 1;

  const planName = (pt) =>
    isSubscription
      ? { daily: "Billed daily", weekly: "Billed weekly", monthly: "Billed monthly" }[pt]
      : { daily: "Daily", weekly: "Weekly", monthly: "Monthly" }[pt];
  const planNote = (pt) => {
    const save = perDay.daily && pt !== "daily" ? Math.round((1 - perDay[pt] / perDay.daily) * 100) : 0;
    const base = isSubscription
      ? `Renews every ${planUnit(pt)} until you stop`
      : { daily: "For a few days", weekly: "7 days", monthly: "30 days" }[pt];
    return save > 0 ? `${base} · save ${save}%` : base;
  };

  const tripLine =
    pickup?.date &&
    (isSubscription
      ? `Starts ${format(new Date(pickup.date), "d MMM")}, ${clock(pickup.time)}`
      : `${format(new Date(pickup.date), "d MMM")}, ${clock(pickup.time)} → ${
          dropoff?.date ? `${format(new Date(dropoff.date), "d MMM")}, ${clock(dropoff.time)}` : "Add return"
        }`);

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
            {single ? "Pick how you ride" : "Which scooter do you want to ride?"}
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

      <div className="grid overflow-hidden rounded-[24px] border border-[#e3e0e8] bg-white lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="sixt-stage flex min-h-[480px] flex-col px-[20px] pb-[26px] pt-[30px] text-white md:px-[32px] md:pt-[40px]">
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

        <div className="flex flex-col gap-[14px] px-[20px] py-[24px] md:px-[36px] md:py-[32px]">
          <h3 className="m-0 text-[17px] font-bold text-[#1c1a22]">{isSubscription ? "Billing" : "Rental plan"}</h3>
          <div role="radiogroup" aria-label="Rental plan" className="flex flex-col gap-[10px]">
            {orderedPlans.map((pt) => {
              const on = pt === planType;
              const unit = isSubscription ? planUnit(pt) : "day";
              const rate = isSubscription ? Number(model.plans[pt].price) || 0 : perDay[pt];
              const delta = isSubscription ? 0 : Math.round(perDay[pt] - perDay[planType]);
              const longer = UNIT_DAYS[pt] > UNIT_DAYS[planType];
              // Nudge copy: longer plans sell the lower daily rate, shorter ones stay neutral.
              const nudge = on
                ? isSubscription
                  ? planNote(pt)
                  : `Fits your ${pricing.days}-day trip`
                : !isSubscription && longer && delta < 0
                ? `Ride ${UNIT_DAYS[pt]} days and pay ₹${inr(rate)} a day`
                : planNote(pt);
              return (
                <button
                  key={pt}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => !on && onPlanChange(pt)}
                  className={`flex min-h-[72px] w-full items-center gap-[14px] rounded-[12px] px-[16px] py-[12px] text-left transition-colors ${
                    on ? "border-2 border-[#1c1a22] bg-white" : "my-px border border-[#d9d9d9] bg-white hover:border-[#9a96a0]"
                  }`}
                >
                  <span className={`size-[20px] shrink-0 rounded-full ${on ? "border-[6px] border-[#1c1a22]" : "border-2 border-[#b9b5c2]"}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-bold text-[#1c1a22]">
                      {planName(pt)}
                      {on && <span className="ml-[8px] text-[13px] font-semibold text-[#5a5562]">₹{inr(rate)} / {unit}</span>}
                    </span>
                    <span className="mt-[2px] block text-[14px] text-[#5a5562]">{nudge}</span>
                  </span>
                  {!on && pt === bestPlan && (
                    <span className="hidden rounded-full bg-[#c44536] px-[10px] py-[4px] text-[12px] font-bold text-white sm:inline">
                      {longer ? "Save more" : "Best value"}
                    </span>
                  )}
                  <span className="whitespace-nowrap text-[16px] font-bold tabular-nums text-[#1c1a22]">
                    {on
                      ? "Included"
                      : isSubscription
                      ? `₹${inr(rate)} / ${unit}`
                      : delta === 0
                      ? "Same price"
                      : `${delta > 0 ? "+" : "−"} ₹${inr(Math.abs(delta))} / day`}
                  </span>
                </button>
              );
            })}
          </div>
          {!isSubscription && (
            <p className="m-0 text-[13px] text-[#6a6573]">Your plan follows your dates. Switching plans moves your return date to match.</p>
          )}

          <h3 className="m-0 mt-[6px] text-[17px] font-bold text-[#1c1a22]">Included</h3>
          <ul className="m-0 grid list-none grid-cols-1 gap-[10px] rounded-[12px] border border-[#e3e0e8] p-[16px] text-[15px] text-[#3d3846] sm:grid-cols-2">
            {model.perDayKmLimit > 0 && (
              <li className="flex items-center gap-[8px]">
                <Route className="size-[17px] shrink-0 text-[#1c1a22]" aria-hidden="true" />
                {model.perDayKmLimit} km a day{model.perKmCharge ? `, ₹${inr(model.perKmCharge)} per extra km` : ""}
              </li>
            )}
            <li className="flex items-center gap-[8px]">
              <Wrench className="size-[17px] shrink-0 text-[#1c1a22]" aria-hidden="true" />
              Maintenance
            </li>
            <li className="flex items-center gap-[8px]">
              <Headphones className="size-[17px] shrink-0 text-[#1c1a22]" aria-hidden="true" />
              24/7 support
            </li>
          </ul>
          {Number(model.b2cDeposit) > 0 && (
            <p className="m-0 text-[14px] text-[#5a5562]">
              Refundable security deposit of ₹{inr(model.b2cDeposit)}, paid at checkout.
            </p>
          )}

          <div className="mt-auto flex flex-wrap items-center justify-between gap-[16px] border-t border-[#ecebef] pt-[18px]">
            {model.isAvailable ? (
              <p className="m-0">
                <span className="text-[32px] font-extrabold tabular-nums text-[#1c1a22]">₹{inr(pricing.total)}</span>
                <span className="text-[15px] text-[#5a5562]">
                  {" "}
                  {isSubscription
                    ? `for ${pricing.units} ${planUnit(planType)}${pricing.units === 1 ? "" : "s"} planned`
                    : `for ${pricing.days} ${pricing.days === 1 ? "day" : "days"}`}
                </span>
                <span className="block text-[13px] text-[#6a6573]">Deposit and taxes are added at checkout.</span>
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
