import SearchBar from "../../components/SearchBar";
import { franchiseHome as c } from "../../config/franchiseHome";

// Jaipur photo hero with the live search. The search card sits inside the hero
// (half over its bottom padding) so it never covers the band below.
const HomeHero = () => (
  <section
    id="hero"
    className="home-hero-bg relative px-[clamp(16px,5vw,80px)] pb-[72px] pt-[124px] text-white md:pb-[96px] md:pt-[144px]"
  >
    <div className="mx-auto max-w-[1180px]">
      <p className="m-0 text-[14px] font-bold text-[#f4b9a8]">
        {c.brand} {c.franchiseName} · {c.city}
      </p>
      <h1 className="font-display m-0 mt-3 max-w-[900px] text-balance text-[clamp(44px,6vw,88px)] leading-[0.95]">
        {c.headline}
      </h1>
      <div className="mt-6 flex flex-wrap gap-x-10 gap-y-3">
        {c.stats.map((s) => (
          <p key={s.label} className="m-0 text-[15px] text-[#d6d2df]">
            <strong className="text-[22px] text-white">{s.value}</strong> {s.label}
          </p>
        ))}
      </div>
    </div>
    <div id="hero-search" className="relative mt-10 h-[40px] md:mt-12 md:h-[56px]">
      <SearchBar />
    </div>
  </section>
);

export default HomeHero;
