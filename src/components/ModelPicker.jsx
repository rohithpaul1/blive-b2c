import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Gauge, Headphones, Info, Route, Wrench, Zap } from "lucide-react";
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
  e.currentTarget.src = "/images/Scooter.png";
};

const Spec = (props) => {
  const { icon: Glyph, children } = props;
  return (
    <span className="inline-flex items-center gap-[6px] rounded-full bg-white/[0.12] px-[12px] py-[6px] text-[13px] font-semibold text-white">
      <Glyph className="size-[15px]" aria-hidden="true" />
      {children}
    </span>
  );
};

// "Lectrix · Electric scooter", without repeating a brand the model name already carries.
const byline = (model) =>
  String(model.vehicleName || "").toLowerCase().startsWith(String(model.brandName || "").toLowerCase())
    ? "Electric scooter"
    : `${model.brandName} · Electric scooter`;

const specChips = (model) =>
  [
    model.range > 0 && { icon: Route, label: `${model.range} km range` },
    model.topSpeed > 0 && { icon: Gauge, label: `${model.topSpeed} km/h` },
    model.perDayKmLimit > 0 && { icon: Zap, label: `${model.perDayKmLimit} km a day` },
  ].filter(Boolean);

function ModelCard({ model, planType, selected, onSelect, pricingFor }) {
  const plan = model.plans[planType] || model.plans[Object.keys(model.plans)[0]];
  const pricing = plan ? pricingFor(plan.price, planType) : null;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`home-spot relative flex min-h-[420px] flex-col overflow-hidden rounded-[20px] p-[22px] text-left text-white transition-shadow ${
        selected ? "shadow-[0_0_0_3px_#c44536]" : "hover:shadow-[0_0_0_2px_rgba(255,255,255,0.25)]"
      } ${model.isAvailable ? "" : "opacity-60"}`}
    >
      <span className="font-display text-[30px] leading-none">{model.vehicleName}</span>
      <span className="mt-[6px] text-[14px] text-[#d6d2df]">{byline(model)}</span>
      <span className="mt-[14px] flex flex-wrap gap-[6px]">
        {specChips(model).map((s) => (
          <Spec key={s.label} icon={s.icon}>{s.label}</Spec>
        ))}
      </span>
      <img src={model.imgUrl} alt="" loading="lazy" onError={fallbackImage} className="my-[18px] h-[180px] w-full rounded-[14px] object-cover" />
      <span className="mt-auto text-[14px] text-[#d6d2df]">
        {model.isAvailable ? (
          pricing && (
            <>
              <b className="text-[28px] font-extrabold tabular-nums text-white">₹{inr(pricing.perUnit)}</b>
              <b className="text-[14px] text-white"> /{pricing.unit}</b>
              {pricing.days ? <span className="tabular-nums">  ₹{inr(pricing.total)} total</span> : null}
            </>
          )
        ) : (
          "Not available for your dates"
        )}
      </span>
    </button>
  );
}

export default function ModelPicker({ models, selectedPlanType, onPlanChange, pickup, dropoff, gallery = [] }) {
  const { rentNow, pricingFor, isSubscription } = useRentNow();
  const [modelId, setModelId] = useState(() => (models.find((m) => m.isAvailable) || models[0])?.id);
  const [imageIndex, setImageIndex] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!models.some((m) => m.id === modelId)) setModelId((models.find((m) => m.isAvailable) || models[0])?.id);
  }, [models, modelId]);

  const model = models.find((m) => m.id === modelId) || models[0];
  const planTypes = PLAN_ORDER.filter((pt) => model?.plans[pt]);
  const planType = planTypes.includes(selectedPlanType) ? selectedPlanType : planTypes[0];

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

  const images = gallery.length ? gallery : [{ src: model.imgUrl, alt: model.vehicleName }];
  const current = images[Math.min(imageIndex, images.length - 1)];
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
        <div className="grid grid-cols-1 gap-[20px] sm:grid-cols-2 xl:grid-cols-3">
          {models.map((m) => (
            <ModelCard
              key={m.id}
              model={m}
              planType={planType}
              selected={m.id === model.id}
              onSelect={() => {
                setModelId(m.id);
                setImageIndex(0);
              }}
              pricingFor={pricingFor}
            />
          ))}
        </div>
      )}

      <div className="grid overflow-hidden rounded-[24px] border border-[#e3e0e8] bg-white lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="home-spot flex flex-col px-[20px] pb-[24px] pt-[28px] text-white md:px-[32px] md:pt-[36px]">
          <h2 className="font-display m-0 text-center text-[clamp(34px,4vw,48px)] leading-none">{model.vehicleName}</h2>
          <p className="m-0 mt-[8px] text-center text-[15px] text-[#d6d2df]">
            {byline(model)} · Maintenance included
          </p>
          <img
            src={current.src}
            alt={current.alt || model.vehicleName}
            onError={fallbackImage}
            className="mt-[22px] aspect-[3/2] w-full rounded-[18px] object-cover"
          />
          {images.length > 1 && (
            <div className="mt-[12px] grid grid-cols-6 gap-[8px]" role="group" aria-label="Photos">
              {images.map((img, i) => (
                <button
                  key={img.src}
                  type="button"
                  aria-label={img.caption || img.alt}
                  aria-pressed={i === imageIndex}
                  onClick={() => setImageIndex(i)}
                  className={`overflow-hidden rounded-[10px] ${i === imageIndex ? "ring-2 ring-white" : "opacity-60 hover:opacity-100"}`}
                >
                  <img src={img.src} alt="" loading="lazy" className="block aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          {current.caption && <p className="m-0 mt-[10px] text-center text-[14px] font-semibold">{current.caption}</p>}
          <div className="mt-auto flex flex-wrap justify-center gap-[8px] pt-[22px]">
            {specChips(model).map((s) => (
              <Spec key={s.label} icon={s.icon}>{s.label}</Spec>
            ))}
            {model.isAvailable && model.availableCount <= 2 && <Spec icon={Info}>Only {model.availableCount} left</Spec>}
          </div>
        </div>

        <div className="flex flex-col gap-[14px] px-[20px] py-[24px] md:px-[36px] md:py-[32px]">
          <h3 className="m-0 text-[17px] font-bold text-[#1c1a22]">{isSubscription ? "Billing" : "Rental plan"}</h3>
          <div role="radiogroup" aria-label="Rental plan" className="flex flex-col gap-[10px]">
            {planTypes.map((pt) => {
              const on = pt === planType;
              return (
                <button
                  key={pt}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => onPlanChange(pt)}
                  className={`flex min-h-[72px] w-full items-center gap-[14px] rounded-[12px] bg-white px-[16px] py-[12px] text-left transition-colors ${
                    on ? "border-2 border-[#1c1a22]" : "my-px border border-[#d9d9d9] hover:border-[#9a96a0]"
                  }`}
                >
                  <span className={`size-[20px] shrink-0 rounded-full ${on ? "border-[6px] border-[#1c1a22]" : "border-2 border-[#b9b5c2]"}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-bold text-[#1c1a22]">{planName(pt)}</span>
                    <span className="mt-[2px] block text-[14px] text-[#5a5562]">{planNote(pt)}</span>
                  </span>
                  {pt === bestPlan && (
                    <span className="hidden rounded-full bg-[#c44536] px-[10px] py-[4px] text-[12px] font-bold text-white sm:inline">Best value</span>
                  )}
                  <span className="whitespace-nowrap text-[16px] font-bold tabular-nums text-[#1c1a22]">
                    ₹{inr(isSubscription ? model.plans[pt].price : perDay[pt])} / {isSubscription ? planUnit(pt) : "day"}
                  </span>
                </button>
              );
            })}
          </div>
          {!isSubscription && (
            <p className="m-0 text-[13px] text-[#6a6573]">Choosing weekly or monthly sets your return date to match the plan.</p>
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
