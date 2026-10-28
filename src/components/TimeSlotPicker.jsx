import { forwardRef, useEffect, useRef } from "react";
import { Clock3 } from "lucide-react";
import { TIME_SLOT_GROUPS } from "../utils/timeSlots";

// Time chips under the search calendar: one tap per slot, grouped by part of
// day, each row scrolling sideways so the sheet stays short. Times that can't
// be picked (already past today, or before pickup on a same-day return) are hidden.
const TimeSlotPicker = forwardRef(function TimeSlotPicker(
  { title, value, onSelect, isBlocked, warning },
  ref
) {
  const rootRef = useRef(null);
  const setRefs = (node) => {
    rootRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  // Bring the selected chip into view inside its sideways-scrolling row.
  useEffect(() => {
    const chip = rootRef.current?.querySelector('button[aria-pressed="true"]');
    const row = chip?.parentElement;
    if (!chip || !row) return;
    row.scrollTo({
      left: chip.offsetLeft - row.clientWidth / 2 + chip.offsetWidth / 2,
      behavior: "smooth",
    });
  }, [value, title]);

  const visibleGroups = TIME_SLOT_GROUPS.map((group) => ({
    ...group,
    slots: group.slots.filter((slot) => !isBlocked?.(slot.minutes)),
  })).filter((group) => group.slots.length > 0);

  return (
    <div ref={setRefs} className="mt-[20px] scroll-mt-[16px] border-t border-[#eeeeee] pt-[18px]">
      <h3 className="text-[16px] font-bold text-[#222222]">{title}</h3>

      {visibleGroups.map((group) => (
        <div key={group.label} className="mt-[14px]">
          <p className="text-[12px] font-bold text-[#6a6a6a]">{group.label}</p>
          <div
            className="relative -mx-[20px] mt-[8px] flex gap-[8px] overflow-x-auto px-[20px] pb-[2px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label={`${group.label} slots`}
          >
            {group.slots.map((slot) => {
              const selected = value === slot.label;
              return (
                <button
                  key={slot.label}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelect(slot.label)}
                  className={`min-h-[44px] shrink-0 whitespace-nowrap rounded-full border px-[16px] text-[14px] font-medium transition-colors ${
                    selected
                      ? "border-[#222222] bg-[#222222] text-white"
                      : "border-[#dddddd] bg-white text-[#222222] hover:border-[#222222]"
                  }`}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {warning && (
        <div className="mt-[16px] flex items-start gap-[10px] rounded-[14px] bg-[#fff4e0] px-[14px] py-[12px]" role="status">
          <Clock3 className="mt-[1px] size-[18px] shrink-0 text-[#8a4b00]" aria-hidden="true" />
          <p className="text-[13px] leading-[1.5] text-[#6b3a00]">{warning}</p>
        </div>
      )}
    </div>
  );
});

export default TimeSlotPicker;
