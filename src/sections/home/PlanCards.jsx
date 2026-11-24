import { franchiseHome as c } from "../../config/franchiseHome";
import { scrollToSearch } from "./scrollToSearch";

export const SubscribeBand = () => (
  <section className="flex flex-col items-center justify-center bg-[var(--accent)] px-[clamp(16px,5vw,80px)] py-[64px] text-center text-white md:py-[80px]">
    <h2 className="font-display m-0 max-w-[1000px] text-[clamp(40px,6vw,84px)] leading-[0.95]">
      Subscribe and save 50%
    </h2>
    <p className="m-0 mt-[14px] max-w-[720px] text-[17px] font-semibold text-[var(--accent-tint-13)]">
      Your daily scooter for {c.subscribePerDay} a day, billed monthly. Maintenance included.
    </p>
  </section>
);

const PlanCard = ({ plan }) => (
  <article
    className={`home-spot relative flex flex-col overflow-hidden rounded-[20px] text-white ${
      plan.best ? "shadow-[0_0_0_3px_var(--accent)]" : ""
    }`}
  >
    {plan.best && (
      <span className="font-display absolute right-[22px] top-[22px] -skew-x-[8deg] border-2 border-white px-2.5 py-1 text-center text-[20px] leading-[0.95] md:text-[24px]">
        Best
        <br />
        value
      </span>
    )}
    <div className="px-6 pt-6">
      <h3 className={`font-display m-0 text-[24px] leading-none tracking-[0.02em] ${plan.best ? "pr-[104px]" : ""}`}>{plan.name}</h3>
      <p className={`m-0 mt-0.5 text-[14px] text-[#d6d2df] ${plan.best ? "pr-[104px]" : ""}`}>
        {c.model.name} · {plan.sub}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {plan.tags.map((t) => (
          <span
            key={t.label}
            className={`rounded-full px-2.5 py-1 text-[12px] font-bold ${t.accent ? "bg-[var(--accent)]" : "bg-white/[0.12]"}`}
          >
            {t.label}
          </span>
        ))}
      </div>
    </div>
    <img
      src={plan.image}
      alt={plan.imageAlt}
      loading="lazy"
      className={`my-[18px] w-full ${plan.imageFit === "contain" ? "h-[280px] object-contain" : "h-[220px] object-cover"}`}
    />
    <div className="px-6 pb-5">
      <p className="m-0 text-[13px] text-[#d6d2df]">✓ {c.kmPerDay} km a day included</p>
      {/* Price leads the card: biggest type on it, total underneath. */}
      <p className="m-0 mt-2 flex items-baseline gap-1.5">
        <span className="font-display text-[56px] normal-case leading-[0.9] tabular-nums">{plan.perDay}</span>
        <span className="text-[16px] font-bold">/day</span>
      </p>
      <p className="m-0 mt-1 text-[14px] text-[#b8b3c4]">
        {plan.total} {plan.totalNote}
      </p>
    </div>
    <a
      href="#hero-search"
      onClick={scrollToSearch}
      className={`mt-auto flex justify-center p-[14px] text-[14px] font-bold text-white hover:text-white ${
        plan.best ? "bg-[var(--accent)] hover:bg-[var(--accent-hover)]" : "bg-[#2a2538] hover:bg-[#373047]"
      }`}
    >
      {plan.cta}
    </a>
  </article>
);

const PlanCards = () => (
  <section id="plans" className="bg-[#f1f0f4] px-[clamp(16px,5vw,80px)] py-[64px] md:py-[88px]">
    <div className="mx-auto max-w-[1180px]">
      <h2 className="font-display m-0 text-[clamp(40px,5vw,60px)] leading-[0.95] text-[#0f0d16]">
        Ride for a day, a week or a month.
      </h2>
      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {c.plans.map((p) => (
          <PlanCard key={p.id} plan={p} />
        ))}
      </div>
    </div>
  </section>
);

export default PlanCards;
