import { franchiseHome as c } from "../../config/franchiseHome";
import { scrollToSearch } from "./scrollToSearch";

export const ScooterSpotlight = () => (
  <section id="scooter" className="bg-[#0f0d16] px-[clamp(16px,5vw,80px)] py-[64px] text-white md:py-[88px]">
    <div className="mx-auto max-w-[1180px]">
      <h2 className="font-display m-0 text-[clamp(40px,5vw,60px)] leading-[0.95]">{c.model.name}</h2>
      <div className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
        {c.model.specs.map((s) => (
          <div key={s.label}>
            <p className="font-display m-0 text-[clamp(34px,4vw,44px)] normal-case leading-none tabular-nums">{s.value}</p>
            <p className="m-0 text-[14px] text-[#b8b3c4]">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {c.model.gallery.map((g) => (
          <figure key={g.src} className="relative m-0 overflow-hidden rounded-[18px]">
            <img src={g.src} alt={g.alt} loading="lazy" className="block aspect-[3/2] w-full object-cover" />
            <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 pb-3 pt-8 text-[14px] font-bold md:text-[15px]">
              {g.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  </section>
);

export const BenefitTiles = () => (
  <section className="px-[clamp(16px,5vw,80px)] py-[64px] md:py-[88px]">
    <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-5 md:grid-cols-2">
      <article className="home-tile-city flex min-h-[360px] flex-col justify-end gap-3 rounded-[20px] p-8 text-white md:min-h-[420px]">
        <span className="font-display self-start -skew-x-[8deg] border-2 border-white px-3 py-1.5 text-center text-[22px] leading-[0.95]">
          Save
          <br />
          {c.monthlySaving}/month
        </span>
        <h3 className="font-display m-0 text-[40px] leading-none">No petrol. No queues.</h3>
        <p className="m-0 text-[16px] text-[#e1dde8]">No fuel stops and no fuel bills. Book, ride and return.</p>
      </article>
      <article className="home-tile-bike flex min-h-[360px] flex-col justify-end gap-3 rounded-[20px] p-8 text-white md:min-h-[420px]">
        <h3 className="font-display m-0 text-[40px] leading-none">Quiet, smooth, zero emissions.</h3>
        <p className="m-0 text-[16px] text-[#e1dde8]">No gears and no engine noise. Easy in stop-and-go traffic.</p>
        <a
          href="#plans"
          className="inline-flex min-h-10 items-center self-start rounded-full border border-white px-[18px] text-[13px] font-bold text-white hover:bg-white hover:text-[#0f0d16]"
        >
          See plans
        </a>
      </article>
    </div>
  </section>
);

export const HomeSteps = () => (
  <section className="bg-[#f1f0f4] px-[clamp(16px,5vw,80px)] py-[64px] md:py-[88px]">
    <div className="mx-auto max-w-[1180px]">
      <h2 className="font-display m-0 text-[clamp(40px,5vw,60px)] leading-[0.95] text-[#0f0d16]">
        How {c.brand} works
      </h2>
      <ol className="m-0 mt-9 grid list-none grid-cols-1 gap-3.5 p-0 sm:grid-cols-2 lg:grid-cols-5">
        {c.steps.map((s, i) => (
          <li key={s.title} className="flex flex-col rounded-[18px] bg-white p-[22px]">
            <span className="font-display block text-[44px] leading-none tabular-nums text-[#c44536]">{String(i + 1).padStart(2, "0")}</span>
            <p className="m-0 mt-[12px] text-[17px] font-bold leading-snug text-[#1c1a22]">{s.title}</p>
            <p className="m-0 mt-[6px] text-[15px] leading-normal text-[#5a5562]">{s.body}</p>
          </li>
        ))}
      </ol>
      <a
        href="#hero-search"
        onClick={scrollToSearch}
        className="mt-8 inline-flex min-h-12 items-center rounded-[14px] bg-[#c44536] px-6 text-[16px] font-bold text-white hover:bg-[#a8392b] hover:text-white"
      >
        Check dates and price
      </a>
    </div>
  </section>
);
