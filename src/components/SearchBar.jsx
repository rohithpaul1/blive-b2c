import { useContext, useState } from "react";
import Datepicker from "./Datepicker";
import LocationDropdown from "./LocationDropdown";
import { useNavigate } from "react-router-dom";
import { SearchBarContext } from "../contexts/SearchBarContext";

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
  } = useContext(SearchBarContext);

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
        const pickupDate = selectedPickup?.date || null;
        const dropoffDate = selectedDropoff?.date || null;
        const planType = detectPlanTypeFromDateRange(pickupDate, dropoffDate);

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
        const pickupDate = selectedPickup?.date || null;
        const dropoffDate = selectedDropoff?.date || null;
        const planType = detectPlanTypeFromDateRange(pickupDate, dropoffDate);

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
          ? "relative"
          : "absolute bg-[#00000005] bottom-0 z-20 border border-[#ffffff60] backdrop-blur-sm translate-y-1/2 left-1/2 -translate-x-1/2 px-[15%] w-full"
      } w-[70%] max-w-[1000px] rounded-full py-[20px] px-[18px] `}
    >
      <div className="flex items-center bg-white py-[12px] px-[26px] gap-[8px] border border-[#10182814] rounded-full">
        <div className="flex items-center gap-x-[16px]">
          <div
            id="location"
            onClick={() => setShowLocation(!showLocation)}
            className="flex cursor-pointer flex-col justify-center min-w-[240px]"
          >
            <p className="text-[12px] text-[#717171]">Location</p>
            <span className="flex items-center py-[4px] gap-x-[4px]">
              <img
                className="w-[20px] h-[20px]"
                src="/images/Location.png"
                alt="Location Icon"
              />
              <p className="text-[#3A3A3A] truncate w-[250px]">
                {selectedLocation}
              </p>
            </span>
          </div>
          <span className="block w-[1px] h-[32px] bg-[#D9D9D9]" />
          <div
            id="pickup-btn"
            onClick={() => setShowDatepicker(!showDatepicker)}
            className="flex cursor-pointer flex-col justify-center min-w-[196px]"
          >
            <p className="text-[12px] text-[#717171]">Pick-up date & time</p>
            <span className="flex items-center py-[4px] gap-x-[4px]">
              <img
                className="w-[20px] h-[20px]"
                src="/images/Calendar.png"
                alt="Calendar Icon"
              />
              <p className="text-[#3A3A3A]">
                {formattedDate(selectedPickup?.date)}{" "}
                <span className="text-[14px] text-[#646464]">
                  {selectedPickup?.time}
                </span>
              </p>
            </span>
          </div>
          <span className="block w-[1px] h-[32px] bg-[#D9D9D9]" />
          <div
            id="dropoff-btn"
            onClick={() => setShowDatepicker(!showDatepicker)}
            className="flex cursor-pointer flex-col justify-center min-w-[196px]"
          >
            <p className="text-[12px] text-[#717171]">Drop-off date</p>
            <span className="flex items-center py-[4px] gap-x-[4px]">
              <img
                className="w-[20px] h-[20px]"
                src="/images/Calendar.png"
                alt="Calendar Icon"
              />
              <p className="text-[#3A3A3A]">
                {formattedDate(selectedDropoff?.date)}{" "}
                <span className="text-[14px] text-[#646464]">
                  {selectedDropoff?.time}
                </span>
              </p>
            </span>
          </div>
          <button
            onClick={handleRentNow}
            className="flex cursor-pointer items-center rounded-[64px] min-w-[164px] justify-center gap-3 max-h-[64px] py-[24px] search-gradient"
          >
            <p className="text-white font-medium">Rent Now</p>
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
