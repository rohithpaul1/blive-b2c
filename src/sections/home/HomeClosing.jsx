import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { franchiseHome as c } from "../../config/franchiseHome";
import TermsAndConditionsModal from "../../components/TermsAndConditionsModal";
import PrivacyPolicyModal from "../../components/PrivacyPolicyModal";

export const RiderQuote = () => (
  <section className="home-tile-bike px-[clamp(16px,5vw,80px)] py-[88px] text-white md:py-[120px]">
    <div className="mx-auto max-w-[1000px] text-center">
      <blockquote className="m-0 text-[clamp(22px,3vw,40px)] font-medium leading-[1.3]">"{c.quote.text}"</blockquote>
      <p className="m-0 mt-6 text-[16px] font-extrabold">
        {c.quote.name} <span className="font-medium text-[#d6d2df]">· {c.quote.meta}</span>
      </p>
    </div>
  </section>
);

const MoreCard = ({ title, body, cta, onClick, href, image, alt }) => (
  <article className="flex min-h-[520px] flex-col items-center overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,#0f0d16_0%,#1d1a26_45%,#6c6878_100%)] px-7 pt-14 text-center text-white md:min-h-[600px]">
    <h3 className="font-display m-0 text-[36px] leading-none md:text-[40px]">{title}</h3>
    <p className="m-0 mt-4 text-[17px] leading-normal text-[#e1dde8]">{body}</p>
    <a
      href={href}
      onClick={onClick}
      className="mt-6 inline-flex min-h-12 items-center rounded-full border-2 border-white px-[26px] text-[15px] font-extrabold text-white hover:bg-white hover:text-[#0f0d16]"
    >
      {cta}
    </a>
    <img
      src={image}
      alt={alt}
      loading="lazy"
      className="-mx-7 mt-auto block h-[260px] w-[calc(100%+56px)] max-w-none object-cover [mask-image:linear-gradient(180deg,transparent_0%,#000_35%)] md:h-[300px]"
    />
  </article>
);

export const MoreBlive = () => {
  const navigate = useNavigate();
  return (
    <section className="bg-[#ecebf0] px-[clamp(16px,5vw,80px)] py-[64px] md:py-[88px]">
      <div className="mx-auto max-w-[1240px]">
        <h2 className="font-display m-0 text-center text-[clamp(44px,6vw,64px)] leading-none text-[#0f0d16]">
          More {c.brand}
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <MoreCard
            title="Subscribe. Ride all month."
            body="Your NDuro for ₹150 a day, billed monthly."
            cta="Learn more"
            href="#plans"
            image="/images/home/nduro-storage.webp"
            alt="Lectrix NDuro under-seat storage"
          />
          <MoreCard
            title={`${c.brand} for business`}
            body="Electric scooters for your delivery and field teams."
            cta="Register now"
            href="/business"
            onClick={(e) => {
              e.preventDefault();
              navigate("/business");
            }}
            image="/images/home/nduro-floor.webp"
            alt="Lectrix NDuro floorboard"
          />
          <MoreCard
            title="Help, day or night"
            body="24/7 support on every ride, wherever you are."
            cta={`Call ${c.supportPhone}`}
            href={c.supportPhoneHref}
            image="/images/home/nduro-mirror.webp"
            alt="Lectrix NDuro handlebar"
          />
        </div>
      </div>
    </section>
  );
};

export const HomeFaq = () => (
  <section id="faq" className="px-[clamp(16px,5vw,80px)] py-[64px] md:py-[88px]">
    <div className="mx-auto flex max-w-[1180px] flex-wrap gap-12">
      <h2 className="font-display m-0 flex-[1_1_300px] text-[clamp(44px,5vw,56px)] leading-[0.95] text-[#0f0d16]">
        Questions riders ask
      </h2>
      <div className="flex-[2_1_560px] border-t border-[#e3e0e8] max-md:basis-full">
        {c.faqs.map((f) => (
          <details key={f.q} className="home-faq border-b border-[#e3e0e8] py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-bold text-[#1c1a22]">
              {f.q}
              <span aria-hidden="true" className="home-faq-icon text-[22px] font-medium text-[#6a6573]">+</span>
            </summary>
            <p className="m-0 mt-3 text-[15px] leading-relaxed text-[#5a5562]">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  </section>
);

export const HomeFooter = () => {
  const navigate = useNavigate();
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const link = "text-left text-[14px] text-[#cfcbd8] hover:text-white";

  return (
    <footer className="bg-[#0f0d16] px-[clamp(16px,5vw,80px)] pb-[120px] pt-[72px] text-[#cfcbd8] md:pb-10">
      <div className="mx-auto flex max-w-[1180px] flex-wrap justify-between gap-10">
        <div className="max-w-[360px]">
          <p className="font-display m-0 text-[44px] leading-[0.95] text-white">Ride electric. Pay less.</p>
          <p className="m-0 mt-3.5 text-[14px] leading-normal">
            {c.brand} {c.franchiseName}. {c.hubAddress}.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-12">
          <div className="flex flex-col gap-2.5">
            <span className="text-[14px] font-extrabold text-white">Rent</span>
            <a href="#plans" className={link}>Daily and weekly</a>
            <a href="#plans" className={link}>Subscription</a>
            <button type="button" onClick={() => navigate("/business")} className={link}>For business</button>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="text-[14px] font-extrabold text-white">Help</span>
            <a href="#faq" className={link}>FAQs</a>
            <button type="button" onClick={() => navigate("/help-center")} className={link}>Help center</button>
            <a href={c.supportPhoneHref} className={link}>{c.supportPhone}</a>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="text-[14px] font-extrabold text-white">Legal</span>
            <button type="button" onClick={() => setShowTerms(true)} className={link}>Terms and conditions</button>
            <button type="button" onClick={() => setShowPrivacy(true)} className={link}>Privacy policy</button>
          </div>
        </nav>
      </div>
      <TermsAndConditionsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyPolicyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </footer>
  );
};

