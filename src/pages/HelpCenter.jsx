import { useEffect, useState } from "react";
import { faqData } from "./faqData";
import AccordionItem from "../components/AccordionItem";
import Navbar from "../sections/Navbar";

const HelpCenter = () => {
  // pick first category & its first tab
  const [activeCategory, setActiveCategory] = useState(faqData[0].category);
  const [activeTab, setActiveTab] = useState(
    faqData[0].tabs ? faqData[0].tabs[0] : ""
  );

  const currentCategory = faqData.find((c) => c.category === activeCategory);

  useEffect(() => {
    if (currentCategory?.tabs?.length) {
      setActiveTab(currentCategory.tabs[0]);
    }
  }, [activeCategory]); // update activeTab when category changes

  return (
    <div className="flex min-h-dvh w-full flex-col items-center overflow-x-hidden md:h-dvh">
      <Navbar onSearchPage={false} expanded={true} />

      <div className="mt-[124px] flex w-full items-center gap-x-[16px] border-b border-[#EDEDED] px-[20px] py-[20px] md:border-t md:px-[40px] md:py-[24px]">
        <h1 className="text-[22px] font-bold text-[#222222] md:text-[28px]">Help Center</h1>
      </div>

      <div className="flex w-full flex-1 flex-col gap-[20px] px-[20px] py-[20px] md:h-full md:flex-row md:gap-0 md:px-[clamp(24px,8vw,150px)] md:py-[32px]">
        {/* Topics: a scrollable chip row on phones, a sidebar from md up */}
        <nav aria-label="Help topics" className="md:h-full md:w-[300px] md:shrink-0 md:overflow-hidden md:rounded-[16px] md:shadow-md lg:w-[360px]">
          <p className="mb-[12px] text-[13px] font-medium uppercase tracking-[0.04em] text-[#6a6a6a] md:mx-[16px] md:mb-[16px] md:mt-[22px] md:text-[15px] md:normal-case md:tracking-normal">
            Help topics
          </p>
          <ul className="-mx-[20px] flex gap-[8px] overflow-x-auto px-[20px] pb-[4px] [scrollbar-width:none] md:mx-0 md:block md:overflow-visible md:px-0 md:pb-0">
            {faqData.map((cat) => {
              const active = activeCategory === cat.category;
              return (
                <li key={cat.category} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveCategory(cat.category)}
                    aria-current={active ? "true" : undefined}
                    className={`min-h-[44px] whitespace-nowrap rounded-full border px-[16px] text-[15px] font-semibold md:w-full md:whitespace-normal md:rounded-none md:rounded-r-md md:border-0 md:border-l-4 md:py-4 md:pl-4 md:text-left md:text-[17px] ${
                      active
                        ? "border-[#222222] bg-[#222222] text-white md:border-[#351a75] md:bg-[#f4f0fc] md:text-[#351a75]"
                        : "border-[#dddddd] text-[#3A3A3A] md:border-transparent"
                    }`}
                  >
                    {cat.category}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* FAQ content */}
        <div className="min-w-0 flex-1 md:h-full md:overflow-y-auto md:px-[32px]">
          <h2 className="text-[20px] font-semibold text-[#222222] md:text-[22px]">
            {activeCategory}
          </h2>
          <div className="-mx-[20px] mb-[16px] mt-[16px] flex items-center gap-[8px] overflow-x-auto px-[20px] [scrollbar-width:none] md:mx-0 md:mb-6 md:mt-[24px] md:flex-wrap md:gap-4 md:px-0">
            {currentCategory?.tabs?.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex h-[40px] shrink-0 items-center justify-center whitespace-nowrap rounded-full border px-[16px] text-[14px] font-medium md:h-[44px] ${
                  activeTab === tab
                    ? "border-[#351a75] bg-[#351a75] text-white"
                    : "border-[#C0C0C0] bg-transparent text-[#3A3A3A]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Questions */}
          {currentCategory?.questions?.[activeTab]?.length > 0 ? (
            currentCategory.questions[activeTab].map((item, i) => (
              <AccordionItem key={i} q={item.q} a={item.a} />
            ))
          ) : (
            <p className="text-[15px] text-[#6a6a6a]">No FAQs available for this section.</p>
          )}
        </div>
      </div>

      {/* Contact support */}
      <div className="flex w-full flex-col gap-[16px] border-t bg-[#F7F7F7] px-[20px] py-[24px] md:mt-[35px] md:min-h-[130px] md:flex-row md:items-center md:justify-between md:px-[clamp(24px,8vw,150px)]">
        <div className="flex items-center gap-x-[16px]">
          <img
            className="w-[56px] shrink-0 rounded-[50%] md:w-[70px]"
            src="/images/HelpCenter.png"
            alt=""
          />
          <div className="flex flex-col gap-y-[4px]">
            <p className="text-[17px] font-bold text-[#212121] md:text-[18px]">
              Contact BLive NXT support
            </p>
            <p className="text-[14px] leading-[1.45] text-[#4a4a4a]">
              Talk to us about any question or feedback. Customer satisfaction is our highest priority.
            </p>
          </div>
        </div>
        <a
          href="tel:08047190022"
          className="flex h-[48px] shrink-0 items-center justify-center rounded-[24px] border border-[#222222] px-[24px] text-[15px] font-bold text-[#222222]"
        >
          Call 080-4719-0022
        </a>
      </div>
    </div>
  );
};

export default HelpCenter;
