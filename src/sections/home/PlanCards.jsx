import { franchiseHome as c } from "../../config/franchiseHome";
import { scrollToSearch } from "./scrollToSearch";

export const SubscribeBand = () => (
  <section className="flex flex-col items-center justify-center bg-[#c44536] px-[clamp(16px,5vw,80px)] py-[64px] text-center text-white md:py-[80px]">
    <h2 className="font-display m-0 max-w-[1000px] text-[clamp(40px,6vw,84px)] leading-[0.95]">
      Subscribe and save 50%
    </h2>
    <p className="m-0 mt-[14px] max-w-[720px] text-[17px] font-semibold text-[#fde8e1]">
      Your daily scooter for ₹150 a day, billed monthly. Maintenance included.
    </p>
  </section>
);

const PlanCard = ({ plan }) => (
  <article
    className={`home-spot relative flex flex-col overflow-hidden rounded-[20px] text-white ${
      plan.best ? "shadow-[0_0_0_3px_#c44536]" : ""
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
      <h3 className={`font-display m-0 text-[36px] leading-none ${plan.best ? "pr-[104px]" : ""}`}>{plan.name}</h3>
      <p className="m-0 mt-0.5 text-[14px] text-[#d6d2df]">
        {c.model.name} · {plan.sub}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {plan.tags.map((t) => (
          <span
            key={t.label}
            className={`rounded-full px-2.5 py-1 text-[12px] font-bold ${t.accent ? "bg-[#c44536]" : "bg-white/[0.12]"}`}
          >
            {t.label}
          </span>
        ))}
      </div>
    </div>
    <img src={plan.image} alt={plan.imageAlt} loading="lazy" className="my-[18px] h-[220px] w-full object-cover" />
    <div className="px-6 pb-5">
      <p className="m-0 text-[13px] text-[#d6d2df]">✓ {c.kmPerDay} km a day included</p>
      <p className="m-0 mt-1.5">
        <span className="text-[30px] font-black tabular-nums">{plan.perDay}</span>
        <span className="text-[14px] font-bold"> /day</span>
        <span className="text-[13px] text-[#b8b3c4]">
          {"  "}
          {plan.total} {plan.totalNote}
        </span>
      </p>
    </div>
    <a
      href="#hero-search"
      onClick={scrollToSearch}
      className={`mt-auto flex justify-center p-[14px] text-[14px] font-bold text-white hover:text-white ${
        plan.best ? "bg-[#c44536] hover:bg-[#a8392b]" : "bg-[#2a2538] hover:bg-[#373047]"
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
