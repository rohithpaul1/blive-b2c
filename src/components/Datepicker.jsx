import { useRef, useEffect, useState, useContext } from "react";
import { addMonths, format, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SearchBarContext } from "../contexts/SearchBarContext";
import { RENTAL_MODES, addPlanDuration, planUnitLabel } from "../utils/subscription";

const times = ["9 AM", "10 AM", "11 AM", "12 PM", "2 PM", "3 PM"];

export default function DateTimePicker({ showDatepicker, setShowDatepicker, selectedPickup, setSelectedPickup, selectedDropoff, setSelectedDropoff }) {
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
    if (!pickupDate || (pickupDate && dropoffDate)) {
      setPickupDate(date);
      setSelectedPickup(prev => ({ ...prev, date }));
      sessionStorage.setItem('selectedPickupDate', date);
      setDropoffDate(null);
      setSelectedDropoff(() => ({}));
      sessionStorage.removeItem('selectedDropoffDate');
      
      // Check if we should auto-adjust dropoff date for weekly/monthly plans
      handlePickupDateChange(date);
    } else if (pickupDate && !dropoffDate) {
      if (date >= pickupDate) {
        setDropoffDate(date);
        setSelectedDropoff(prev => ({ ...prev, date }));
        sessionStorage.setItem('selectedDropoffDate', date);
        
        // Auto-detect plan type based on the complete date range
        autoAdjustPlanTypeFromDates(pickupDate, date);
      } else {
        setPickupDate(date);
        setSelectedPickup(prev => ({ ...prev, date }));
        sessionStorage.setItem('selectedPickupDate', date);
        setDropoffDate(null);
        setSelectedDropoff(() => ({}));
        sessionStorage.removeItem('selectedDropoffDate');
        
        // Check if we should auto-adjust dropoff date for weekly/monthly plans
        handlePickupDateChange(date);
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
        <div className="grid grid-cols-7 gap-[12px]">
          {days.map((day, i) => {
            if (!day) return <div key={i}></div>;
            const isSelected = pickupDate && format(day, "yyyy-MM-dd") === format(pickupDate, "yyyy-MM-dd");
            const inRange = pickupDate && dropoffDate && day >= pickupDate && day <= dropoffDate;
            const isEnd = dropoffDate && format(day, "yyyy-MM-dd") === format(dropoffDate, "yyyy-MM-dd");

            return (
              <button
                key={i}
                onClick={() => handleDateClick(day)}
                className={`relative cursor-pointer p-2 rounded-[4px] text-sm transition-all aspect-square
                  ${isSelected || isEnd ? "bg-[#484848] text-white" : inRange ? "bg-[#2A244E29]" : "bg-[#F1F2F447] hover:bg-gray-200"}
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

  return (
    <div ref={calendarRef} className={`absolute ${showDatepicker ? "mt-[35px] pt-[24px] pb-[32px] max-h-[660px]" : "mt-0 max-h-0"} w-[850px] px-[32px] overflow-hidden transition-all duration-500 left-1/2 -translate-x-1/2 rounded-[16px] bg-white calender-shadow`}>
      <div className="flex items-center justify-between mb-4">
        <button className="cursor-pointer" onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}>
          <ChevronLeft />
        </button>
        <span className="font-semibold text-[18px] font-bold text-[#222222]">
          {isSubscription ? "Choose subscription start" : "Select dates"}
        </span>
        <button className="cursor-pointer" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight />
        </button>
      </div>

      {isSubscription && (
        <div className="mb-[20px] flex items-center justify-between rounded-[12px] border border-[#e6e2ee] bg-[#faf9fc] px-[16px] py-[12px]">
          <div>
            <p className="text-[12px] font-bold text-[#29252f]">Minimum commitment</p>
            <p className="mt-[2px] text-[11px] text-[#717171]">
              {subscriptionDuration} {planUnitLabel(currentPlanType, subscriptionDuration)} from the selected start date
            </p>
          </div>
          <p className="text-[12px] font-medium text-[#5b476f]">
            Renews automatically
          </p>
        </div>
      )}

      <div className="flex justify-center gap-[24px]">
        <div className="flex-1">{renderCalendar(months[0])}</div>
        <span className="block w-[1px] h-[280px] bg-[#D9D9D9]" />
        <div className="flex-1">{renderCalendar(months[1])}</div>
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
              className={`flex-1 cursor-pointer h-[40px] px-[16px] py-[6px] rounded-[24px] border text-[12px] text-[#3A3A3A] font-medium transition-all ${pickupTime === t ? "bg-[#DDDCE3] border-[#434249]" : "border-[#D9D9D9] hover:bg-gray-100"}`}
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
              className={`flex-1 cursor-pointer h-[40px] px-[16px] py-[6px] rounded-[24px] border text-[12px] text-[#3A3A3A] font-medium transition-all ${dropoffTime === t ? "bg-[#DDDCE3] border-[#434249]" : "border-[#D9D9D9] hover:bg-gray-100"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>}
    </div>
  );
}
