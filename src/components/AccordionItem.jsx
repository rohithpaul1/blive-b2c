import { useState } from "react";

const AccordionItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#EDEDED] py-3">
      <div
        className="flex gap-x-[12px] items-center cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        {open ? <img src="/images/Minus.png" alt="Minus Image" /> : <img src="/images/Add.png" alt="Add Image" />}
        <p className="font-medium text-[#222222]">{q}</p>
      </div>
      <p className={`${open ? "max-h-[2000px] mt-2 py-5" : "max-h-0"} duration-500 transition-all overflow-hidden text-sm text-[#3A3A3A]`}>{a}</p>
    </div>
  );
};

export default AccordionItem;