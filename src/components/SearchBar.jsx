import { useContext, useState } from "react";
import Datepicker from "./Datepicker";
import LocationDropdown from "./LocationDropdown";
import { useNavigate } from "react-router-dom";
import { SearchBarContext } from "../contexts/SearchBarContext";
import { RENTAL_MODES, planUnitLabel } from "../utils/subscription";

const SearchBar = ({ onSearchPage, onSearchTrigger }) => {
  const [showLocation, setShowLocation] = useState(false);
  const [showDatepicker, setShowDatepicker] = useState(false);

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
  } = useContext(SearchBarContext);
  const isSubscription = rentalMode === RENTAL_MODES.subscription;

  const selectedSearchPlan = () =>
    isSubscription
      ? currentPlanType
      : detectPlanTypeFromDateRange(
          selectedPickup?.date || null,
          selectedDropoff?.date || null
        );

  const formattedDate = (date) => {
    if (!date) return "No date selected";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short", // "Aug"
      day: "numeric", // "23"
      year: "numeric", // "2025"
    });
  };

  const handleRentNow = () => {
    if (!onSearchPage) {
      // Determine plan type from selected dates and persist for SearchPage
      try {
        const planType = selectedSearchPlan();

        // Update context and session so SearchPage can pick it up
        updateCurrentPlanType(planType);
        sessionStorage.setItem("selectedPlanType", planType);

        // Store an inferred tab index for potential tab UIs
        const planTypes = ["daily", "weekly", "monthly"];
        const tabIndex = Math.max(0, planTypes.indexOf(planType));
        sessionStorage.setItem("selectedTabIndex", tabIndex.toString());
      } catch (error) {
        console.error("Error detecting plan type:", error);
      }

      navigate("/search");
    } else {
      // On search page, trigger search refresh with updated plan type
      try {
        const planType = selectedSearchPlan();

        // Update context and session
        updateCurrentPlanType(planType);
        sessionStorage.setItem("selectedPlanType", planType);

        // Store an inferred tab index for potential tab UIs
        const planTypes = ["daily", "weekly", "monthly"];
        const tabIndex = Math.max(0, planTypes.indexOf(planType));
        sessionStorage.setItem("selectedTabIndex", tabIndex.toString());

        // Trigger search refresh if callback is provided
        if (onSearchTrigger) {
          onSearchTrigger(planType, tabIndex);
        }
      } catch (error) {
        console.error("Error detecting plan type:", error);
      }
    }
  };

  return (
    <div
      className={`${
        onSearchPage
          ? "relative mt-[10px]"
          : "absolute bottom-0 left-1/2 z-20 w-[calc(100%_-_40px)] -translate-x-1/2 translate-y-1/2 border border-white/60 bg-black/5 backdrop-blur-sm"
      } w-full max-w-[1120px] rounded-full p-[8px]`}
    >
      <div className="flex items-center rounded-full border border-[#10182814] bg-white px-[10px] py-[8px] shadow-[0_8px_24px_rgba(16,24,40,0.08)]">
        <div className="flex w-full items-center gap-x-[10px]">
          <div className="hidden shrink-0 items-center rounded-full bg-[#f3f2f5] p-[3px] md:flex">
            {[
              [RENTAL_MODES.fixed, "Fixed"],
              [RENTAL_MODES.subscription, "Subscription"],
            ].map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setRentalMode(mode)}
                className={`rounded-full px-[12px] py-[8px] text-[11px] font-bold transition-colors ${
                  rentalMode === mode
                    ? "bg-white text-[#221d2a] shadow-sm"
                    : "text-[#77717e] hover:text-[#221d2a]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            id="location"
            onClick={() => setShowLocation(!showLocation)}
            className="flex min-w-0 flex-1 cursor-pointer flex-col justify-center rounded-full px-[12px] py-[4px] hover:bg-[#f8f8f8] md:min-w-[180px]"
          >
            <p className="text-[11px] text-[#717171]">City</p>
            <span className="flex items-center py-[4px] gap-x-[4px]">
              <img
                className="w-[20px] h-[20px]"
                src="/images/Location.png"
                alt="Location Icon"
              />
              <p className="max-w-[180px] truncate text-[13px] font-medium text-[#3A3A3A]">
                {selectedLocation}
              </p>
            </span>
          </div>
          <span className="hidden h-[32px] w-px bg-[#D9D9D9] sm:block" />
          <div
            id="pickup-btn"
            onClick={() => setShowDatepicker(!showDatepicker)}
            className="hidden min-w-[188px] cursor-pointer flex-col justify-center rounded-full px-[12px] py-[4px] hover:bg-[#f8f8f8] sm:flex"
          >
            <p className="text-[11px] text-[#717171]">Pick-up</p>
            <span className="flex items-center py-[4px] gap-x-[4px]">
              <img
                className="w-[20px] h-[20px]"
                src="/images/Calendar.png"
                alt="Calendar Icon"
              />
              <p className="text-[13px] font-medium text-[#3A3A3A]">
                {formattedDate(selectedPickup?.date)}{" "}
                <span className="text-[12px] text-[#646464]">
                  {selectedPickup?.time}
                </span>
              </p>
            </span>
          </div>
          <span className="hidden h-[32px] w-px bg-[#D9D9D9] md:block" />
          {isSubscription ? (
            <div className="hidden min-w-[188px] flex-col justify-center rounded-full px-[12px] py-[4px] md:flex">
              <p className="text-[11px] text-[#717171]">Minimum commitment</p>
              <span className="flex items-center gap-x-[8px] py-[2px]">
                <select
                  aria-label="Subscription duration"
                  value={subscriptionDuration}
                  onChange={(event) => setSubscriptionDuration(event.target.value)}
                  className="h-[30px] rounded-full border border-[#dedce2] bg-white px-[10px] text-[12px] font-bold text-[#3a3540] outline-none"
                >
                  {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
                <p className="min-w-0 text-[12px] font-medium text-[#3A3A3A]">
                  {planUnitLabel(currentPlanType, subscriptionDuration)}
                  <span className="block truncate text-[10px] font-normal text-[#77717e]">
                    until {formattedDate(selectedDropoff?.date)}
                  </span>
                </p>
              </span>
            </div>
          ) : (
            <div
              id="dropoff-btn"
              onClick={() => setShowDatepicker(!showDatepicker)}
              className="hidden min-w-[188px] cursor-pointer flex-col justify-center rounded-full px-[12px] py-[4px] hover:bg-[#f8f8f8] md:flex"
            >
              <p className="text-[11px] text-[#717171]">Drop-off</p>
              <span className="flex items-center py-[4px] gap-x-[4px]">
                <img className="h-[20px] w-[20px]" src="/images/Calendar.png" alt="Calendar Icon" />
                <p className="text-[13px] font-medium text-[#3A3A3A]">
                  {formattedDate(selectedDropoff?.date)}{" "}
                  <span className="text-[14px] text-[#646464]">{selectedDropoff?.time}</span>
                </p>
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowDatepicker(!showDatepicker)}
            className="flex size-[42px] shrink-0 items-center justify-center rounded-full border border-[#e1e1e1] bg-[#fafafa] sm:hidden"
            aria-label="Change rental dates"
            title="Change rental dates"
          >
            <img className="size-[18px]" src="/images/Calendar.png" alt="" />
          </button>
          <button
            onClick={handleRentNow}
            className="ml-auto flex h-[46px] min-w-[132px] cursor-pointer items-center justify-center gap-2 rounded-full bg-[#151226] px-[20px] transition-colors hover:bg-[#351a75]"
          >
            <p className="text-[13px] font-bold text-white">
              {onSearchPage ? "Find vehicles" : "Rent now"}
            </p>
            <img
              className="w-[18px] h-[18px]"
              src="/images/arrow-right.png"
              alt="Arrow Icon"
            />
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
    </div>
  );
};

export default SearchBar;
