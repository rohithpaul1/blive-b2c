import { franchiseHome as c } from "../../config/franchiseHome";
import { scrollToSearch } from "./scrollToSearch";
import { nxtBenefits } from "../../config/benefits";

// One large model shot beside the name and headline specs, then the features as small cards.
export const ScooterSpotlight = () => {
  const shot = c.model.heroShot ?? c.model.cutout;
  const features = c.model.gallery;
  return (
    <section id="scooter" className="bg-[#0f0d16] px-[clamp(16px,5vw,80px)] py-[64px] text-white md:py-[88px]">
      <div className="mx-auto max-w-[1180px]">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 className="font-display m-0 text-[clamp(40px,5vw,60px)] leading-[0.95]">{c.model.name}</h2>
            <div className="mt-6 grid grid-cols-2 gap-x-10 gap-y-5">
              {c.model.specs.map((s) => (
                <div key={s.label}>
                  <p className="font-display m-0 text-[clamp(34px,4vw,44px)] normal-case leading-none tabular-nums">{s.value}</p>
                  <p className="m-0 text-[14px] text-[#b8b3c4]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          {shot && (
            <div className="flex aspect-[4/3] items-end justify-center px-6 pb-4 [background:radial-gradient(closest-side,#3a3550_0%,#0f0d16_100%)]">
              <img src={shot} alt={c.model.name} className="max-h-full w-full object-contain" />
            </div>
          )}
        </div>
        {features.length > 0 && (
          <div
            className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-[repeat(var(--n),minmax(0,1fr))]"
            style={{ "--n": features.length }}
          >
            {features.map((g) =>
              g.fit === "circle" ? (
                <figure key={g.src} className="m-0 flex flex-col items-center overflow-hidden rounded-[16px] bg-[#1c1a26] px-4 pb-4 pt-5">
                  <img src={g.src} alt={g.alt} loading="lazy" className="block aspect-square w-[78%] rounded-full object-contain ring-1 ring-white/15" />
                  <figcaption className="mt-3 text-center text-[13px] font-bold leading-snug text-white">{g.caption}</figcaption>
                </figure>
              ) : (
                <figure key={g.src} className="relative m-0 overflow-hidden rounded-[16px]">
                  <img
                    src={g.src}
                    alt={g.alt}
                    loading="lazy"
                    className={`block aspect-square w-full ${g.fit === "contain" ? "bg-[#f4f3f6] object-contain p-3 pb-9" : "object-cover"}`}
                  />
                  <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8 text-[13px] font-bold leading-snug">
                    {g.caption}
                  </figcaption>
                </figure>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
};

// Benefit cards, evenly in one row, in the "More BLive NXT" card style: centred title, text
// and button on a dark gradient, the picture standing at the foot of the card.
// Text comes from the shared NXT benefits (config/benefits.js); pictures from the franchise.
const benefitPicture = (b) => {
  if (b.photo === "city") return { src: c.heroImage, alt: `${c.city} skyline`, fit: "cover" };
  if (b.photo === "bike") return { src: b.image ?? c.tileImage, alt: c.model.name, fit: b.image ? "contain" : "cover" };
  return { src: b.image ?? c.model.cutout, alt: c.model.name, fit: "contain" };
};

const BenefitCard = ({ b }) => {
  const pic = benefitPicture(b);
  return (
    <article className="flex min-h-[520px] flex-col items-center overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,#0f0d16_0%,#1d1a26_45%,#6c6878_100%)] px-7 pt-12 text-center text-white md:min-h-[560px]">
      <h3 className="font-display m-0 text-[36px] leading-none md:text-[40px]">{b.title}</h3>
      <p className="m-0 mt-4 max-w-[320px] text-[17px] leading-normal text-[#e1dde8]">{b.body}</p>
      {b.photo === "city" && c.monthlySaving && (
        // Sits where the middle card's button does, so the titles line up across the row.
        <span className="mt-6 rounded-full bg-[var(--accent)] px-4 py-2 text-[15px] font-bold">Save {c.monthlySaving}/month</span>
      )}
      {b.icon === "ev" && (
        <a
          href="#plans"
          className="mt-6 inline-flex min-h-12 items-center rounded-full border-2 border-white px-[26px] text-[15px] font-bold text-white hover:bg-white hover:text-[#0f0d16]"
        >
          See plans
        </a>
      )}
      {pic.src && (
        <img
          src={pic.src}
          alt={pic.alt}
          loading="lazy"
          className={
            pic.fit === "contain"
              ? "mt-auto block h-[240px] w-full object-contain object-bottom pb-6 md:h-[260px]"
              : "-mx-7 mt-auto block h-[260px] w-[calc(100%+56px)] max-w-none object-cover [mask-image:linear-gradient(180deg,transparent_0%,#000_35%)] md:h-[290px]"
          }
        />
      )}
    </article>
  );
};

export const BenefitTiles = () => {
  const tiles = (c.benefits ?? nxtBenefits).filter((b) => b.photo);
  return (
    <section className="px-[clamp(16px,5vw,80px)] py-[64px] md:py-[88px]">
      <div
        className="mx-auto grid max-w-[1180px] grid-cols-1 gap-5 md:grid-cols-[repeat(var(--n),minmax(0,1fr))]"
        style={{ "--n": tiles.length }}
      >
        {tiles.map((b) => (
          <BenefitCard key={b.title} b={b} />
        ))}
      </div>
    </section>
  );
};

export const HomeSteps = () => (
  <section className="bg-[#f1f0f4] px-[clamp(16px,5vw,80px)] py-[64px] md:py-[88px]">
    <div className="mx-auto max-w-[1180px]">
      <h2 className="font-display m-0 text-[clamp(40px,5vw,60px)] leading-[0.95] text-[#0f0d16]">
        How {c.brand} works
      </h2>
      <ol className="m-0 mt-9 grid list-none grid-cols-1 gap-3.5 p-0 sm:grid-cols-2 lg:grid-cols-5">
        {c.steps.map((s, i) => (
          <li key={s.title} className="flex flex-col rounded-[18px] bg-white p-[22px]">
            <span className="font-display block text-[44px] leading-none tabular-nums text-[var(--accent)]">{String(i + 1).padStart(2, "0")}</span>
            <p className="m-0 mt-[12px] text-[17px] font-bold leading-snug text-[#1c1a22]">{s.title}</p>
            <p className="m-0 mt-[6px] text-[15px] leading-normal text-[#5a5562]">{s.body}</p>
          </li>
        ))}
      </ol>
      <a
        href="#hero-search"
        onClick={scrollToSearch}
        className="mt-8 inline-flex min-h-12 items-center rounded-[14px] bg-[var(--accent)] px-6 text-[16px] font-bold text-white hover:bg-[var(--accent-hover)] hover:text-white"
      >
        Check dates and price
      </a>
    </div>
  </section>
);
