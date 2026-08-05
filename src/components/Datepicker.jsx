import { useRef, useEffect, useState, useContext } from "react";
import { addMonths, format, isBefore, startOfDay, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SearchBarContext } from "../contexts/SearchBarContext";
import {
  RENTAL_MODES,
  addPlanDuration,
  startingPeriodLabel,
} from "../utils/subscription";

const times = ["9 AM", "10 AM", "11 AM", "12 PM", "2 PM", "3 PM"];

export default function DateTimePicker({
  showDatepicker,
  setShowDatepicker,
  selectedPickup,
  setSelectedPickup,
  selectedDropoff,
  setSelectedDropoff,
  selectionStage = "pickup",
  setSelectionStage,
}) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [pickupDate, setPickupDate] = useState(selectedPickup.date || null);
  const [dropoffDate, setDropoffDate] = useState(selectedDropoff.date || null);
  const [pickupTime, setPickupTime] = useState(selectedPickup.time || "10 AM");
  const [dropoffTime, setDropoffTime] = useState(selectedDropoff.time || "10 AM");
  const calendarRef = useRef(null);
  
  const {
    handlePickupDateChange,
    autoAdjustPlanTypeFromDates,
    rentalMode,
    subscriptionDuration,
    currentPlanType,
  } = useContext(SearchBarContext);
  const isSubscription = rentalMode === RENTAL_MODES.subscription;

  const months = [
    currentMonth,
    addMonths(currentMonth, 1)
  ];

  const handleDateClick = (date) => {
    if (isSubscription) {
      const commitmentEnd = addPlanDuration(
        date,
        currentPlanType,
        subscriptionDuration
      );
      setPickupDate(date);
      setDropoffDate(commitmentEnd);
      setSelectedPickup((previous) => ({ ...previous, date }));
      setSelectedDropoff((previous) => ({
        ...previous,
        date: commitmentEnd,
        time: pickupTime,
      }));
      sessionStorage.setItem("selectedPickupDate", date.toISOString());
      sessionStorage.setItem("selectedDropoffDate", commitmentEnd.toISOString());
      sessionStorage.setItem("selectedDropoffTime", pickupTime);
      handlePickupDateChange(date);
      return;
    }
    if (selectionStage === "pickup" || !pickupDate) {
      setPickupDate(date);
      setSelectedPickup(prev => ({ ...prev, date }));
      sessionStorage.setItem('selectedPickupDate', date.toISOString());
      setDropoffDate(null);
      setSelectedDropoff(() => ({}));
      sessionStorage.removeItem('selectedDropoffDate');
      setSelectionStage?.("dropoff");
    } else {
      if (date >= pickupDate) {
        setDropoffDate(date);
        setSelectedDropoff(prev => ({ ...prev, date }));
        sessionStorage.setItem('selectedDropoffDate', date.toISOString());
        
        // Auto-detect plan type based on the complete date range
        autoAdjustPlanTypeFromDates(pickupDate, date);
      } else {
        setPickupDate(date);
        setSelectedPickup(prev => ({ ...prev, date }));
        sessionStorage.setItem('selectedPickupDate', date.toISOString());
        setDropoffDate(null);
        setSelectedDropoff(() => ({}));
        sessionStorage.removeItem('selectedDropoffDate');
        setSelectionStage?.("dropoff");
      }
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      // IDs to ignore
      const ignoreIds = ["pickup-btn", "dropoff-btn"];

      // Check if clicked element has any of those IDs or is inside them
      const clickedInsideIgnored = ignoreIds.some((id) =>
        document.getElementById(id)?.contains(event.target)
      );

      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target) &&
        !clickedInsideIgnored
      ) {
        setShowDatepicker(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!showDatepicker) return;
    setPickupDate(selectedPickup?.date || null);
    setDropoffDate(selectedDropoff?.date || null);
    setPickupTime(selectedPickup?.time || "10 AM");
    setDropoffTime(selectedDropoff?.time || "10 AM");
  }, [showDatepicker, selectedPickup, selectedDropoff]);

  const renderCalendar = (month) => {
    const year = month.getFullYear();
    const monthNum = month.getMonth();
    const firstDay = new Date(year, monthNum, 1);
    const lastDay = new Date(year, monthNum + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    let days = [];
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, monthNum, i));
    }

    return (
      <div className="flex flex-col">
        <div className="text-center font-bold text-[#3A3A3A] mb-[14px]">
          {format(month, "MMMM yyyy")}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[12px] text-[#717171] mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-[6px] lg:gap-[12px]">
          {days.map((day, i) => {
            if (!day) return <div key={i}></div>;
            const isSelected = pickupDate && format(day, "yyyy-MM-dd") === format(pickupDate, "yyyy-MM-dd");
            const inRange = pickupDate && dropoffDate && day >= pickupDate && day <= dropoffDate;
            const isEnd = dropoffDate && format(day, "yyyy-MM-dd") === format(dropoffDate, "yyyy-MM-dd");
            const isPast = isBefore(startOfDay(day), startOfDay(new Date()));

            return (
              <button
                key={i}
                type="button"
                onClick={() => handleDateClick(day)}
                disabled={isPast}
                className={`relative min-h-[40px] cursor-pointer rounded-[8px] p-2 text-sm transition-colors aspect-square
                  ${isSelected || isEnd ? "bg-[#484848] text-white" : inRange ? "bg-[#2A244E29]" : isPast ? "cursor-not-allowed bg-transparent text-[#c7c4c9]" : "bg-[#F1F2F447] hover:bg-gray-200"}
                `}
              >
                {day.getDate()}
                {isSelected ? <span className="absolute top-1/2 -translate-y-1/2 w-[6px] h-1/2 rounded-[4px] left-[-4px] bg-[#484848] border border-white" /> : null}
                {isEnd ? <span className="absolute top-1/2 -translate-y-1/2 w-[6px] h-1/2 rounded-[4px] right-[-4px] bg-[#484848] border border-white" /> : null}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (!showDatepicker) return null;

  return (
    <div ref={calendarRef} className="absolute left-1/2 mt-[16px] max-h-[min(660px,calc(100vh-190px))] w-[calc(100vw-48px)] max-w-[850px] -translate-x-1/2 overflow-y-auto rounded-[20px] bg-white px-[24px] py-[24px] calender-shadow">
      <div className="flex items-center justify-between mb-4">
        <button aria-label="Previous month" className="flex size-[44px] cursor-pointer items-center justify-center rounded-full hover:bg-[#f5f3f6]" onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}>
          <ChevronLeft />
        </button>
        <span className="text-[18px] font-bold text-[#222222]">
          {isSubscription
            ? "Choose subscription start"
            : selectionStage === "pickup"
              ? "Choose pickup date"
              : "Choose return date"}
        </span>
        <button aria-label="Next month" className="flex size-[44px] cursor-pointer items-center justify-center rounded-full hover:bg-[#f5f3f6]" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight />
        </button>
      </div>

      {!isSubscription && (
        <div className="mb-[20px] grid grid-cols-2 rounded-[14px] bg-[#f1eff3] p-[4px]">
          <button
            type="button"
            onClick={() => setSelectionStage?.("pickup")}
            className={`min-h-[48px] rounded-[11px] px-[14px] text-left transition-colors ${
              selectionStage === "pickup"
                ? "bg-white text-[#29252f] shadow-sm"
                : "text-[#6f6973]"
            }`}
          >
            <span className="block text-[11px] font-bold uppercase tracking-[0.08em]">Pickup</span>
            <span className="mt-[2px] block text-[13px] font-medium">
              {pickupDate ? format(pickupDate, "d MMM") : "Select date"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => pickupDate && setSelectionStage?.("dropoff")}
            disabled={!pickupDate}
            className={`min-h-[48px] rounded-[11px] px-[14px] text-left transition-colors ${
              selectionStage === "dropoff"
                ? "bg-white text-[#29252f] shadow-sm"
                : "text-[#6f6973]"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <span className="block text-[11px] font-bold uppercase tracking-[0.08em]">Return</span>
            <span className="mt-[2px] block text-[13px] font-medium">
              {dropoffDate ? format(dropoffDate, "d MMM") : "Select date"}
            </span>
          </button>
        </div>
      )}

      {isSubscription && (
        <div className="mb-[20px] flex items-center justify-between rounded-[12px] border border-[#e6e2ee] bg-[#faf9fc] px-[16px] py-[12px]">
          <div>
            <p className="text-[12px] font-bold text-[#29252f]">Expected duration</p>
            <p className="mt-[2px] text-[11px] text-[#717171]">
              Planning for {startingPeriodLabel(currentPlanType, subscriptionDuration)} from this date. You can extend later.
            </p>
          </div>
          <p className="text-[12px] font-medium text-[#5b476f]">
            No return date required
          </p>
        </div>
      )}

      <div className="flex justify-center gap-[24px]">
        <div className="flex-1">{renderCalendar(months[0])}</div>
        <span className="hidden w-[1px] h-[280px] bg-[#D9D9D9] lg:block" />
        <div className="hidden flex-1 lg:block">{renderCalendar(months[1])}</div>
      </div>

      <div className="mt-[24px]">
        <p className="font-medium text-[12px] text-[#3A3A3A]">Pickup time</p>
        <div className="flex flex-wrap gap-x-[16px] mt-[8px]">
          {times.map((t) => (
            <button
              key={t}
              onClick={() => {
                setPickupTime(t);
                setSelectedPickup(prev => ({ ...prev, time: t }));
                sessionStorage.setItem('selectedPickupTime', t);
              }}
              className={`min-h-[44px] flex-1 cursor-pointer rounded-[24px] border px-[16px] py-[6px] text-[12px] font-medium text-[#3A3A3A] transition-colors ${pickupTime === t ? "bg-[#DDDCE3] border-[#434249]" : "border-[#D9D9D9] hover:bg-gray-100"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {!isSubscription && <div>
        <p className="font-medium mt-[24px] text-[12px] text-[#3A3A3A]">Dropoff time</p>
        <div className="flex flex-wrap gap-x-[16px] mt-[8px]">
          {times.map((t) => (
            <button
              key={t}
              onClick={() => {
                setDropoffTime(t);
                setSelectedDropoff(prev => ({ ...prev, time: t }));
                sessionStorage.setItem('selectedDropoffTime', t);
              }}
              className={`min-h-[44px] flex-1 cursor-pointer rounded-[24px] border px-[16px] py-[6px] text-[12px] font-medium text-[#3A3A3A] transition-colors ${dropoffTime === t ? "bg-[#DDDCE3] border-[#434249]" : "border-[#D9D9D9] hover:bg-gray-100"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>}
    </div>
  );
}
