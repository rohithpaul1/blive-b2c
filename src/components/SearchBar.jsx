import { useContext, useEffect, useMemo, useState } from "react";
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
import { SearchBarContext } from "../contexts/SearchBarContext";
import { RENTAL_MODES, startingPeriodLabel } from "../utils/subscription";

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileStep, setMobileStep] = useState("where");
  const [mobileLocationQuery, setMobileLocationQuery] = useState("");
  const [mobileCalendarMonth, setMobileCalendarMonth] = useState(() => startOfMonth(new Date()));
  const [mobileDateStage, setMobileDateStage] = useState("pickup");
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
      setMobileStep("where");
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

    if (onSearchPage) {
      onSearchTrigger?.(planType, tabIndex);
      return;
    }

    const params = new URLSearchParams({
      mode: rentalMode,
      location: selectedLocation,
      pickup: inputDate(selectedPickup?.date),
      plan: planType,
      ...(isSubscription
        ? { duration: String(subscriptionDuration) }
        : { dropoff: inputDate(selectedDropoff?.date) }),
    });
    navigate(`/search?${params.toString()}`);
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
    setSelectedPickup({ date: pickup, time: "10 AM" });
    setSelectedDropoff({ date: dropoff, time: "10 AM" });
    setMobileLocationQuery("");
    setMobileCalendarMonth(startOfMonth(pickup));
    setMobileDateStage("pickup");
    setMobileStep("where");
    sessionStorage.setItem("selectedLocation", "HSR Layout, Bengaluru");
    sessionStorage.setItem("selectedPickupDate", pickup.toISOString());
    sessionStorage.setItem("selectedDropoffDate", dropoff.toISOString());
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
    return [...Array(firstDay.getDay()).fill(null), ...days];
  }, [mobileCalendarMonth]);

  const handleMobileDateClick = (date) => {
    if (isSubscription) {
      updatePickupDate(date);
      return;
    }

    if (mobileDateStage === "pickup") {
      const nextDate = new Date(date);
      nextDate.setHours(10, 0, 0, 0);
      setSelectedPickup((previous) => ({ ...previous, date: nextDate }));
      setSelectedDropoff((previous) => ({ ...previous, date: null }));
      sessionStorage.setItem("selectedPickupDate", nextDate.toISOString());
      sessionStorage.removeItem("selectedDropoffDate");
      setMobileDateStage("dropoff");
      return;
    }

    if (isBefore(startOfDay(date), startOfDay(selectedPickup?.date || new Date()))) {
      updatePickupDate(date);
      setMobileDateStage("dropoff");
      return;
    }

    updateDropoffDate(date);
    setMobileDateStage("pickup");
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
      className={`z-40 w-full ${
        onSearchPage
          ? "relative mt-[10px]"
          : "absolute left-1/2 top-[88px] w-[calc(100%_-_32px)] -translate-x-1/2 md:bottom-0 md:top-auto md:w-[calc(100%_-_40px)] md:translate-y-1/2"
      } max-w-[1160px]`}
    >
      <button
        type="button"
        onClick={() => {
          setMobileOpen(true);
          setMobileStep("where");
        }}
        className="flex min-h-[62px] w-full items-center gap-[12px] rounded-full border border-[#e7e5e8] bg-white p-[8px] pl-[16px] text-left shadow-[0_8px_24px_rgba(16,24,40,0.12)] md:hidden"
        aria-label="Open vehicle search"
      >
        <Search className="size-[20px] shrink-0 text-[#351a75]" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-bold text-[#262626]">
            {selectedLocation}
          </span>
          <span className="block truncate text-[12px] text-[#686868]">
            {isSubscription ? "Subscription" : "Fixed rental"} · {searchSummary}
          </span>
        </span>
        <span className="flex size-[46px] shrink-0 items-center justify-center rounded-full border border-[#e1dce7] bg-[#f8f6fa] text-[#351a75]">
          <SlidersHorizontal className="size-[18px]" aria-hidden="true" />
        </span>
      </button>

      <div className="hidden rounded-[22px] border border-[#dedbe2] bg-white p-[18px] shadow-[0_16px_44px_rgba(16,24,40,0.16)] md:block">
        <div className="flex items-center justify-between gap-[16px]">
          {modeSwitch()}
          <p className="text-[12px] text-[#716c75]">
            {isSubscription
              ? "Start when you want. Continue for as long as you need."
              : "Choose your pickup and return dates."}
          </p>
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
              <span className="block text-[11px] font-bold text-[#4c4750]">Pickup location</span>
              <span className="mt-[2px] block truncate text-[14px] font-medium text-[#262626]">
                {selectedLocation}
              </span>
            </span>
            <ChevronDown className="size-[17px] shrink-0 text-[#6f6973]" aria-hidden="true" />
          </button>

          <button
            id="pickup-btn"
            type="button"
            onClick={() => {
              setShowDatepicker((open) => !open);
              setShowLocation(false);
            }}
            className={desktopFieldClass}
          >
            <CalendarDays className="size-[20px] shrink-0 text-[#351a75]" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-[11px] font-bold text-[#4c4750]">
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
                <span className="block text-[11px] font-bold text-[#4c4750]">How long?</span>
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
              onClick={() => {
                setShowDatepicker((open) => !open);
                setShowLocation(false);
              }}
              className={desktopFieldClass}
            >
              <CalendarDays className="size-[20px] shrink-0 text-[#351a75]" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-[11px] font-bold text-[#4c4750]">Return date</span>
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
      />

      {mobileOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex flex-col bg-[#f7f7f8] md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Search vehicles"
          >
            <div className="border-b border-[#e9e7eb] bg-white px-[16px] pb-[14px] pt-[max(12px,env(safe-area-inset-top))]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[18px] font-bold text-[#242126]">Find your ride</p>
                  <p className="mt-[2px] text-[12px] text-[#716c75]">Where do you want to ride?</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex size-[44px] items-center justify-center rounded-full border border-[#e3e0e5] bg-white shadow-sm"
                  aria-label="Close search"
                >
                  <X className="size-[20px]" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-[14px]">{modeSwitch(true)}</div>
            </div>

            <div className="flex-1 overflow-y-auto px-[12px] pb-[118px] pt-[12px]">
              <section
                className={`overflow-hidden rounded-[24px] border bg-white transition-shadow ${
                  mobileStep === "where"
                    ? "border-[#d8d4dc] shadow-[0_10px_28px_rgba(28,22,35,0.10)]"
                    : "border-[#e6e3e8]"
                }`}
              >
                {mobileStep !== "where" ? (
                  <button
                    type="button"
                    onClick={() => setMobileStep("where")}
                    className="flex min-h-[74px] w-full items-center justify-between gap-[16px] px-[20px] text-left"
                  >
                    <span className="text-[15px] font-medium text-[#777179]">Where</span>
                    <span className="truncate text-[15px] font-bold text-[#252126]">{selectedLocation}</span>
                  </button>
                ) : (
                  <div className="p-[20px]">
                    <h2 className="text-[28px] font-bold tracking-[-0.02em] text-[#252126]">Where?</h2>
                    <label className="mt-[18px] flex min-h-[58px] items-center gap-[12px] rounded-[14px] border border-[#89848b] bg-white px-[16px] focus-within:border-[#351a75] focus-within:ring-1 focus-within:ring-[#351a75]">
                      <Search className="size-[22px] shrink-0 text-[#252126]" aria-hidden="true" />
                      <input
                        value={mobileLocationQuery}
                        onChange={(event) => setMobileLocationQuery(event.target.value)}
                        placeholder="Search city or pickup hub"
                        className="min-w-0 flex-1 bg-transparent text-[16px] text-[#252126] outline-none placeholder:text-[#8a858c]"
                        autoFocus
                      />
                    </label>

                    <p className="mt-[20px] text-[13px] font-bold text-[#4c4750]">Suggested locations</p>
                    <div className="mt-[8px]">
                      {!locationPermissionGranted && (
                        <button
                          type="button"
                          onClick={() => {
                            getUserLocation();
                            setMobileStep("when");
                          }}
                          className="flex min-h-[68px] w-full items-center gap-[14px] rounded-[14px] px-[4px] text-left hover:bg-[#f8f6fa]"
                        >
                          <span className="flex size-[48px] shrink-0 items-center justify-center rounded-[14px] bg-[#eef3fb] text-[#356aa8]">
                            <Navigation className="size-[21px]" aria-hidden="true" />
                          </span>
                          <span>
                            <span className="block text-[15px] font-bold text-[#252126]">Near me</span>
                            <span className="mt-[2px] block text-[13px] text-[#777179]">Use your current location</span>
                          </span>
                        </button>
                      )}
                      {filteredLocations.map((location) => (
                        <button
                          key={location.name}
                          type="button"
                          onClick={() => selectLocation(location.name)}
                          className="flex min-h-[68px] w-full items-center gap-[14px] rounded-[14px] px-[4px] text-left hover:bg-[#f8f6fa]"
                        >
                          <span className="flex size-[48px] shrink-0 items-center justify-center rounded-[14px] bg-[#f4f0f8] text-[#5c3b88]">
                            <MapPin className="size-[21px]" aria-hidden="true" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[15px] font-bold text-[#252126]">{location.name}</span>
                            <span className="mt-[2px] block text-[13px] text-[#777179]">{location.detail}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section
                className={`mt-[12px] overflow-hidden rounded-[24px] border bg-white transition-shadow ${
                  mobileStep === "when"
                    ? "border-[#d8d4dc] shadow-[0_10px_28px_rgba(28,22,35,0.10)]"
                    : "border-[#e6e3e8]"
                }`}
              >
                {mobileStep !== "when" ? (
                  <button
                    type="button"
                    onClick={() => setMobileStep("when")}
                    className="flex min-h-[74px] w-full items-center justify-between gap-[16px] px-[20px] text-left"
                  >
                    <span className="text-[15px] font-medium text-[#777179]">When</span>
                    <span className="text-right text-[15px] font-bold text-[#252126]">
                      {isSubscription
                        ? formattedDate(selectedPickup?.date, false)
                        : `${formattedDate(selectedPickup?.date, false)} – ${formattedDate(selectedDropoff?.date, false)}`}
                    </span>
                  </button>
                ) : (
                  <div className="p-[20px]">
                    <h2 className="text-[28px] font-bold tracking-[-0.02em] text-[#252126]">When?</h2>
                    {!isSubscription && (
                      <div className="mt-[16px] grid grid-cols-2 rounded-full bg-[#efedf0] p-[4px]">
                        <button
                          type="button"
                          onClick={() => setMobileDateStage("pickup")}
                          className={`min-h-[42px] rounded-full text-[13px] font-bold ${mobileDateStage === "pickup" ? "bg-white text-[#252126] shadow-sm" : "text-[#777179]"}`}
                        >
                          Pickup · {formattedDate(selectedPickup?.date, false)}
                        </button>
                        <button
                          type="button"
                          onClick={() => setMobileDateStage("dropoff")}
                          className={`min-h-[42px] rounded-full text-[13px] font-bold ${mobileDateStage === "dropoff" ? "bg-white text-[#252126] shadow-sm" : "text-[#777179]"}`}
                        >
                          Return · {formattedDate(selectedDropoff?.date, false)}
                        </button>
                      </div>
                    )}
                    {isSubscription && (
                      <p className="mt-[8px] text-[13px] text-[#777179]">Choose the day you want your subscription to begin.</p>
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
                      <p className="text-[17px] font-bold text-[#252126]">{format(mobileCalendarMonth, "MMMM yyyy")}</p>
                      <button
                        type="button"
                        onClick={() => setMobileCalendarMonth((month) => addMonths(month, 1))}
                        className="flex size-[40px] items-center justify-center rounded-full hover:bg-[#f3f1f4]"
                        aria-label="Next month"
                      >
                        <ChevronRight className="size-[20px]" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="mt-[16px] grid grid-cols-7 text-center text-[12px] font-medium text-[#777179]">
                      {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                        <span key={`${day}-${index}`}>{day}</span>
                      ))}
                    </div>
                    <div className="mt-[8px] grid grid-cols-7 gap-y-[6px]">
                      {calendarDays.map((day, index) => {
                        if (!day) return <span key={`empty-${index}`} />;
                        const disabled = isBefore(startOfDay(day), startOfDay(new Date()));
                        const selected = isCalendarDaySelected(day);
                        const inRange = isCalendarDayInRange(day);
                        return (
                          <button
                            key={day.toISOString()}
                            type="button"
                            disabled={disabled}
                            onClick={() => handleMobileDateClick(day)}
                            className={`mx-auto flex size-[42px] items-center justify-center rounded-full text-[14px] font-medium transition-colors ${
                              selected
                                ? "bg-[#2f2350] text-white"
                                : inRange
                                  ? "bg-[#eee9f5] text-[#35264c]"
                                  : disabled
                                    ? "cursor-not-allowed text-[#c9c5ca]"
                                    : "text-[#252126] hover:bg-[#f2eff5]"
                            }`}
                          >
                            {format(day, "d")}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>

              {isSubscription && (
                <section
                  className={`mt-[12px] overflow-hidden rounded-[24px] border bg-white transition-shadow ${
                    mobileStep === "duration"
                      ? "border-[#d8d4dc] shadow-[0_10px_28px_rgba(28,22,35,0.10)]"
                      : "border-[#e6e3e8]"
                  }`}
                >
                  {mobileStep !== "duration" ? (
                    <button
                      type="button"
                      onClick={() => setMobileStep("duration")}
                      className="flex min-h-[74px] w-full items-center justify-between gap-[16px] px-[20px] text-left"
                    >
                      <span className="text-[15px] font-medium text-[#777179]">How long?</span>
                      <span className="text-[15px] font-bold text-[#252126]">
                        About {subscriptionDuration} {Number(subscriptionDuration) === 1 ? "month" : "months"}
                      </span>
                    </button>
                  ) : (
                    <div className="p-[20px]">
                      <h2 className="text-[28px] font-bold tracking-[-0.02em] text-[#252126]">How long?</h2>
                      <p className="mt-[6px] text-[13px] leading-[1.45] text-[#777179]">
                        This helps us show the best subscription. You can extend it later.
                      </p>
                      <div className="mt-[20px] grid grid-cols-2 gap-[10px]">
                        {SUBSCRIPTION_DURATIONS.map((duration) => (
                          <button
                            key={duration}
                            type="button"
                            onClick={() => setSubscriptionDuration(duration)}
                            className={`min-h-[70px] rounded-[16px] border px-[14px] text-left transition-colors ${
                              Number(subscriptionDuration) === duration
                                ? "border-[#6a5294] bg-[#faf8fd] text-[#35264c]"
                                : "border-[#dedbe1] bg-white text-[#3f3a42]"
                            }`}
                          >
                            <span className="block text-[16px] font-bold">{duration} {duration === 1 ? "month" : "months"}</span>
                            <span className="mt-[3px] block text-[12px] text-[#777179]">
                              Planned until {formattedDate(
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
            </div>

            <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-[16px] border-t border-[#e4e1e6] bg-white px-[20px] pb-[max(16px,env(safe-area-inset-bottom))] pt-[12px]">
              <button
                type="button"
                onClick={clearMobileSearch}
                className="min-h-[48px] px-[2px] text-[14px] font-bold text-[#302c32] underline underline-offset-4"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={mobileFooterAction}
                className="flex min-h-[52px] min-w-[150px] items-center justify-center gap-[9px] rounded-[14px] bg-[#351a75] px-[22px] text-[15px] font-bold text-white"
              >
                {mobileFooterLabel === "Show vehicles" && <Search className="size-[18px]" aria-hidden="true" />}
                {mobileFooterLabel}
                {mobileFooterLabel === "Next" && <ChevronRight className="size-[18px]" aria-hidden="true" />}
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default SearchBar;
