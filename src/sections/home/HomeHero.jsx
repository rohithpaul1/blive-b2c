import SearchBar from "../../components/SearchBar";
import { franchiseHome as c } from "../../config/franchiseHome";

// City photo hero with the live search. The search card sits inside the hero
// (half over its bottom padding) so it never covers the band below.
const HomeHero = () => (
  <section
    id="hero"
    className="home-hero-bg relative px-[clamp(16px,5vw,80px)] pb-[56px] pt-[124px] text-white md:pb-[72px] md:pt-[144px]"
  >
    <div className="mx-auto max-w-[1180px]">
      {c.brandMode === "cobrand" && (
        // The city lives here once the header carries both logos.
        <p className="m-0 mb-[14px] flex items-center gap-[10px] text-[13px] font-bold uppercase tracking-[0.2em] text-white/85">
          <span aria-hidden="true" className="h-[2px] w-[28px] bg-[var(--accent)]" />
          {c.city}
          {c.hubArea ? ` · ${c.hubArea}` : ""}
        </p>
      )}
      <h1 className="font-display m-0 max-w-[900px] text-[clamp(44px,6vw,88px)] leading-[0.95]">
        {c.headline}
      </h1>
      <p className="m-0 mt-4 text-[17px] text-[#e1dde8]">
        {c.brandMode === "cobrand"
          ? `${c.franchiseName} and ${c.brand}, renting electric scooters in ${c.city}.`
          : `${c.franchiseName}, a ${c.brand} rental hub in ${c.city}`}
      </p>
    </div>
    <div id="hero-search" className="relative mx-auto mt-8 max-w-[1180px] md:mt-12">
      <SearchBar singleHub />
    </div>
  </section>
);

export default HomeHero;
