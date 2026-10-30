import SearchBar from "../../components/SearchBar";
import { franchiseHome as c } from "../../config/franchiseHome";

// Jaipur photo hero with the live search. The search card sits inside the hero
// (half over its bottom padding) so it never covers the band below.
const HomeHero = () => (
  <section
    id="hero"
    className="home-hero-bg relative px-[clamp(16px,5vw,80px)] pb-[56px] pt-[124px] text-white md:pb-[72px] md:pt-[144px]"
  >
    <div className="mx-auto max-w-[1180px]">
      <h1 className="font-display m-0 max-w-[900px] text-[clamp(44px,6vw,88px)] leading-[0.95]">
        {c.headline}
      </h1>
      <p className="m-0 mt-4 text-[17px] text-[#e1dde8]">
        {c.franchiseName}, a {c.brand} rental hub in {c.city}
      </p>
    </div>
    <div id="hero-search" className="relative mx-auto mt-8 max-w-[1180px] md:mt-12">
      <SearchBar singleHub />
    </div>
  </section>
);

export default HomeHero;
