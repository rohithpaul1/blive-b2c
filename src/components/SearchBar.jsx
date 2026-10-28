import { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Navigation,
  Repeat2,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { addMonths, eachDayOfInterval, endOfMonth, format, isBefore, isSameDay, startOfDay, startOfMonth } from "date-fns";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import Datepicker from "./Datepicker";
import LocationDropdown from "./LocationDropdown";
import TimeSlotPicker from "./TimeSlotPicker";
import { SearchBarContext } from "../contexts/SearchBarContext";
import { RENTAL_MODES, startingPeriodLabel } from "../utils/subscription";
import {
  DEFAULT_TIME,
  billableDays,
  firstOpenSlot,
  labelToMinutes,
  pickupSlotBlocked,
  returnSlotBlocked,
} from "../utils/timeSlots";

const LOCATIONS = [
  { name: "HSR Layout, Bengaluru", detail: "Popular pickup hub" },
  { name: "Jayanagar, Bengaluru", detail: "South Bengaluru" },
  { name: "Koramangala, Bengaluru", detail: "Central Bengaluru" },
  { name: "Indiranagar, Bengaluru", detail: "East Bengaluru" },
  { name: "Whitefield, Bengaluru", detail: "Near ITPL" },
  { name: "Electronic City, Bengaluru", detail: "South Bengaluru" },
];

const SUBSCRIPTION_DURATIONS = [1, 3, 6, 12];

const SearchBar = ({ onSearchPage, onSearchTrigger }) => {
  const [showLocation, setShowLocation] = useState(false);
  const [showDatepicker, setShowDatepicker] = useState(false);
  const [desktopExpanded, setDesktopExpanded] = useState(false);
  const [desktopDateStage, setDesktopDateStage] = useState("pickup");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileStep, setMobileStep] = useState("where");
  const [mobileLocationQuery, setMobileLocationQuery] = useState("");
  const [mobileCalendarMonth, setMobileCalendarMonth] = useState(() => startOfMonth(new Date()));
  const [mobileDateStage, setMobileDateStage] = useState("pickup");
  const searchContainerRef = useRef(null);
  const whenTabsRef = useRef(null);
  const timeSectionRef = useRef(null);
  const navigate = useNavigate();
  const {
    selectedPickup,
    selectedDropoff,
    selectedLocation,
    setSelectedPickup,
    setSelectedDropoff,
    setSelectedLocation,
    locationPermissionGranted,
    getUserLocation,
    detectPlanTypeFromDateRange,
    updateCurrentPlanType,
    rentalMode,
    setRentalMode,
    subscriptionDuration,
    setSubscriptionDuration,
    handlePickupDateChange,
    autoAdjustPlanTypeFromDates,
  } = useContext(SearchBarContext);
  const isSubscription = rentalMode === RENTAL_MODES.subscription;

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setMobileCalendarMonth(startOfMonth(selectedPickup?.date || new Date()));
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen, selectedPickup?.date]);

  useEffect(() => {
    if (!onSearchPage || !desktopExpanded) return undefined;

    const closeDesktopSearch = () => {
      setDesktopExpanded(false);
      setShowLocation(false);
      setShowDatepicker(false);
    };
    const handlePointerDown = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        closeDesktopSearch();
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeDesktopSearch();
    };
    const handleScroll = () => {
      if (window.scrollY > 24) closeDesktopSearch();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [desktopExpanded, onSearchPage]);

  const selectedSearchPlan = () =>
    isSubscription
      ? "monthly"
      : detectPlanTypeFromDateRange(
          selectedPickup?.date || null,
          selectedDropoff?.date || null
        );

  const formattedDate = (date, includeYear = true) => {
    if (!date) return "Add date";
    return new Date(date).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      ...(includeYear ? { year: "numeric" } : {}),
    });
  };

  const inputDate = (date) => {
    if (!date) return "";
    const value = new Date(date);
    const offset = value.getTimezoneOffset();
    return new Date(value.getTime() - offset * 60 * 1000)
      .toISOString()
      .slice(0, 10);
  };

  const searchSummary = useMemo(() => {
    if (isSubscription) {
      return `${formattedDate(selectedPickup?.date, false)} · ${startingPeriodLabel(
        "monthly",
        subscriptionDuration
      )}`;
    }
    return `${formattedDate(selectedPickup?.date, false)} – ${formattedDate(
      selectedDropoff?.date,
      false
    )}`;
  }, [isSubscription, selectedDropoff?.date, selectedPickup?.date, subscriptionDuration]);

  const handleModeChange = (mode) => {
    setRentalMode(mode);
    setShowLocation(false);
    setShowDatepicker(false);
    if (mode === RENTAL_MODES.subscription) {
      updateCurrentPlanType("monthly");
    }
    if (mobileOpen) {
      // Keep the rider's progress: only step back if the step no longer exists.
      setMobileStep((step) => (step === "duration" && mode !== RENTAL_MODES.subscription ? "when" : step));
      setMobileDateStage("pickup");
    }
  };

  const handleRentNow = () => {
    const planType = selectedSearchPlan();
    updateCurrentPlanType(planType);
    sessionStorage.setItem("selectedPlanType", planType);
    const planTypes = ["daily", "weekly", "monthly"];
    const tabIndex = Math.max(0, planTypes.indexOf(planType));
    sessionStorage.setItem("selectedTabIndex", tabIndex.toString());
    setMobileOpen(false);
    setDesktopExpanded(false);
    setShowLocation(false);
    setShowDatepicker(false);

    if (onSearchPage) {
      onSearchTrigger?.(planType, tabIndex);
      return;
    }

    const params = new URLSearchParams({
      mode: rentalMode,
      location: selectedLocation,
      pickup: inputDate(selectedPickup?.date),
      pickupTime: selectedPickup?.time || DEFAULT_TIME,
      plan: planType,
      ...(isSubscription
        ? { duration: String(subscriptionDuration) }
        : {
            dropoff: inputDate(selectedDropoff?.date),
            dropoffTime: selectedDropoff?.time || DEFAULT_TIME,
          }),
    });
    navigate(`/search?${params.toString()}`);
  };

  const openDesktopSearch = (section) => {
    setDesktopExpanded(true);
    setShowLocation(section === "location");
    setShowDatepicker(section === "dates");
    if (section === "dates") setDesktopDateStage("pickup");
  };

  const openDesktopDatepicker = (stage) => {
    setDesktopDateStage(stage);
    setShowDatepicker(true);
    setShowLocation(false);
  };

  const updatePickupDate = (date) => {
    if (!date) return;
    const nextDate = new Date(date);
    nextDate.setHours(10, 0, 0, 0);
    setSelectedPickup((previous) => ({ ...previous, date: nextDate }));
    sessionStorage.setItem("selectedPickupDate", nextDate.toISOString());
    handlePickupDateChange(nextDate);
  };

  const updateDropoffDate = (date) => {
    if (!date) return;
    const nextDate = new Date(date);
    nextDate.setHours(10, 0, 0, 0);
    setSelectedDropoff((previous) => ({ ...previous, date: nextDate }));
    sessionStorage.setItem("selectedDropoffDate", nextDate.toISOString());
    autoAdjustPlanTypeFromDates(selectedPickup?.date, nextDate);
  };

  const setPickupTime = (time) => {
    setSelectedPickup((previous) => ({ ...previous, time }));
    sessionStorage.setItem("selectedPickupTime", time);
  };

  const setDropoffTime = (time) => {
    setSelectedDropoff((previous) => ({ ...previous, time }));
    sessionStorage.setItem("selectedDropoffTime", time);
  };

  const scrollIntoSheet = (ref) => {
    // Wait a frame so the new stage has rendered before scrolling to it.
    requestAnimationFrame(() =>
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  };

  const isPickupSlotBlocked = (date) => (minutes) => Boolean(pickupSlotBlocked(date, minutes));
  const isReturnSlotBlocked = (pickup, returnDate) => (minutes) =>
    Boolean(returnSlotBlocked(pickup, returnDate, minutes));

  // Keep the pickup time bookable for the chosen date (e.g. today after 10 AM).
  const pickupTimeFor = (date, time = selectedPickup?.time) => {
    const blocked = isPickupSlotBlocked(date);
    const minutes = labelToMinutes(time);
    if (minutes !== null && !blocked(minutes)) return time;
    return firstOpenSlot(blocked) || time || DEFAULT_TIME;
  };

  const selectMobilePickupTime = (time) => {
    setPickupTime(time);
    if (isSubscription) {
      // A subscription ends at the same time of day it starts.
      setDropoffTime(time);
      return;
    }
    // Default the return to the same time: that keeps the rental to whole days.
    const pickup = { date: selectedPickup?.date, time };
    const returnBlocked = isReturnSlotBlocked(pickup, selectedDropoff?.date);
    const minutes = labelToMinutes(time);
    setDropoffTime(
      minutes !== null && !returnBlocked(minutes) ? time : firstOpenSlot(returnBlocked) || time
    );
    setMobileDateStage("dropoff");
    scrollIntoSheet(whenTabsRef);
  };

  const selectLocation = (location) => {
    setSelectedLocation(location);
    sessionStorage.setItem("selectedLocation", location);
    setMobileLocationQuery("");
    setMobileStep("when");
  };

  const clearMobileSearch = () => {
    const pickup = new Date();
    pickup.setHours(10, 0, 0, 0);
    const dropoff = new Date(pickup);
    if (isSubscription) dropoff.setMonth(dropoff.getMonth() + 1);
    else dropoff.setDate(dropoff.getDate() + 1);
    setSubscriptionDuration(1);
    setSelectedLocation("HSR Layout, Bengaluru");
    setSelectedPickup({ date: pickup, time: DEFAULT_TIME });
    setSelectedDropoff({ date: dropoff, time: DEFAULT_TIME });
    setMobileLocationQuery("");
    setMobileCalendarMonth(startOfMonth(pickup));
    setMobileDateStage("pickup");
    setMobileStep("where");
    sessionStorage.setItem("selectedLocation", "HSR Layout, Bengaluru");
    sessionStorage.setItem("selectedPickupDate", pickup.toISOString());
    sessionStorage.setItem("selectedDropoffDate", dropoff.toISOString());
    sessionStorage.setItem("selectedPickupTime", DEFAULT_TIME);
    sessionStorage.setItem("selectedDropoffTime", DEFAULT_TIME);
  };

  const modeSwitch = (mobile = false) => (
    <div
      className={mobile ? "grid w-full grid-cols-3 gap-[6px]" : "flex items-center gap-[8px]"}
      role="tablist"
      aria-label="Rental journey"
    >
      {[
        [RENTAL_MODES.fixed, "Fixed rental", <CalendarDays key="fixed-icon" className="size-[17px]" aria-hidden="true" />],
        [RENTAL_MODES.subscription, "Subscription", <Repeat2 key="subscription-icon" className="size-[17px]" aria-hidden="true" />],
      ].map(([mode, label, icon]) => (
        <button
          key={mode}
          type="button"
          onClick={() => handleModeChange(mode)}
          className={`flex min-h-[44px] items-center justify-center rounded-full border font-bold transition-colors ${
            mobile ? "gap-[5px] px-[8px] text-[12px]" : "gap-[8px] px-[18px] text-[13px]"
          } ${
            rentalMode === mode
              ? "border-[#2f2350] bg-[#2f2350] text-white"
              : "border-transparent bg-[#f3f2f4] text-[#514d56] hover:bg-[#ebe9ed]"
          }`}
          aria-selected={rentalMode === mode}
          role="tab"
        >
          {icon}
          {mobile && mode === RENTAL_MODES.fixed ? "Fixed" : label}
        </button>
      ))}
      <button
        type="button"
        onClick={() => {
          setMobileOpen(false);
          navigate("/business");
        }}
        className={`flex min-h-[44px] items-center justify-center rounded-full border border-transparent bg-[#f3f2f4] font-bold text-[#514d56] transition-colors hover:bg-[#ebe9ed] ${
          mobile ? "gap-[5px] px-[8px] text-[12px]" : "gap-[8px] px-[18px] text-[13px]"
        }`}
        role="tab"
        aria-selected="false"
      >
        <Building2 className="size-[17px]" aria-hidden="true" />
        {mobile ? "Business" : "For business"}
      </button>
    </div>
  );

  const desktopFieldClass =
    "flex min-h-[66px] min-w-0 items-center gap-[12px] rounded-[14px] border border-[#dedce1] bg-white px-[16px] text-left transition-colors hover:border-[#9d92b6] hover:bg-[#fbfafc]";

  const filteredLocations = LOCATIONS.filter((location) =>
    location.name.toLowerCase().includes(mobileLocationQuery.trim().toLowerCase())
  );

  const calendarDays = useMemo(() => {
    const firstDay = startOfMonth(mobileCalendarMonth);
    const days = eachDayOfInterval({
      start: firstDay,
      end: endOfMonth(mobileCalendarMonth),
    });
    const cells = [...Array(firstDay.getDay()).fill(null), ...days];
    // Drop whole weeks that are already in the past so today's week sits at the top.
    const today = startOfDay(new Date());
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    const firstUseful = weeks.findIndex((week) => week.some((d) => d && !isBefore(d, today)));
    return (firstUseful > 0 ? weeks.slice(firstUseful) : weeks).flat();
  }, [mobileCalendarMonth]);

  // Pick a date, then its time: the time chips sit under the calendar, so after
  // each date tap the sheet scrolls down to them. Picking the pickup time moves
  // on to the return.
  const handleMobileDateClick = (date) => {
    if (isSubscription) {
      updatePickupDate(date);
      const time = pickupTimeFor(date, DEFAULT_TIME);
      setPickupTime(time);
      setDropoffTime(time);
      scrollIntoSheet(timeSectionRef);
      return;
    }

    if (
      mobileDateStage === "pickup" ||
      isBefore(startOfDay(date), startOfDay(selectedPickup?.date || new Date()))
    ) {
      const nextDate = new Date(date);
      nextDate.setHours(10, 0, 0, 0);
      setSelectedPickup((previous) => ({ ...previous, date: nextDate }));
      setSelectedDropoff((previous) => ({ ...previous, date: null }));
      sessionStorage.setItem("selectedPickupDate", nextDate.toISOString());
      sessionStorage.removeItem("selectedDropoffDate");
      setPickupTime(pickupTimeFor(nextDate, DEFAULT_TIME));
      setMobileDateStage("pickup");
      scrollIntoSheet(timeSectionRef);
      return;
    }

    updateDropoffDate(date);
    const returnBlocked = isReturnSlotBlocked(selectedPickup, date);
    const wanted = selectedDropoff?.time || selectedPickup?.time || DEFAULT_TIME;
    const wantedMinutes = labelToMinutes(wanted);
    setDropoffTime(
      wantedMinutes !== null && !returnBlocked(wantedMinutes)
        ? wanted
        : firstOpenSlot(returnBlocked) || wanted
    );
    scrollIntoSheet(timeSectionRef);
  };

  // Opening the sheet on today with a time that has already passed: move to the next open slot.
  useEffect(() => {
    if (!mobileOpen || !selectedPickup?.date) return;
    const next = pickupTimeFor(selectedPickup.date);
    if (next && next !== selectedPickup.time) {
      setPickupTime(next);
      if (isSubscription) setDropoffTime(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileOpen, selectedPickup?.date]);

  const pickupTimeLabel = selectedPickup?.time || DEFAULT_TIME;
  const dropoffTimeLabel = selectedDropoff?.time || pickupTimeLabel;
  const rentalDays = isSubscription
    ? 0
    : billableDays(selectedPickup?.date, pickupTimeLabel, selectedDropoff?.date, dropoffTimeLabel);
  const daysAtPickupTime = isSubscription
    ? 0
    : billableDays(selectedPickup?.date, pickupTimeLabel, selectedDropoff?.date, pickupTimeLabel);
  const dayCount = (n) => `${n} ${n === 1 ? "day" : "days"}`;
  const dateTime = (date, time) =>
    date ? `${formattedDate(date, false)}, ${time}` : "Add date";

  const timePicker =
    isSubscription || mobileDateStage === "pickup"
      ? {
          title: `Pickup time · ${formattedDate(selectedPickup?.date, false)}`,
          value: pickupTimeLabel,
          onSelect: selectMobilePickupTime,
          isBlocked: isPickupSlotBlocked(selectedPickup?.date),
          warning: null,
        }
      : {
          title: selectedDropoff?.date
            ? `Return time · ${formattedDate(selectedDropoff.date, false)}`
            : "Return time",
          value: dropoffTimeLabel,
          onSelect: setDropoffTime,
          isBlocked: isReturnSlotBlocked(selectedPickup, selectedDropoff?.date),
          warning:
            selectedDropoff?.date && rentalDays > daysAtPickupTime
              ? `Returning after ${pickupTimeLabel} adds a day.`
              : null,
        };

  const isCalendarDaySelected = (date) => {
    if (!date) return false;
    return (
      (selectedPickup?.date && isSameDay(date, selectedPickup.date)) ||
      (!isSubscription && selectedDropoff?.date && isSameDay(date, selectedDropoff.date))
    );
  };

  const isCalendarDayInRange = (date) =>
    !isSubscription &&
    selectedPickup?.date &&
    selectedDropoff?.date &&
    date > startOfDay(selectedPickup.date) &&
    date < startOfDay(selectedDropoff.date);

  const mobileFooterAction = () => {
    if (mobileStep === "where") {
      setMobileStep("when");
      return;
    }
    if (mobileStep === "when" && isSubscription) {
      setMobileStep("duration");
      return;
    }
    handleRentNow();
  };

  const mobileFooterLabel =
    mobileStep === "where" || (mobileStep === "when" && isSubscription)
      ? "Next"
      : "Show vehicles";

  return (
    <div
      ref={searchContainerRef}
      className={`z-40 ${
        onSearchPage
          ? "relative w-full max-w-[700px]"
          : "absolute left-1/2 bottom-0 w-[calc(100%_-_32px)] max-w-[1160px] -translate-x-1/2 translate-y-1/2 md:w-[calc(100%_-_40px)]"
      }`}
    >
      <button
        type="button"
        onClick={() => {
          setMobileOpen(true);
          setMobileStep("where");
        }}
        className={`flex min-h-[62px] w-full items-center gap-[12px] rounded-full border bg-white p-[8px] pl-[16px] text-left md:hidden ${onSearchPage ? "border-[#dddddd] shadow-[0_2px_8px_rgba(0,0,0,0.07)]" : "border-[#e7e5e8] shadow-[0_8px_24px_rgba(16,24,40,0.12)]"}`}
        aria-label="Open vehicle search"
      >
        <Search className="size-[20px] shrink-0 text-[#351a75]" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          {onSearchPage ? (
            <>
              <span className="block truncate text-[14px] font-bold text-[#262626]">
                {selectedLocation}
              </span>
              <span className="block truncate text-[12px] text-[#686868]">
                {isSubscription ? "Subscription" : "Fixed rental"} · {searchSummary}
              </span>
            </>
          ) : (
            <span className="block truncate text-[15px] font-bold text-[#262626]">
              Start your search
            </span>
          )}
        </span>
        <span className="flex size-[46px] shrink-0 items-center justify-center rounded-full border border-[#e1dce7] bg-[#f8f6fa] text-[#351a75]">
          <SlidersHorizontal className="size-[18px]" aria-hidden="true" />
        </span>
      </button>

      {onSearchPage && !desktopExpanded && (
        <div className="hidden min-h-[54px] w-full items-center rounded-full border border-[#dedce1] bg-white p-[5px] pl-[8px] shadow-[0_5px_18px_rgba(24,18,32,0.12)] transition-shadow hover:shadow-[0_7px_22px_rgba(24,18,32,0.16)] md:flex">
          <button
            type="button"
            onClick={() => openDesktopSearch("location")}
            className="flex min-w-0 flex-1 items-center gap-[8px] rounded-full px-[10px] py-[8px] text-left hover:bg-[#f7f6f8]"
          >
            <MapPin className="size-[17px] shrink-0 text-[#351a75]" aria-hidden="true" />
            <span className="truncate text-[13px] font-bold text-[#29262b]">
              {selectedLocation.split(",")[0]}
            </span>
          </button>
          <span className="h-[26px] w-px shrink-0 bg-[#e4e1e6]" aria-hidden="true" />
          <button
            type="button"
            onClick={() => openDesktopSearch("dates")}
            className="min-w-0 flex-1 rounded-full px-[12px] py-[8px] text-left hover:bg-[#f7f6f8]"
          >
            <span className="block truncate text-[13px] font-bold text-[#29262b]">
              {isSubscription
                ? `Starts ${formattedDate(selectedPickup?.date, false)}`
                : searchSummary}
            </span>
          </button>
          <span className="h-[26px] w-px shrink-0 bg-[#e4e1e6]" aria-hidden="true" />
          <button
            type="button"
            onClick={() => openDesktopSearch("mode")}
            className="hidden min-w-0 flex-1 rounded-full px-[12px] py-[8px] text-left hover:bg-[#f7f6f8] lg:block"
          >
            <span className="block truncate text-[13px] font-medium text-[#656068]">
              {isSubscription
                ? `${subscriptionDuration} ${Number(subscriptionDuration) === 1 ? "month" : "months"}`
                : "Fixed rental"}
            </span>
          </button>
          <button
            type="button"
            onClick={handleRentNow}
            className="flex size-[44px] shrink-0 items-center justify-center rounded-full bg-[#351a75] text-white transition-colors hover:bg-[#2c155f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351a75]"
            aria-label="Search vehicles"
          >
            <Search className="size-[18px]" aria-hidden="true" />
          </button>
        </div>
      )}

      {onSearchPage && desktopExpanded && (
        <button
          type="button"
          className="fixed inset-0 top-[68px] z-40 hidden cursor-default bg-black/20 backdrop-blur-[1px] md:block"
          onClick={() => {
            setDesktopExpanded(false);
            setShowLocation(false);
            setShowDatepicker(false);
          }}
          aria-label="Close search"
        />
      )}

      <div
        className={`${
          onSearchPage
            ? desktopExpanded
              ? "fixed left-1/2 top-[78px] z-[51] block w-[min(1160px,calc(100vw-40px))] -translate-x-1/2"
              : "hidden"
            : "hidden md:block"
        }`}
      >
      <div className="rounded-[22px] border border-[#dedbe2] bg-white p-[18px] shadow-[0_16px_44px_rgba(16,24,40,0.16)]">
        <div className="flex items-center justify-between gap-[16px]">
          {modeSwitch()}
          <div className="flex items-center gap-[12px]">
            <p className="text-[12px] text-[#716c75]">
              {isSubscription
                ? "Choose a start date and how long you expect to ride."
                : "Choose your pickup and return dates."}
            </p>
            {onSearchPage && (
              <button
                type="button"
                onClick={() => {
                  setDesktopExpanded(false);
                  setShowLocation(false);
                  setShowDatepicker(false);
                }}
                className="flex size-[38px] shrink-0 items-center justify-center rounded-full border border-[#e2dfe4] text-[#504b52] transition-colors hover:bg-[#f5f3f6]"
                aria-label="Collapse search"
              >
                <X className="size-[18px]" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div className={`mt-[16px] grid gap-[10px] ${isSubscription ? "grid-cols-[1.5fr_1fr_1fr_auto]" : "grid-cols-[1.5fr_1fr_1fr_auto]"}`}>
          <button
            id="location"
            type="button"
            onClick={() => {
              setShowLocation((open) => !open);
              setShowDatepicker(false);
            }}
            className={desktopFieldClass}
          >
            <MapPin className="size-[20px] shrink-0 text-[#351a75]" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-bold text-[#4c4750]">Pickup location</span>
              <span className="mt-[2px] block truncate text-[14px] font-medium text-[#262626]">
                {selectedLocation}
              </span>
            </span>
            <ChevronDown className="size-[17px] shrink-0 text-[#6f6973]" aria-hidden="true" />
          </button>

          <button
            id="pickup-btn"
            type="button"
            onClick={() => openDesktopDatepicker("pickup")}
            className={desktopFieldClass}
          >
            <CalendarDays className="size-[20px] shrink-0 text-[#351a75]" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-[12px] font-bold text-[#4c4750]">
                {isSubscription ? "Start date" : "Pickup date"}
              </span>
              <span className="mt-[2px] block truncate text-[14px] font-medium text-[#262626]">
                {formattedDate(selectedPickup?.date)}
              </span>
            </span>
          </button>

          {isSubscription ? (
            <label className={`${desktopFieldClass} cursor-pointer`}>
              <Clock3 className="size-[20px] shrink-0 text-[#351a75]" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-bold text-[#4c4750]">How long?</span>
                <select
                  aria-label="Expected subscription duration"
                  value={subscriptionDuration}
                  onChange={(event) => setSubscriptionDuration(event.target.value)}
                  className="mt-[1px] w-full appearance-none bg-transparent text-[14px] font-medium text-[#262626] outline-none"
                >
                  {SUBSCRIPTION_DURATIONS.map((duration) => (
                    <option key={duration} value={duration}>
                      About {duration} {duration === 1 ? "month" : "months"}
                    </option>
                  ))}
                </select>
              </span>
              <ChevronDown className="size-[17px] shrink-0 text-[#6f6973]" aria-hidden="true" />
            </label>
          ) : (
            <button
              id="dropoff-btn"
              type="button"
              onClick={() => openDesktopDatepicker("dropoff")}
              className={desktopFieldClass}
            >
              <CalendarDays className="size-[20px] shrink-0 text-[#351a75]" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-[12px] font-bold text-[#4c4750]">Return date</span>
                <span className="mt-[2px] block truncate text-[14px] font-medium text-[#262626]">
                  {formattedDate(selectedDropoff?.date)}
                </span>
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRentNow}
            className="flex min-h-[66px] min-w-[156px] items-center justify-center gap-[9px] rounded-[14px] bg-[#351a75] px-[24px] text-[14px] font-bold text-white transition-colors hover:bg-[#2c155f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351a75]"
          >
            <Search className="size-[19px]" aria-hidden="true" />
            Show vehicles
          </button>
        </div>
      </div>

      <LocationDropdown
        showLocation={showLocation}
        setShowLocation={setShowLocation}
        setSelectedLocation={setSelectedLocation}
        locationPermissionGranted={locationPermissionGranted}
        getUserLocation={getUserLocation}
      />
      <Datepicker
        showDatepicker={showDatepicker}
        setShowDatepicker={setShowDatepicker}
        selectedPickup={selectedPickup}
        setSelectedPickup={setSelectedPickup}
        selectedDropoff={selectedDropoff}
        setSelectedDropoff={setSelectedDropoff}
        selectionStage={desktopDateStage}
        setSelectionStage={setDesktopDateStage}
      />
      </div>

      {mobileOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex flex-col bg-[#f7f7f8] md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Search vehicles"
          >
            <div className="bg-[#f7f7f8] px-[16px] pb-[8px] pt-[max(12px,env(safe-area-inset-top))]">
              <div className="grid grid-cols-[44px_1fr_44px] items-center gap-[8px]">
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex size-[40px] items-center justify-center rounded-full border border-[#dddddd] bg-white"
                  aria-label="Close search"
                >
                  <X className="size-[18px]" aria-hidden="true" />
                </button>
                {/* One segmented control for the two rental types; the sheet's step titles carry the hierarchy */}
                <div className="mx-auto grid w-full max-w-[260px] grid-cols-2 rounded-full bg-[#ebebeb] p-[3px]" role="tablist" aria-label="Rental type">
                  {[
                    [RENTAL_MODES.fixed, "Fixed rental"],
                    [RENTAL_MODES.subscription, "Subscription"],
                  ].map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      role="tab"
                      aria-selected={rentalMode === mode}
                      onClick={() => handleModeChange(mode)}
                      className={`min-h-[36px] rounded-full text-[14px] font-medium transition-colors ${
                        rentalMode === mode ? "bg-white text-[#222222] shadow-[0_1px_4px_rgba(0,0,0,0.12)]" : "text-[#6a6a6a]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <span aria-hidden="true" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-[12px] pb-[150px] pt-[8px] [scrollbar-width:none]">
              <section
                className={`overflow-hidden rounded-[20px] border bg-white transition-shadow ${
                  mobileStep === "where"
                    ? "border-[#e3e3e3] shadow-[0_6px_20px_rgba(0,0,0,0.08)]"
                    : "border-[#e6e6e6]"
                }`}
              >
                {mobileStep !== "where" ? (
                  <button
                    type="button"
                    onClick={() => setMobileStep("where")}
                    className="flex min-h-[60px] w-full items-center justify-between gap-[16px] px-[20px] text-left"
                  >
                    <span className="text-[14px] text-[#6a6a6a]">Where</span>
                    <span className="truncate text-[14px] font-bold text-[#222222]">{selectedLocation}</span>
                  </button>
                ) : (
                  <div className="p-[20px]">
                    <h2 className="text-[22px] font-bold text-[#222222]">Where?</h2>
                    <label className="mt-[14px] flex min-h-[52px] items-center gap-[10px] rounded-[12px] border border-[#b0b0b0] bg-white px-[14px] focus-within:border-[#222222] focus-within:ring-1 focus-within:ring-[#222222]">
                      <Search className="size-[20px] shrink-0 text-[#222222]" aria-hidden="true" />
                      <input
                        value={mobileLocationQuery}
                        onChange={(event) => setMobileLocationQuery(event.target.value)}
                        placeholder="Search city or pickup hub"
                        className="min-w-0 flex-1 bg-transparent text-[16px] text-[#252126] outline-none placeholder:text-[#716c75]"
                        autoFocus
                      />
                    </label>

                    <p className="mt-[18px] text-[13px] font-medium text-[#6a6a6a]">Suggested</p>
                    <div className="mt-[8px]">
                      {!locationPermissionGranted && (
                        <button
                          type="button"
                          onClick={() => {
                            getUserLocation();
                            setMobileStep("when");
                          }}
                          className="flex min-h-[60px] w-full items-center gap-[14px] rounded-[12px] px-[2px] text-left hover:bg-[#f7f7f7]"
                        >
                          <span className="flex size-[44px] shrink-0 items-center justify-center rounded-[12px] bg-[#f2f2f2] text-[#222222]">
                            <Navigation className="size-[19px]" aria-hidden="true" />
                          </span>
                          <span>
                            <span className="block text-[15px] font-medium text-[#222222]">Near me</span>
                            <span className="mt-[1px] block text-[13px] text-[#6a6a6a]">Use your current location</span>
                          </span>
                        </button>
                      )}
                      {filteredLocations.map((location) => (
                        <button
                          key={location.name}
                          type="button"
                          onClick={() => selectLocation(location.name)}
                          className="flex min-h-[60px] w-full items-center gap-[14px] rounded-[12px] px-[2px] text-left hover:bg-[#f7f7f7]"
                        >
                          <span className="flex size-[44px] shrink-0 items-center justify-center rounded-[12px] bg-[#f2f2f2] text-[#222222]">
                            <MapPin className="size-[19px]" aria-hidden="true" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[15px] font-medium text-[#222222]">{location.name}</span>
                            <span className="mt-[1px] block text-[13px] text-[#6a6a6a]">{location.detail}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section
                className={`mt-[12px] overflow-hidden rounded-[20px] border bg-white transition-shadow ${
                  mobileStep === "when"
                    ? "border-[#e3e3e3] shadow-[0_6px_20px_rgba(0,0,0,0.08)]"
                    : "border-[#e6e6e6]"
                }`}
              >
                {mobileStep !== "when" ? (
                  <button
                    type="button"
                    onClick={() => setMobileStep("when")}
                    className="flex min-h-[60px] w-full items-center justify-between gap-[16px] px-[20px] text-left"
                  >
                    <span className="text-[14px] text-[#6a6a6a]">When</span>
                    <span className="text-right text-[14px] font-bold text-[#222222]">
                      {isSubscription
                        ? dateTime(selectedPickup?.date, pickupTimeLabel)
                        : `${dateTime(selectedPickup?.date, pickupTimeLabel)} – ${dateTime(selectedDropoff?.date, dropoffTimeLabel)}`}
                    </span>
                  </button>
                ) : (
                  <div className="p-[20px]">
                    <h2 className="text-[22px] font-bold text-[#222222]">When?</h2>
                    {!isSubscription && (
                      <div ref={whenTabsRef} className="mt-[14px] grid scroll-mt-[16px] grid-cols-2 rounded-full bg-[#ebebeb] p-[3px]">
                        {[
                          ["pickup", "Pickup", dateTime(selectedPickup?.date, pickupTimeLabel)],
                          ["dropoff", "Return", dateTime(selectedDropoff?.date, dropoffTimeLabel)],
                        ].map(([stage, label, value]) => (
                          <button
                            key={stage}
                            type="button"
                            onClick={() => setMobileDateStage(stage)}
                            aria-pressed={mobileDateStage === stage}
                            className={`min-h-[52px] rounded-full px-[8px] py-[6px] text-center ${
                              mobileDateStage === stage
                                ? "bg-white text-[#222222] shadow-[0_1px_4px_rgba(0,0,0,0.12)]"
                                : "text-[#6a6a6a]"
                            }`}
                          >
                            <span className="block text-[12px] font-medium text-[#6a6a6a]">{label}</span>
                            <span className="mt-[1px] block truncate text-[14px] font-bold">{value}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {isSubscription && (
                      <p className="mt-[4px] text-[14px] text-[#6a6a6a]">Choose the day your subscription starts.</p>
                    )}

                    <div className="mt-[20px] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setMobileCalendarMonth((month) => addMonths(month, -1))}
                        className="flex size-[40px] items-center justify-center rounded-full hover:bg-[#f3f1f4]"
                        aria-label="Previous month"
                      >
                        <ChevronLeft className="size-[20px]" aria-hidden="true" />
                      </button>
                      <p className="text-[16px] font-bold text-[#222222]">{format(mobileCalendarMonth, "MMMM yyyy")}</p>
                      <button
                        type="button"
                        onClick={() => setMobileCalendarMonth((month) => addMonths(month, 1))}
                        className="flex size-[40px] items-center justify-center rounded-full hover:bg-[#f3f1f4]"
                        aria-label="Next month"
                      >
                        <ChevronRight className="size-[20px]" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="mt-[12px] grid grid-cols-7 text-center text-[12px] font-medium text-[#6a6a6a]">
                      {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                        <span key={`${day}-${index}`}>{day}</span>
                      ))}
                    </div>
                    <div className="mt-[8px] grid grid-cols-7 gap-y-[4px]">
                      {calendarDays.map((day, index) => {
                        if (!day) return <span key={`empty-${index}`} />;
                        const disabled = isBefore(startOfDay(day), startOfDay(new Date()));
                        const selected = isCalendarDaySelected(day);
                        const inRange = isCalendarDayInRange(day);
                        // A continuous grey band runs from pickup to return, like Airbnb's range picker.
                        const hasRange =
                          !isSubscription &&
                          selectedPickup?.date &&
                          selectedDropoff?.date &&
                          !isSameDay(selectedPickup.date, selectedDropoff.date);
                        const isStart = hasRange && isSameDay(day, selectedPickup.date);
                        const isEnd = hasRange && isSameDay(day, selectedDropoff.date);
                        const band = inRange
                          ? "bg-[#f0f0f0]"
                          : isStart
                            ? "bg-[linear-gradient(to_right,transparent_50%,#f0f0f0_50%)]"
                            : isEnd
                              ? "bg-[linear-gradient(to_left,transparent_50%,#f0f0f0_50%)]"
                              : "";
                        return (
                          <div key={day.toISOString()} className={`flex justify-center ${band}`}>
                            <button
                              type="button"
                              disabled={disabled}
                              onClick={() => handleMobileDateClick(day)}
                              aria-pressed={selected}
                              className={`flex size-[44px] items-center justify-center rounded-full text-[15px] font-medium transition-colors ${
                                selected
                                  ? "bg-[#222222] text-white"
                                  : disabled
                                    ? "cursor-not-allowed text-[#c4c4c4] line-through decoration-[#d0d0d0]"
                                    : "text-[#222222] hover:border hover:border-[#222222]"
                              }`}
                            >
                              {format(day, "d")}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <TimeSlotPicker ref={timeSectionRef} {...timePicker} />
                  </div>
                )}
              </section>

              {isSubscription && (
                <section
                  className={`mt-[12px] overflow-hidden rounded-[20px] border bg-white transition-shadow ${
                    mobileStep === "duration"
                      ? "border-[#e3e3e3] shadow-[0_6px_20px_rgba(0,0,0,0.08)]"
                      : "border-[#e6e6e6]"
                  }`}
                >
                  {mobileStep !== "duration" ? (
                    <button
                      type="button"
                      onClick={() => setMobileStep("duration")}
                      className="flex min-h-[60px] w-full items-center justify-between gap-[16px] px-[20px] text-left"
                    >
                      <span className="text-[14px] text-[#6a6a6a]">How long</span>
                      <span className="text-[14px] font-bold text-[#222222]">
                        About {subscriptionDuration} {Number(subscriptionDuration) === 1 ? "month" : "months"}
                      </span>
                    </button>
                  ) : (
                    <div className="p-[20px]">
                      <h2 className="text-[22px] font-bold text-[#222222]">How long?</h2>
                      <p className="mt-[4px] text-[14px] leading-[1.45] text-[#6a6a6a]">
                        This helps us show the best subscription. You can extend it later.
                      </p>
                      <div className="mt-[20px] grid grid-cols-2 gap-[10px]">
                        {SUBSCRIPTION_DURATIONS.map((duration) => (
                          <button
                            key={duration}
                            type="button"
                            onClick={() => setSubscriptionDuration(duration)}
                            aria-pressed={Number(subscriptionDuration) === duration}
                            className={`min-h-[68px] rounded-[14px] px-[12px] text-left text-[#222222] transition-colors ${
                              Number(subscriptionDuration) === duration
                                ? "border-2 border-[#222222] bg-[#f7f7f7]"
                                : "border border-[#dddddd] bg-white"
                            }`}
                          >
                            <span className="block text-[15px] font-bold">{duration} {duration === 1 ? "month" : "months"}</span>
                            <span className="mt-[2px] block whitespace-nowrap text-[13px] text-[#6a6a6a]">
                              Until {formattedDate(
                                (() => {
                                  const date = new Date(selectedPickup?.date || new Date());
                                  date.setMonth(date.getMonth() + duration);
                                  return date;
                                })(),
                                false
                              )}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  navigate("/business");
                }}
                className="mx-auto mt-[20px] flex min-h-[44px] items-center gap-[8px] px-[8px] text-[14px] font-medium text-[#222222]"
              >
                <Building2 className="size-[17px]" aria-hidden="true" />
                <span className="underline underline-offset-4">Renting for a business?</span>
              </button>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#e4e1e6] bg-white px-[20px] pb-[max(16px,env(safe-area-inset-bottom))] pt-[12px]">
              {mobileStep === "when" && (
                <div className="mb-[10px] flex items-center justify-between gap-[12px] text-[13px]">
                  <span className="min-w-0 truncate text-[#555555]">
                    {isSubscription
                      ? `Starts ${dateTime(selectedPickup?.date, pickupTimeLabel)}`
                      : `${dateTime(selectedPickup?.date, pickupTimeLabel)} → ${dateTime(selectedDropoff?.date, dropoffTimeLabel)}`}
                  </span>
                  {!isSubscription && selectedDropoff?.date && (
                    <span className="shrink-0 rounded-full bg-[#f0f0f0] px-[10px] py-[3px] font-bold text-[#222222]">
                      {dayCount(rentalDays)}
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between gap-[16px]">
              <button
                type="button"
                onClick={clearMobileSearch}
                className="min-h-[48px] px-[2px] text-[15px] font-bold text-[#222222] underline underline-offset-4"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={mobileFooterAction}
                className="flex min-h-[52px] min-w-[150px] items-center justify-center gap-[9px] rounded-[12px] bg-[#351a75] px-[22px] text-[16px] font-bold text-white"
              >
                {mobileFooterLabel === "Show vehicles" && <Search className="size-[18px]" aria-hidden="true" />}
                {mobileFooterLabel}
                {mobileFooterLabel === "Next" && <ChevronRight className="size-[18px]" aria-hidden="true" />}
              </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default SearchBar;
