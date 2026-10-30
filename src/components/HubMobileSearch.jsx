import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { addMonths, format, isBefore, isSameDay, startOfDay, startOfMonth } from "date-fns";
import { CalendarDays, Check, ChevronDown, Clock3, X } from "lucide-react";
import {
  HUB_CLOSE_MINUTES,
  HUB_OPEN_MINUTES,
  TIME_SLOT_GROUPS,
  labelToMinutes,
  minutesToLabel,
} from "../utils/timeSlots";

// Phone search for a single-hub site, after Sixt's mobile flow: a 2x2 grid of
// date and time fields, a full-screen range calendar with months stacked
// vertically and a "Select dates" footer, and a bottom sheet of time slots.

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS_AHEAD = 12;

const clockLabel = (label) => {
  const minutes = labelToMinutes(label);
  if (minutes === null) return label || "Add time";
  const h24 = Math.floor(minutes / 60);
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(minutes % 60).padStart(2, "0")} ${h24 >= 12 ? "PM" : "AM"}`;
};
const HUB_HOURS = `${clockLabel(minutesToLabel(HUB_OPEN_MINUTES))} – ${clockLabel(minutesToLabel(HUB_CLOSE_MINUTES))}`;
const durationLabel = (months) => `About ${months} ${Number(months) === 1 ? "month" : "months"}`;

const monthDays = (month) => {
  const first = startOfMonth(month);
  const count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: first.getDay() }, () => null);
  for (let d = 1; d <= count; d += 1) days.push(new Date(first.getFullYear(), first.getMonth(), d));
  return days;
};

// Full-screen layer above the header and tab bar; locks page scroll while open.
function Layer({ children }) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
  return createPortal(children, document.body);
}

function CalendarSheet({ single, pickupDate, returnDate, onClose, onDone }) {
  const today = startOfDay(new Date());
  const [start, setStart] = useState(pickupDate ? startOfDay(new Date(pickupDate)) : null);
  const [end, setEnd] = useState(!single && returnDate ? startOfDay(new Date(returnDate)) : null);
  const scrollRef = useRef(null);
  const months = useMemo(() => Array.from({ length: MONTHS_AHEAD }, (_, i) => addMonths(startOfMonth(today), i)), [today]);

  // Open on the month of the current pickup.
  useEffect(() => {
    const target = scrollRef.current?.querySelector('[data-anchor="true"]');
    if (target && scrollRef.current) scrollRef.current.scrollTop = target.offsetTop - 8;
  }, []);

  const pick = (day) => {
    if (single) {
      setStart(day);
      return;
    }
    if (!start || end || isBefore(day, start)) {
      setStart(day);
      setEnd(null);
      return;
    }
    setEnd(isSameDay(day, start) ? null : day);
  };

  const ready = single ? Boolean(start) : Boolean(start && end);
  const summary = single
    ? start
      ? `Starts ${format(start, "EEE, d MMM")}`
      : "Pick a start date"
    : start && end
    ? `${format(start, "EEE, d MMM")} – ${format(end, "EEE, d MMM")}`
    : start
    ? `${format(start, "EEE, d MMM")} – pick a return date`
    : "Pick your pickup date";
  const anchorMonth = startOfMonth(start || today).getTime();

  return (
    <Layer>
      <div className="fixed inset-0 z-[120] flex flex-col bg-white" role="dialog" aria-modal="true" aria-label="Choose your rental dates">
        <div className="px-[20px] pt-[max(14px,env(safe-area-inset-top))]">
          <button type="button" onClick={onClose} aria-label="Close" className="-ml-[8px] flex size-[40px] items-center justify-center rounded-full hover:bg-[#f2f2f2]">
            <X className="size-[22px] text-[#191919]" aria-hidden="true" />
          </button>
          <h2 className="m-0 mt-[6px] text-[24px] font-extrabold tracking-[-0.01em] text-[#191919]">
            {single ? "Choose your start date" : "Choose your rental dates"}
          </h2>
          <div className="mt-[18px] grid grid-cols-7 border-b border-[#e6e6e6] pb-[12px] text-center text-[13px] uppercase text-[#4a4a4a]">
            {WEEKDAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
        </div>

        <div ref={scrollRef} className="relative flex-1 overflow-y-auto px-[20px] pb-[24px]">
          {months.map((m) => (
            <section key={m.getTime()} data-anchor={m.getTime() === anchorMonth} className="pt-[22px]">
              <h3 className="m-0 text-right text-[19px] font-extrabold text-[#191919]">{format(m, "MMMM yyyy")}</h3>
              <div className="mt-[12px] grid grid-cols-7 gap-y-[6px]">
                {monthDays(m).map((day, i) => {
                  if (!day) return <span key={`e${i}`} />;
                  const past = isBefore(day, today);
                  const isStart = start && isSameDay(day, start);
                  const isEnd = end && isSameDay(day, end);
                  const between = start && end && day > start && day < end;
                  return (
                    <button
                      key={day.getTime()}
                      type="button"
                      disabled={past}
                      aria-pressed={Boolean(isStart || isEnd)}
                      aria-label={format(day, "EEEE d MMMM yyyy")}
                      onClick={() => pick(day)}
                      className={`flex h-[46px] items-center justify-center text-[16px] font-bold tabular-nums ${
                        isStart || isEnd
                          ? "rounded-[6px] bg-[#c44536] text-white"
                          : between
                          ? "bg-[#f2f2f2] text-[#191919]"
                          : past
                          ? "text-[#c4c4c4]"
                          : "rounded-[6px] text-[#191919] active:bg-[#f2f2f2]"
                      }`}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="border-t border-[#e6e6e6] bg-white px-[20px] pb-[max(16px,env(safe-area-inset-bottom))] pt-[12px]">
          <p className="m-0 text-center text-[15px] tabular-nums text-[#191919]">{summary}</p>
          <button
            type="button"
            disabled={!ready}
            onClick={() => onDone(start, end)}
            className="mt-[12px] flex min-h-[54px] w-full items-center justify-center rounded-[10px] bg-[#c44536] text-[17px] font-bold text-white disabled:bg-[#e3d3cf]"
          >
            {single ? "Select date" : "Select dates"}
          </button>
        </div>
      </div>
    </Layer>
  );
}

function BottomSheet({ title, onClose, children }) {
  return (
    <Layer>
      <div className="fixed inset-0 z-[120] flex flex-col justify-end bg-black/45" onClick={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[78vh] overflow-hidden rounded-t-[20px] bg-white pb-[max(12px,env(safe-area-inset-bottom))]"
        >
          <div className="flex items-center justify-between border-b border-[#efedf1] px-[20px] py-[14px]">
            <p className="m-0 text-[17px] font-bold text-[#191919]">{title}</p>
            <button type="button" onClick={onClose} aria-label="Close" className="flex size-[36px] items-center justify-center rounded-full hover:bg-[#f2f2f2]">
              <X className="size-[20px]" aria-hidden="true" />
            </button>
          </div>
          <div className="max-h-[calc(78vh-64px)] overflow-y-auto px-[20px] pb-[12px]">{children}</div>
        </div>
      </div>
    </Layer>
  );
}

function SlotGrid({ value, isBlocked, onPick }) {
  const ref = useRef(null);
  useEffect(() => {
    const chip = ref.current?.querySelector('button[aria-pressed="true"]');
    chip?.scrollIntoView({ block: "center" });
  }, []);
  const groups = TIME_SLOT_GROUPS.map((g) => ({ ...g, slots: g.slots.filter((s) => !isBlocked?.(s.minutes)) })).filter(
    (g) => g.slots.length > 0
  );
  return (
    <div ref={ref}>
      <p className="m-0 flex items-center gap-[8px] pt-[12px] text-[14px] text-[#5a5562]">
        <Clock3 className="size-[16px]" aria-hidden="true" />
        Hub hours: {HUB_HOURS}
      </p>
      {groups.length === 0 && <p className="m-0 pt-[12px] text-[15px] text-[#5a5562]">No times left on this day. Pick another date.</p>}
      {groups.map((group) => (
        <div key={group.label} className="pt-[14px]">
          <p className="m-0 text-[13px] font-bold text-[#6a6573]">{group.label}</p>
          <div className="mt-[8px] grid grid-cols-2 gap-[8px]">
            {group.slots.map((slot) => {
              const selected = value === slot.label;
              return (
                <button
                  key={slot.label}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onPick(slot.label)}
                  className={`min-h-[48px] rounded-[10px] text-[15px] font-bold tabular-nums ${
                    selected ? "bg-[#191919] text-white" : "bg-[#f3f2f4] text-[#191919]"
                  }`}
                >
                  {clockLabel(slot.label)}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const Field = (props) => {
  const { icon: Glyph, label, value, onClick, wide } = props;
  return (
  <button
    type="button"
    onClick={onClick}
    className={`flex min-h-[60px] min-w-0 items-center gap-[10px] rounded-[10px] border border-[#d9d9d9] bg-white px-[12px] text-left ${wide ? "col-span-2" : ""}`}
  >
    <Glyph className="size-[20px] shrink-0 text-[#191919]" aria-hidden="true" />
    <span className="min-w-0">
      <span className="block text-[12px] text-[#5a5562]">{label}</span>
      <span className="block truncate text-[16px] font-medium tabular-nums text-[#191919]">{value}</span>
    </span>
  </button>
  );
};

export default function HubMobileSearch({
  isSubscription,
  pickup,
  dropoff,
  onPickupDate,
  onReturnDate,
  onPickupTime,
  onReturnTime,
  isPickupBlocked,
  isReturnBlocked,
  duration,
  durations = [],
  onDuration,
}) {
  const [open, setOpen] = useState(null); // "dates" | "pickupTime" | "returnTime" | "duration"
  const dateText = (d) => (d ? format(new Date(d), "EEE, d MMM") : "Add date");

  return (
    <>
      <div className="grid grid-cols-2 gap-[10px]">
        <Field icon={CalendarDays} label={isSubscription ? "Start date" : "Pickup date"} value={dateText(pickup?.date)} onClick={() => setOpen("dates")} />
        <Field icon={Clock3} label="Time" value={clockLabel(pickup?.time)} onClick={() => setOpen("pickupTime")} />
        {isSubscription ? (
          <Field icon={ChevronDown} label="How long?" value={durationLabel(duration)} onClick={() => setOpen("duration")} wide />
        ) : (
          <>
            <Field icon={CalendarDays} label="Return date" value={dateText(dropoff?.date)} onClick={() => setOpen("dates")} />
            <Field icon={Clock3} label="Time" value={clockLabel(dropoff?.time)} onClick={() => setOpen("returnTime")} />
          </>
        )}
      </div>

      {open === "dates" && (
        <CalendarSheet
          single={isSubscription}
          pickupDate={pickup?.date}
          returnDate={dropoff?.date}
          onClose={() => setOpen(null)}
          onDone={(start, end) => {
            onPickupDate(start);
            if (!isSubscription && end) onReturnDate(end);
            setOpen(null);
          }}
        />
      )}
      {(open === "pickupTime" || open === "returnTime") && (
        <BottomSheet title={open === "pickupTime" ? (isSubscription ? "Select start time" : "Select pickup time") : "Select return time"} onClose={() => setOpen(null)}>
          <SlotGrid
            value={open === "pickupTime" ? pickup?.time : dropoff?.time}
            isBlocked={open === "pickupTime" ? isPickupBlocked : isReturnBlocked}
            onPick={(t) => {
              (open === "pickupTime" ? onPickupTime : onReturnTime)(t);
              setOpen(null);
            }}
          />
        </BottomSheet>
      )}
      {open === "duration" && (
        <BottomSheet title="How long will you ride?" onClose={() => setOpen(null)}>
          <p className="m-0 pt-[12px] text-[14px] text-[#5a5562]">A rough guide. You can extend or stop later.</p>
          <ul className="m-0 mt-[6px] list-none p-0">
            {durations.map((months) => {
              const selected = Number(duration) === Number(months);
              return (
                <li key={months}>
                  <button
                    type="button"
                    onClick={() => {
                      onDuration(months);
                      setOpen(null);
                    }}
                    className={`flex min-h-[52px] w-full items-center justify-between border-b border-[#f0eef2] text-left text-[16px] ${selected ? "font-bold" : "font-medium"} text-[#191919]`}
                  >
                    {durationLabel(months)}
                    {selected && <Check className="size-[18px]" aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </BottomSheet>
      )}
    </>
  );
}
