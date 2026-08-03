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
    <div className="w-full h-dvh overflow-x-hidden flex flex-col items-center">
      <Navbar onSearchPage={false} expanded={true} />

      <div className="mt-[124px] flex items-center w-full border-y border-[#EDEDED] py-[24px] px-[40px] gap-x-[16px]">
        <p className="font-bold text-[28px] text-[#222222]">Help Center</p>
      </div>

      <div className="flex-1 py-[32px] px-[150px] grow flex w-full h-full">
        {/* Sidebar */}
        <div className="w-[360px] overflow-hidden rounded-[16px] shadow-md h-full">
          <p className="text-[#969696] px-[16px] mt-[22px] mb-[16px]">
            Help Topics
          </p>
          <ul>
            {faqData.map((cat) => (
              <li
                key={cat.category}
                onClick={() => setActiveCategory(cat.category)}
                className={`cursor-pointer pl-4 py-4 text-[18px] font-bold rounded-r-md border-l-4 ${
                  activeCategory === cat.category
                    ? "border-[#1B29A9] text-[#1B29A9] font-semibold bg-[#F7F8FF]"
                    : "border-transparent text-[#3A3A3A]"
                }`}
              >
                {cat.category}
              </li>
            ))}
          </ul>
        </div>

        {/* FAQ content */}
        <div className="h-full px-[32px] flex-1 overflow-y-auto">
          {/* Tabs */}
          <p className="font-medium text-[22px] text-[#222222]">
            {activeCategory}
          </p>
          <div className="mt-[24px] flex items-center gap-4 mb-6 flex-wrap">
            {currentCategory?.tabs?.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-[16px] cursor-pointer py-[8px] h-[44px] flex items-center justify-center rounded-full border ${
                  activeTab === tab
                    ? "bg-[#1B29A9] text-white border-[#1B29A9]"
                    : "bg-transparent text-[#3A3A3A] border-[#C0C0C0]"
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
            <p className="text-gray-500">No FAQs available for this section.</p>
          )}
        </div>
      </div>

      {/* Bottom call-to-action */}
      <div className="mt-[35px] w-full min-h-[130px] border-t flex items-center justify-between bg-[#F7F7F7] px-[150px]">
        <div className="flex items-center gap-x-[16px]">
          <img
            className="rounded-[50%] w-[70px]"
            src="/images/HelpCenter.png"
            alt="Help Center Image"
          />
          <div className="flex flex-col gap-y-[4px]">
            <p className="font-bold text-[18px] text-[#212121]">
              Contact Blive Support Team
            </p>
            <p className="text-[14px] text-[#212121]">
              Feel free to talk to us about any queries or feedback. Customer
              satisfaction is our highest priority
            </p>
          </div>
        </div>
        <button className="h-[48px] py-[12px] px-[24px] cursor-pointer rounded-[24px] font-bold text-[14px] text-[#3A3A3A]">
          Contact us at <a href="tel:08047190022">080-4719-0022</a>
        </button>
      </div>
    </div>
  );
};

export default HelpCenter;
