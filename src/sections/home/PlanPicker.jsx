import { useState } from "react";
import { franchiseHome as c } from "../../config/franchiseHome";
import { scrollToSearch } from "./scrollToSearch";

// Clickable plan picker: shows what each plan costs before the rider picks dates.
const PlanPicker = () => {
  const [planId, setPlanId] = useState("daily");
  const current = c.plans.find((p) => p.id === planId) || c.plans[0];

  return (
    <section id="book" className="flex flex-col items-center gap-8 px-[clamp(16px,5vw,80px)] py-[64px] md:py-[88px]">
      <h2 className="font-display m-0 text-center text-[clamp(40px,5vw,60px)] leading-[0.95] text-[#0f0d16]">
        Pick a plan, see the price
      </h2>
      <div className="flex w-full max-w-[1200px] flex-col overflow-hidden rounded-[24px] border border-[#e3e0e8] bg-white text-[#1c1a22] lg:flex-row">
        <div className="home-spot flex shrink-0 flex-col items-center px-6 pb-8 pt-10 text-white lg:w-[46%] lg:px-8">
          <h3 className="font-display m-0 text-[36px] leading-none">Lectrix NDuro</h3>
          <p className="m-0 mt-2 text-center text-[15px] text-[#d6d2df]">NDuro 2.0 electric scooter · Maintenance included</p>
          <img
            src="/images/home/nduro-storage.webp"
            alt="Lectrix NDuro with its under-seat storage open"
            loading="lazy"
            className="mt-6 h-[220px] w-full rounded-[18px] object-cover lg:h-[340px]"
          />
          <div className="mt-6 flex flex-wrap justify-center gap-x-7 gap-y-2 text-[14px]">
            <span>90 km range</span>
            <span>65 km/h top speed</span>
            <span>42 L storage</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3.5 p-6 lg:px-9 lg:py-8">
          <h3 className="m-0 text-[16px] font-bold">Rental plan</h3>
          <div role="radiogroup" aria-label="Rental plan" className="flex flex-col gap-2.5">
            {c.plans.map((p) => {
              const on = p.id === planId;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setPlanId(p.id)}
                  className={`flex min-h-[68px] w-full cursor-pointer items-center gap-3.5 rounded-[14px] bg-white px-4 py-3 text-left ${
                    on ? "border-2 border-[#1c1a22]" : "my-px border border-[#dedce1]"
                  }`}
                >
                  <span
                    className={`size-[18px] shrink-0 rounded-full ${on ? "border-[6px] border-[#1c1a22]" : "border-2 border-[#b9b5c2]"}`}
                  />
                  <span className="flex-1">
                    <span className="block text-[16px] font-bold">{p.id === "monthly" ? "Monthly subscription" : p.name}</span>
                    <span className="mt-0.5 block text-[13px] text-[#6a6573]">{p.pickerNote}</span>
                  </span>
                  {p.best && (
                    <span className="hidden rounded-full bg-[#c44536] px-2.5 py-1 text-[12px] font-bold text-white sm:inline">
                      Best value
                    </span>
                  )}
                  <span className="whitespace-nowrap text-[16px] font-bold tabular-nums">{p.perDay} / day</span>
                </button>
              );
            })}
          </div>

          <h3 className="m-0 mt-2 text-[16px] font-bold">Included in every plan</h3>
          <div className="grid grid-cols-1 gap-x-4 gap-y-2.5 rounded-[14px] border border-[#e3e0e8] px-4 py-3.5 text-[14px] text-[#3d3846] sm:grid-cols-2">
            <span>✓ {c.kmPerDay} km a day, ₹3 per extra km</span>
            <span>✓ Maintenance</span>
            <span>✓ 24/7 support</span>
          </div>
          <p className="m-0 text-[13px] text-[#6a6573]">
            Refundable security deposit of {c.deposit}, paid at checkout and returned within 5 working days.
          </p>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-[#ecebef] pt-[18px]">
            <p className="m-0">
              <span className="text-[30px] font-black tabular-nums">{current.total}</span>
              <span className="text-[14px] text-[#6a6573]"> {current.totalNote}</span>
            </p>
            <a
              href="#hero-search"
              onClick={scrollToSearch}
              className="flex min-h-[54px] min-w-[200px] flex-1 items-center justify-center rounded-[14px] bg-[#c44536] text-[16px] font-bold text-white hover:bg-[#a8392b] hover:text-white sm:flex-none"
            >
              Pick dates
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlanPicker;
