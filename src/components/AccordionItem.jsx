import { useState } from "react";

const AccordionItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#EDEDED]">
      <button
        type="button"
        aria-expanded={open}
        className="flex min-h-[56px] w-full cursor-pointer items-center gap-x-[12px] py-[12px] text-left"
        onClick={() => setOpen(!open)}
      >
        <img className="h-[20px] w-[20px] shrink-0" src={open ? "/images/Minus.png" : "/images/Add.png"} alt="" />
        <span className="text-[15px] font-medium leading-[1.4] text-[#222222]">{q}</span>
      </button>
      <p className={`${open ? "max-h-[2000px] pb-[16px]" : "max-h-0"} overflow-hidden pl-[32px] text-[15px] leading-[1.55] text-[#4a4a4a] transition-all duration-500`}>{a}</p>
    </div>
  );
};

export default AccordionItem;
