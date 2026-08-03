import { useContext, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import Datepicker from "./Datepicker";
import LocationDropdown from "./LocationDropdown";
import { SearchBarContext } from "../contexts/SearchBarContext";
import {
  RENTAL_MODES,
  planUnitLabel,
  startingPeriodLabel,
} from "../utils/subscription";

const MOBILE_LOCATIONS = [
  "HSR Layout, Bengaluru",
  "Jayanagar, Bengaluru",
  "Koramangala, Bengaluru",
  "Indiranagar, Bengaluru",
  "Whitefield, Bengaluru",
  "Electronic City, Bengaluru",
];

const SearchBar = ({ onSearchPage, onSearchTrigger }) => {
  const [showLocation, setShowLocation] = useState(false);
  const [showDatepicker, setShowDatepicker] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileLocationsOpen, setMobileLocationsOpen] = useState(false);
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
    currentPlanType,
    rentalMode,
    setRentalMode,
    subscriptionDuration,
    setSubscriptionDuration,
    handlePickupDateChange,
  } = useContext(SearchBarContext);
  const isSubscription = rentalMode === RENTAL_MODES.subscription;

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  const selectedSearchPlan = () =>
    isSubscription
      ? currentPlanType
      : detectPlanTypeFromDateRange(
          selectedPickup?.date || null,
          selectedDropoff?.date || null
        );

  const formattedDate = (date, includeYear = true) => {
    if (!date) return "Choose date";
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
      return `${formattedDate(selectedPickup?.date, false)} · Start with ${startingPeriodLabel(
        currentPlanType,
        subscriptionDuration
      )}`;
    }
    return `${formattedDate(selectedPickup?.date, false)} – ${formattedDate(
      selectedDropoff?.date,
      false
    )}`;
  }, [
    currentPlanType,
    isSubscription,
    selectedDropoff?.date,
    selectedPickup?.date,
    subscriptionDuration,
  ]);

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

  const updatePickupFromInput = (value) => {
    if (!value) return;
    const date = new Date(`${value}T10:00:00`);
    setSelectedPickup((previous) => ({ ...previous, date }));
    sessionStorage.setItem("selectedPickupDate", date.toISOString());
    handlePickupDateChange(date);
  };

  const updateDropoffFromInput = (value) => {
    if (!value) return;
    const date = new Date(`${value}T10:00:00`);
    setSelectedDropoff((previous) => ({ ...previous, date }));
    sessionStorage.setItem("selectedDropoffDate", date.toISOString());
  };

  const modeSwitch = (mobile = false) => (
    <div
      className={`grid grid-cols-2 rounded-full bg-[#f1eff3] p-[4px] ${
        mobile ? "w-full" : "w-[196px] shrink-0"
      }`}
      aria-label="Rental type"
    >
      {[
        [RENTAL_MODES.fixed, "Fixed rental"],
        [RENTAL_MODES.subscription, "Subscription"],
      ].map(([mode, label]) => (
        <button
          key={mode}
          type="button"
          onClick={() => setRentalMode(mode)}
          className={`min-h-[44px] rounded-full px-[12px] text-[12px] font-bold transition-colors ${
            rentalMode === mode
              ? "bg-white text-[#26212c] shadow-sm"
              : "text-[#746e79] hover:text-[#26212c]"
          }`}
          aria-pressed={rentalMode === mode}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <div
      className={`z-40 w-full ${
        onSearchPage
          ? "relative mt-[8px]"
          : "absolute left-1/2 top-[88px] w-[calc(100%_-_32px)] -translate-x-1/2 md:bottom-0 md:top-auto md:w-[calc(100%_-_40px)] md:translate-y-1/2"
      } max-w-[1120px]`}
    >
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
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

      <div className="hidden items-center gap-[8px] rounded-full border border-[#dedbe2] bg-white p-[8px] shadow-[0_10px_30px_rgba(16,24,40,0.12)] md:flex">
        {modeSwitch()}
        <button
          id="location"
          type="button"
          onClick={() => {
            setShowLocation((open) => !open);
            setShowDatepicker(false);
          }}
          className="flex min-h-[56px] min-w-0 flex-1 items-center gap-[10px] rounded-full px-[14px] text-left hover:bg-[#f7f7f7]"
        >
          <MapPin className="size-[19px] shrink-0 text-[#351a75]" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-[11px] font-bold text-[#262626]">Where</span>
            <span className="block max-w-[170px] truncate text-[13px] text-[#686868]">
              {selectedLocation}
            </span>
          </span>
        </button>
        <span className="h-[34px] w-px bg-[#e4e2e5]" />
        <button
          id="pickup-btn"
          type="button"
          onClick={() => {
            setShowDatepicker((open) => !open);
            setShowLocation(false);
          }}
          className="flex min-h-[56px] min-w-[170px] items-center gap-[10px] rounded-full px-[14px] text-left hover:bg-[#f7f7f7]"
        >
          <CalendarDays className="size-[19px] shrink-0 text-[#351a75]" aria-hidden="true" />
          <span>
            <span className="block text-[11px] font-bold text-[#262626]">
              {isSubscription ? "Start date" : "Pickup"}
            </span>
            <span className="block text-[13px] text-[#686868]">
              {formattedDate(selectedPickup?.date)}
            </span>
          </span>
        </button>
        <span className="h-[34px] w-px bg-[#e4e2e5]" />
        {isSubscription ? (
          <label className="flex min-h-[56px] min-w-[192px] items-center gap-[10px] rounded-full px-[14px] hover:bg-[#f7f7f7]">
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-bold text-[#262626]">Start with</span>
              <span className="block truncate text-[12px] text-[#686868]">
                First renewal {formattedDate(selectedDropoff?.date, false)}
              </span>
            </span>
            <select
              aria-label="Starting subscription period"
              value={subscriptionDuration}
              onChange={(event) => setSubscriptionDuration(event.target.value)}
              className="min-h-[44px] rounded-full border border-[#dedbe2] bg-white px-[10px] text-[12px] font-bold text-[#351a75] outline-none focus:border-[#351a75]"
            >
              {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
                <option key={value} value={value}>
                  {value} {planUnitLabel(currentPlanType, value)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <button
            id="dropoff-btn"
            type="button"
            onClick={() => {
              setShowDatepicker((open) => !open);
              setShowLocation(false);
            }}
            className="flex min-h-[56px] min-w-[170px] items-center gap-[10px] rounded-full px-[14px] text-left hover:bg-[#f7f7f7]"
          >
            <CalendarDays className="size-[19px] shrink-0 text-[#351a75]" aria-hidden="true" />
            <span>
              <span className="block text-[11px] font-bold text-[#262626]">Return</span>
              <span className="block text-[13px] text-[#686868]">
                {formattedDate(selectedDropoff?.date)}
              </span>
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={handleRentNow}
          className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-[#351a75] text-white transition-colors hover:bg-[#2c155f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351a75]"
          aria-label={onSearchPage ? "Find vehicles" : "Search vehicles"}
        >
          <Search className="size-[20px]" aria-hidden="true" />
        </button>
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

      {mobileOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col bg-white md:hidden" role="dialog" aria-modal="true" aria-label="Search vehicles">
          <div className="flex min-h-[68px] items-center gap-[12px] border-b border-[#eceaec] px-[16px]">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="flex size-[44px] items-center justify-center rounded-full hover:bg-[#f6f4f7]"
              aria-label="Close search"
            >
              <ChevronLeft className="size-[22px]" aria-hidden="true" />
            </button>
            <div>
              <p className="text-[17px] font-bold text-[#262626]">Find your ride</p>
              <p className="text-[12px] text-[#686868]">Choose where and when you want to start.</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-[16px] pb-[128px] pt-[20px]">
            {modeSwitch(true)}

            <section className="mt-[24px] rounded-[20px] border border-[#e8e5ea] bg-white p-[16px]">
              <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#756e79]">Where</p>
              <button
                type="button"
                onClick={() => setMobileLocationsOpen((open) => !open)}
                className="mt-[8px] flex min-h-[54px] w-full items-center gap-[12px] rounded-[14px] bg-[#f7f6f8] px-[14px] text-left"
              >
                <MapPin className="size-[20px] text-[#351a75]" aria-hidden="true" />
                <span className="flex-1 text-[15px] font-bold text-[#262626]">{selectedLocation}</span>
              </button>
              {mobileLocationsOpen && (
                <div className="mt-[8px] overflow-hidden rounded-[14px] border border-[#e8e5ea]">
                  {!locationPermissionGranted && (
                    <button
                      type="button"
                      onClick={() => {
                        getUserLocation();
                        setMobileLocationsOpen(false);
                      }}
                      className="flex min-h-[52px] w-full items-center gap-[10px] border-b border-[#efedf0] px-[14px] text-left text-[14px] font-bold text-[#351a75]"
                    >
                      Use my current location
                    </button>
                  )}
                  {MOBILE_LOCATIONS.map((location) => (
                    <button
                      key={location}
                      type="button"
                      onClick={() => {
                        setSelectedLocation(location);
                        sessionStorage.setItem("selectedLocation", location);
                        setMobileLocationsOpen(false);
                      }}
                      className="flex min-h-[52px] w-full items-center border-b border-[#efedf0] px-[14px] text-left text-[14px] text-[#333] last:border-b-0"
                    >
                      {location}
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-[12px] rounded-[20px] border border-[#e8e5ea] bg-white p-[16px]">
              <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#756e79]">When</p>
              <div className={`mt-[12px] grid gap-[12px] ${isSubscription ? "grid-cols-1" : "grid-cols-2"}`}>
                <label className="text-[12px] font-bold text-[#4b4650]">
                  {isSubscription ? "Start date" : "Pickup"}
                  <input
                    type="date"
                    value={inputDate(selectedPickup?.date)}
                    min={inputDate(new Date())}
                    onChange={(event) => updatePickupFromInput(event.target.value)}
                    className="mt-[6px] min-h-[50px] w-full rounded-[12px] border border-[#dedbe2] bg-white px-[12px] text-[15px] font-medium text-[#262626] outline-none focus:border-[#351a75]"
                  />
                </label>
                {!isSubscription && (
                  <label className="text-[12px] font-bold text-[#4b4650]">
                    Return
                    <input
                      type="date"
                      value={inputDate(selectedDropoff?.date)}
                      min={inputDate(selectedPickup?.date)}
                      onChange={(event) => updateDropoffFromInput(event.target.value)}
                      className="mt-[6px] min-h-[50px] w-full rounded-[12px] border border-[#dedbe2] bg-white px-[12px] text-[15px] font-medium text-[#262626] outline-none focus:border-[#351a75]"
                    />
                  </label>
                )}
              </div>
            </section>

            {isSubscription && (
              <section className="mt-[12px] rounded-[20px] border border-[#e8e5ea] bg-white p-[16px]">
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#756e79]">How long would you like to start?</p>
                <div className="mt-[12px] grid grid-cols-3 gap-[8px]">
                  {[1, 2, 3, 6, 9, 12].map((duration) => (
                    <button
                      key={duration}
                      type="button"
                      onClick={() => setSubscriptionDuration(duration)}
                      className={`min-h-[48px] rounded-[12px] border px-[8px] text-[13px] font-bold ${
                        Number(subscriptionDuration) === duration
                          ? "border-[#351a75] bg-[#f5f1fb] text-[#351a75]"
                          : "border-[#e1dee4] bg-white text-[#4f4953]"
                      }`}
                    >
                      {duration} {planUnitLabel(currentPlanType, duration)}
                    </button>
                  ))}
                </div>
                <p className="mt-[12px] text-[13px] leading-[1.45] text-[#686868]">
                  First renewal on {formattedDate(selectedDropoff?.date)}. It then renews automatically until you cancel.
                </p>
              </section>
            )}
          </div>

          <div className="fixed inset-x-0 bottom-0 border-t border-[#e9e6eb] bg-white px-[16px] pb-[max(16px,env(safe-area-inset-bottom))] pt-[12px]">
            <button
              type="button"
              onClick={handleRentNow}
              className="flex min-h-[54px] w-full items-center justify-center gap-[10px] rounded-full bg-[#351a75] px-[24px] text-[15px] font-bold text-white"
            >
              <Search className="size-[19px]" aria-hidden="true" />
              Show vehicles
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SearchBar;
