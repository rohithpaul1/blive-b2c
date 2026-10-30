import { useEffect, useRef, useState } from "react";
import { addMonths, format, isBefore, isSameDay, startOfDay, startOfMonth } from "date-fns";
import { CalendarDays, Check, ChevronLeft, ChevronRight, ChevronDown, Clock3 } from "lucide-react";
import {
  HUB_CLOSE_MINUTES,
  HUB_OPEN_MINUTES,
  TIME_SLOT_GROUPS,
  labelToMinutes,
  minutesToLabel,
} from "../utils/timeSlots";

// Desktop pickup / return fields for a single-hub site, after Sixt's search:
// each field splits into a date part and a time part. Dates open a range calendar
// (pickup, then it moves on to return, then closes); times open a slot list.

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// "10 AM" -> "10:00 AM", for display only. Stored labels keep the app's format.
const clockLabel = (label) => {
  const minutes = labelToMinutes(label);
  if (minutes === null) return label || "Add time";
  const h24 = Math.floor(minutes / 60);
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(minutes % 60).padStart(2, "0")} ${h24 >= 12 ? "PM" : "AM"}`;
};

const HUB_HOURS = `${clockLabel(minutesToLabel(HUB_OPEN_MINUTES))} – ${clockLabel(minutesToLabel(HUB_CLOSE_MINUTES))}`;

const monthDays = (month) => {
  const first = startOfMonth(month);
  const count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: first.getDay() }, () => null);
  for (let d = 1; d <= count; d += 1) days.push(new Date(first.getFullYear(), first.getMonth(), d));
  return days;
};

const RangeCalendar = ({ pickupDate, returnDate, single, onPick }) => {
  const [month, setMonth] = useState(() => startOfMonth(pickupDate || new Date()));
  const today = startOfDay(new Date());
  const canGoBack = !isBefore(addMonths(month, -1), startOfMonth(today));

  return (
    <div className="rounded-[12px] bg-white px-[24px] pb-[28px] pt-[22px] shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
      <div className="relative grid grid-cols-2 gap-[32px] xl:grid-cols-3">
        <button
          type="button"
          aria-label="Previous month"
          disabled={!canGoBack}
          onClick={() => setMonth((m) => addMonths(m, -1))}
          className="absolute left-[-8px] top-[-2px] flex size-[36px] items-center justify-center rounded-full text-[#1c1a22] hover:bg-[#f2f2f2] disabled:opacity-30"
        >
          <ChevronLeft className="size-[20px]" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setMonth((m) => addMonths(m, 1))}
          className="absolute right-[-8px] top-[-2px] flex size-[36px] items-center justify-center rounded-full text-[#1c1a22] hover:bg-[#f2f2f2]"
        >
          <ChevronRight className="size-[20px]" aria-hidden="true" />
        </button>

        {[0, 1, 2].map((offset) => {
          const m = addMonths(month, offset);
          return (
            <div key={offset} className={offset === 2 ? "hidden xl:block" : ""}>
              <p className="text-center text-[21px] font-extrabold tracking-[-0.01em] text-[#191919]">{format(m, "MMMM yyyy")}</p>
              <div className="mt-[16px] grid grid-cols-7 border-b border-[#e6e6e6] pb-[10px] text-center text-[13px] font-normal uppercase text-[#4a4a4a]">
                {WEEKDAYS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="mt-[12px] grid grid-cols-7 gap-y-[2px]">
                {monthDays(m).map((day, i) => {
                  if (!day) return <span key={`e${i}`} />;
                  const past = isBefore(day, today);
                  const isPickup = pickupDate && isSameDay(day, pickupDate);
                  const isReturn = !single && returnDate && isSameDay(day, returnDate);
                  const inRange =
                    !single && pickupDate && returnDate && day > startOfDay(pickupDate) && day < startOfDay(returnDate);
                  const edge = isPickup || isReturn;
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      disabled={past}
                      aria-pressed={Boolean(edge)}
                      aria-label={format(day, "EEEE d MMMM yyyy")}
                      onClick={() => onPick(day)}
                      className={`flex h-[34px] w-full items-center justify-center text-[15px] font-bold tabular-nums transition-colors ${
                        edge
                          ? "rounded-[6px] bg-[#191919] text-white"
                          : inRange
                          ? "bg-[#f2f2f2] text-[#191919] hover:bg-[#e6e6e6]"
                          : past
                          ? "cursor-not-allowed text-[#c4c4c4]"
                          : "rounded-[6px] text-[#191919] hover:bg-[#f2f2f2]"
                      }`}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SlotList = ({ title, value, isBlocked, onPick }) => {
  const listRef = useRef(null);

  useEffect(() => {
    const chip = listRef.current?.querySelector('button[aria-pressed="true"]');
    if (chip && listRef.current) {
      listRef.current.scrollTop = chip.offsetTop - listRef.current.clientHeight / 2 + chip.offsetHeight / 2;
    }
  }, []);

  const groups = TIME_SLOT_GROUPS.map((g) => ({ ...g, slots: g.slots.filter((s) => !isBlocked?.(s.minutes)) })).filter(
    (g) => g.slots.length > 0
  );

  return (
    <div className="w-[340px] overflow-hidden rounded-[20px] border border-[#e6e3e9] bg-white shadow-[0_18px_48px_rgba(15,13,22,0.18)]">
      <p className="border-b border-[#efedf1] py-[14px] text-center text-[15px] font-bold text-[#1c1a22]">{title}</p>
      <div ref={listRef} className="relative max-h-[380px] overflow-y-auto px-[14px] pb-[14px]">
        <p className="flex items-center gap-[8px] pt-[12px] text-[13px] text-[#5a5562]">
          <Clock3 className="size-[15px]" aria-hidden="true" />
          Hub hours: {HUB_HOURS}
        </p>
        {groups.length === 0 && (
          <p className="pt-[12px] text-[14px] text-[#5a5562]">No times left on this day. Pick another date.</p>
        )}
        {groups.map((group) => (
          <div key={group.label} className="pt-[14px]">
            <p className="text-[12px] font-bold text-[#6a6573]">{group.label}</p>
            <div className="mt-[8px] grid grid-cols-2 gap-[8px]">
              {group.slots.map((slot) => {
                const selected = value === slot.label;
                return (
                  <button
                    key={slot.label}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onPick(slot.label)}
                    className={`min-h-[44px] rounded-[10px] text-[14px] font-bold tabular-nums transition-colors ${
                      selected ? "bg-[#1c1a22] text-white" : "bg-[#f3f2f4] text-[#1c1a22] hover:bg-[#e8e6ea]"
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
    </div>
  );
};

const durationLabel = (months) => `About ${months} ${Number(months) === 1 ? "month" : "months"}`;

const segment = (active) =>
  `flex min-h-[56px] items-center gap-[10px] px-[14px] text-left text-[16px] font-medium text-[#191919] transition-colors hover:bg-[#fafafa] ${
    active ? "relative z-[1] rounded-[8px] outline outline-2 -outline-offset-2 outline-[#c44536]" : ""
  }`;

export default function HubDateTimeFields({
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
  // open: null | "dates" | "pickupTime" | "returnTime"; stage: which date the calendar is choosing.
  const [open, setOpen] = useState(null);
  const [stage, setStage] = useState("pickup");
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(null);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openDates = (which) => {
    setStage(which);
    setOpen("dates");
  };

  const pickDay = (day) => {
    if (isSubscription) {
      onPickupDate(day);
      setOpen(null);
      return;
    }
    if (stage === "pickup" || (pickup?.date && isBefore(day, startOfDay(pickup.date)))) {
      onPickupDate(day);
      setStage("return");
      return;
    }
    onReturnDate(day);
    setOpen(null);
  };

  const dateLabel = (date) => (date ? format(new Date(date), "d MMM") : "Add date");
  const datesOpen = open === "dates";

  const field = (kind) => {
    const isPickup = kind === "pickup";
    const value = isPickup ? pickup : dropoff;
    const timeKey = isPickup ? "pickupTime" : "returnTime";
    return (
      <div className="relative min-w-0">
        <p className="mb-[6px] text-[13px] font-bold text-[#1c1a22]">
          {isPickup ? (isSubscription ? "Start date" : "Pickup date") : "Return date"}
        </p>
        <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] rounded-[8px] border border-[#d9d9d9] bg-white">
          <button
            type="button"
            aria-expanded={datesOpen && stage === kind}
            onClick={() => openDates(kind)}
            className={`${segment(datesOpen && stage === kind)} border-r border-[#d9d9d9]`}
          >
            <CalendarDays className="size-[20px] shrink-0 text-[#191919]" aria-hidden="true" />
            <span className="truncate tabular-nums">{dateLabel(value?.date)}</span>
          </button>
          <button
            type="button"
            aria-expanded={open === timeKey}
            onClick={() => setOpen((o) => (o === timeKey ? null : timeKey))}
            className={segment(open === timeKey)}
          >
            <span className="truncate tabular-nums">{clockLabel(value?.time)}</span>
            <ChevronDown className="ml-auto size-[16px] shrink-0 text-[#6a6573]" aria-hidden="true" />
          </button>
        </div>
        {open === timeKey && (
          <div className="absolute right-0 top-full z-[60] mt-[8px]">
            <SlotList
              title={isPickup ? (isSubscription ? "Select start time" : "Select pickup time") : "Select return time"}
              value={value?.time}
              isBlocked={isPickup ? isPickupBlocked : isReturnBlocked}
              onPick={(t) => {
                (isPickup ? onPickupTime : onReturnTime)(t);
                setOpen(null);
              }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={rootRef} className="relative col-span-2 grid grid-cols-2 gap-[10px]">
      {field("pickup")}
      {isSubscription ? (
        <div className="relative min-w-0">
          <p className="mb-[6px] text-[13px] font-bold text-[#1c1a22]">How long?</p>
          <div className="rounded-[8px] border border-[#d9d9d9] bg-white">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={open === "duration"}
              onClick={() => setOpen((o) => (o === "duration" ? null : "duration"))}
              className={`${segment(open === "duration")} w-full`}
            >
              <Clock3 className="size-[20px] shrink-0 text-[#191919]" aria-hidden="true" />
              <span className="truncate">{durationLabel(duration)}</span>
              <ChevronDown className="ml-auto size-[16px] shrink-0 text-[#6a6573]" aria-hidden="true" />
            </button>
          </div>
          {open === "duration" && (
            <div className="absolute left-0 right-0 top-full z-[60] mt-[8px] overflow-hidden rounded-[12px] bg-white py-[8px] shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
              <p className="px-[16px] pb-[6px] pt-[4px] text-[13px] text-[#5a5562]">
                Roughly how long will you ride? You can extend or stop later.
              </p>
              <ul role="listbox" aria-label="Expected subscription duration">
                {durations.map((months) => {
                  const selected = Number(duration) === Number(months);
                  return (
                    <li key={months}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => {
                          onDuration(months);
                          setOpen(null);
                        }}
                        className={`flex min-h-[48px] w-full items-center justify-between px-[16px] text-left text-[16px] transition-colors hover:bg-[#f2f2f2] ${
                          selected ? "font-bold text-[#191919]" : "font-medium text-[#191919]"
                        }`}
                      >
                        {durationLabel(months)}
                        {selected && <Check className="size-[18px] text-[#191919]" aria-hidden="true" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      ) : (
        field("return")
      )}
      {datesOpen && (
        <div className="absolute left-0 right-0 top-full z-[60] mt-[8px] min-w-[640px] xl:-left-[120px] xl:right-[-180px]">
          <RangeCalendar
            pickupDate={pickup?.date}
            returnDate={dropoff?.date}
            single={isSubscription}
            onPick={pickDay}
          />
        </div>
      )}
    </div>
  );
}
