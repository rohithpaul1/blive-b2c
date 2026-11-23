import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { franchiseHome as c } from "../../config/franchiseHome";
import TermsAndConditionsModal from "../../components/TermsAndConditionsModal";
import PrivacyPolicyModal from "../../components/PrivacyPolicyModal";

export const RiderQuote = () => (
  <section className="home-quote-bg px-[clamp(16px,5vw,80px)] py-[88px] text-white md:py-[120px]">
    <div className="mx-auto max-w-[1000px] text-center">
      <blockquote className="m-0 text-[clamp(22px,3vw,40px)] font-medium leading-[1.3]">"{c.quote.text}"</blockquote>
      <p className="m-0 mt-6 text-[16px] font-bold">
        {c.quote.name} <span className="font-medium text-[#d6d2df]">· {c.quote.meta}</span>
      </p>
    </div>
  </section>
);

export const HomeFaq = () => (
  <section id="faq" className="px-[clamp(16px,5vw,80px)] py-[64px] md:py-[88px]">
    <div className="mx-auto flex max-w-[1180px] flex-wrap gap-12">
      <h2 className="font-display m-0 flex-[1_1_300px] text-[clamp(40px,5vw,60px)] leading-[0.95] text-[#0f0d16]">
        Questions riders ask
      </h2>
      <div className="flex-[2_1_560px] border-t border-[#e3e0e8] max-md:basis-full">
        {c.faqs.map((f) => (
          <details key={f.q} className="home-faq border-b border-[#e3e0e8] py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-bold text-[#1c1a22]">
              {f.q}
              <span aria-hidden="true" className="home-faq-icon text-[22px] font-medium text-[#6a6573]">+</span>
            </summary>
            <p className="m-0 mt-3 max-w-[65ch] text-[16px] leading-relaxed text-[#5a5562]">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  </section>
);

// Partner band above the footer, for co-branded franchise sites.
export const PartnerBand = () => {
  if (c.brandMode !== "cobrand" || !c.franchiseLogo) return null;
  return (
    <section className="border-t border-[#ecebf0] bg-white px-[clamp(16px,5vw,80px)] py-10">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-[18px]">
          <img src={c.franchiseLogo} alt={c.franchiseName} className="h-[30px] w-auto md:h-[34px]" />
          <span aria-hidden="true" className="hidden h-[34px] w-px bg-[#dcdae2] sm:block" />
          <p className="m-0 max-w-[560px] text-[15px] leading-normal text-[#3f3a42]">
            {c.brand} {c.city} is run by <b>{c.legalEntity ?? c.franchiseName}</b>, your local rental partner.
            {c.franchiseTagline ? ` ${c.franchiseTagline}` : ""}
          </p>
        </div>
        {c.partnerUrl && (
          <a href={c.partnerUrl} target="_blank" rel="noreferrer" className="text-[14px] font-bold text-[var(--accent)]">
            About {c.franchiseName.split(" ")[0]}
          </a>
        )}
      </div>
    </section>
  );
};

export const HomeFooter = () => {
  const navigate = useNavigate();
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const link = "text-left text-[14px] text-[#cfcbd8] hover:text-white";

  return (
    <footer className="bg-[#0f0d16] px-[clamp(16px,5vw,80px)] pb-[120px] pt-[72px] text-[#cfcbd8] md:pb-10">
      <div className="mx-auto flex max-w-[1180px] flex-wrap justify-between gap-10">
        <div className="max-w-[360px]">
          <p className="font-display m-0 text-[40px] leading-[0.95] text-white">Ride electric. Pay less.</p>
          <p className="m-0 mt-3.5 text-[14px] leading-normal">
            {c.brand} {c.franchiseName}. {c.hubAddress}.
          </p>
          {c.franchiseLogoOnDark && c.brandMode !== "cobrand" && (
            <p className="m-0 mt-[22px] flex items-center gap-3 text-[12px] text-[#9a95a6]">
              Operated by
              <img src={c.franchiseLogoOnDark} alt={c.legalEntity ?? c.franchiseName} className="h-[22px] w-auto" />
            </p>
          )}
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-12">
          <div className="flex flex-col gap-2.5">
            <span className="text-[14px] font-bold text-white">Rent</span>
            <a href="#plans" className={link}>Daily and weekly</a>
            <a href="#plans" className={link}>Subscription</a>
            <a href={c.businessEmailHref} className={link}>Business enquiries</a>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="text-[14px] font-bold text-white">Help</span>
            <a href="#faq" className={link}>FAQs</a>
            <button type="button" onClick={() => navigate("/help-center")} className={link}>Help center</button>
            <a href={c.supportPhoneHref} className={link}>{c.supportPhone}</a>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="text-[14px] font-bold text-white">Legal</span>
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

