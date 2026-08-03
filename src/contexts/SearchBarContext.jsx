import { createContext, useEffect, useState } from "react";
import {
  RENTAL_MODES,
  addPlanDuration,
  normaliseDuration,
} from "../utils/subscription";

const SearchBarContext = createContext();

const SearchBarProvider = ({ children }) => {
  const [selectedPickup, setSelectedPickup] = useState({
    date: new Date(),
    time: "10 AM",
  });
  const [selectedDropoff, setSelectedDropoff] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { date: tomorrow, time: "10 AM" };
  });
  const [selectedLocation, setSelectedLocation] = useState(
    "HSR Layout, Bengaluru"
  );
  const [locationPermissionGranted, setLocationPermissionGranted] =
    useState(false);
  const [currentPlanType, setCurrentPlanType] = useState("daily");
  const [rentalModeState, setRentalModeState] = useState(
    () => sessionStorage.getItem("rentalMode") || RENTAL_MODES.fixed
  );
  const [subscriptionDurationState, setSubscriptionDurationState] = useState(
    () => normaliseDuration(sessionStorage.getItem("subscriptionDuration"))
  );

  const setRentalMode = (mode) => {
    const next =
      mode === RENTAL_MODES.subscription
        ? RENTAL_MODES.subscription
        : RENTAL_MODES.fixed;
    setRentalModeState(next);
    sessionStorage.setItem("rentalMode", next);
    if (next === RENTAL_MODES.subscription) {
      const committedUntil = addPlanDuration(
        selectedPickup.date,
        currentPlanType,
        subscriptionDurationState
      );
      setSelectedDropoff((previous) => ({
        ...previous,
        date: committedUntil,
        time: selectedPickup.time,
      }));
      sessionStorage.setItem("selectedDropoffDate", committedUntil.toISOString());
      sessionStorage.setItem("selectedDropoffTime", selectedPickup.time);
    }
  };

  const setSubscriptionDuration = (duration) => {
    const next = normaliseDuration(duration);
    setSubscriptionDurationState(next);
    sessionStorage.setItem("subscriptionDuration", String(next));
    if (rentalModeState === RENTAL_MODES.subscription) {
      const committedUntil = addPlanDuration(
        selectedPickup.date,
        currentPlanType,
        next
      );
      setSelectedDropoff((previous) => ({
        ...previous,
        date: committedUntil,
        time: selectedPickup.time,
      }));
      sessionStorage.setItem("selectedDropoffDate", committedUntil.toISOString());
      sessionStorage.setItem("selectedDropoffTime", selectedPickup.time);
    }
  };

  // Function to adjust dropoff date based on plan type
  const adjustDropoffDateForPlan = (
    planType,
    pickupDate = selectedPickup.date,
    duration = rentalModeState === RENTAL_MODES.subscription
      ? subscriptionDurationState
      : 1
  ) => {
    const newDropoffDate = addPlanDuration(pickupDate, planType, duration);

    const updatedDropoff = {
      ...selectedDropoff,
      date: newDropoffDate,
      ...(rentalModeState === RENTAL_MODES.subscription
        ? { time: selectedPickup.time }
        : {}),
    };

    setSelectedDropoff(updatedDropoff);

    // Update sessionStorage
    sessionStorage.setItem("selectedDropoffDate", newDropoffDate.toISOString());

    console.log(`Auto-adjusted dropoff date for ${planType} plan:`, {
      pickup: pickupDate,
      dropoff: newDropoffDate,
      daysDiff: Math.ceil(
        (newDropoffDate - pickupDate) / (1000 * 60 * 60 * 24)
      ),
    });

    // Update current plan type and store in sessionStorage
    setCurrentPlanType(planType);
    sessionStorage.setItem("currentPlanType", planType);
  };

  // Function to check if we should auto-adjust dates when pickup changes
  const handlePickupDateChange = (newPickupDate) => {
    // Auto-adjust for all plan types
    if (
      currentPlanType === "daily" ||
      currentPlanType === "weekly" ||
      currentPlanType === "monthly"
    ) {
      console.log("Auto-adjusting dates for plan type:", currentPlanType);
      adjustDropoffDateForPlan(currentPlanType, newPickupDate);
    }
  };

  // Function to set current plan type and store in sessionStorage
  const updateCurrentPlanType = (planType) => {
    console.log("Updating current plan type to:", planType);
    setCurrentPlanType(planType);
    sessionStorage.setItem("currentPlanType", planType);
    if (rentalModeState === RENTAL_MODES.subscription) {
      const committedUntil = addPlanDuration(
        selectedPickup.date,
        planType,
        subscriptionDurationState
      );
      setSelectedDropoff((previous) => ({
        ...previous,
        date: committedUntil,
        time: selectedPickup.time,
      }));
      sessionStorage.setItem("selectedDropoffDate", committedUntil.toISOString());
    }
  };

  // Function to auto-detect plan type based on date range
  const detectPlanTypeFromDateRange = (pickupDate, dropoffDate) => {
    if (!pickupDate || !dropoffDate) return "daily";

    const diffTime = Math.abs(dropoffDate - pickupDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    console.log(
      `Date range analysis: ${diffDays} days between`,
      pickupDate,
      "and",
      dropoffDate
    );

    // Auto-detect plan type based on duration
    if (diffDays >= 31) {
      // ~30 days = Monthly plan
      console.log("Auto-detected: Monthly plan");
      return "monthly";
    } else if (diffDays >= 7 && diffDays <= 30) {
      // ~7 days = Weekly plan
      console.log("Auto-detected: Weekly plan");
      return "weekly";
    } else {
      // Everything else = Daily plan
      console.log("Auto-detected: Daily plan");
      return "daily";
    }
  };

  // Function to auto-adjust plan type when dates change
  const autoAdjustPlanTypeFromDates = (pickupDate, dropoffDate) => {
    const detectedPlanType = detectPlanTypeFromDateRange(
      pickupDate,
      dropoffDate
    );

    if (detectedPlanType !== currentPlanType) {
      console.log(
        `Auto-switching from ${currentPlanType} to ${detectedPlanType} based on date range`
      );
      updateCurrentPlanType(detectedPlanType);

      // Notify other components about the plan type change
      window.dispatchEvent(
        new CustomEvent("planTypeAutoDetected", {
          detail: { planType: detectedPlanType, source: "dateRange" },
        })
      );
    }
  };

  // Function to get user's current location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      console.log("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Try multiple geocoding services for better area detection
        const geocodingPromises = [
          // BigDataCloud API
          fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          ).then((response) => response.json()),
          fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          ).then((response) => response.json()),
        ];

        Promise.allSettled(geocodingPromises)
          .then((results) => {
            console.log("Geocoding results:", results);

            let locationName = "";

            // Try BigDataCloud first
            if (results[0].status === "fulfilled") {
              const data = results[0].value;
              console.log("BigDataCloud response:", data);

              if (data.localityInfo && data.localityInfo.administrative) {
                const admin = data.localityInfo.administrative;
                if (admin[2] && admin[2].name) {
                  locationName = `${admin[2].name}, ${data.city}`;
                } else if (admin[1] && admin[1].name) {
                  locationName = `${admin[1].name}, ${data.city}`;
                }
              }

              if (!locationName && data.locality) {
                locationName = `${data.locality}, ${data.city}`;
              }
            }

            // Try OpenStreetMap if BigDataCloud didn't work well
            if (!locationName && results[1].status === "fulfilled") {
              const data = results[1].value;
              console.log("OpenStreetMap response:", data);

              if (data.address) {
                const addr = data.address;
                // Try to get suburb, neighbourhood, or village
                if (addr.suburb) {
                  locationName = `${addr.suburb}, ${
                    addr.city || addr.town || addr.state
                  }`;
                } else if (addr.neighbourhood) {
                  locationName = `${addr.neighbourhood}, ${
                    addr.city || addr.town || addr.state
                  }`;
                } else if (addr.village) {
                  locationName = `${addr.village}, ${
                    addr.city || addr.town || addr.state
                  }`;
                } else if (addr.city_district) {
                  locationName = `${addr.city_district}, ${
                    addr.city || addr.town || addr.state
                  }`;
                } else if (addr.city || addr.town) {
                  locationName = addr.city || addr.town;
                }
              }
            }

            // Final fallback
            if (!locationName) {
              locationName = "Bengaluru"; // Default fallback
            }

            setSelectedLocation(locationName);
            sessionStorage.setItem("selectedLocation", locationName);
            setLocationPermissionGranted(true);
            console.log("Location detected:", locationName);
          })
          .catch((error) => {
            console.error("Error fetching location details:", error);
          });
      },
      (error) => {
        console.log("Location permission denied or error:", error.message);
        setLocationPermissionGranted(false);
        // Fall back to default location
        setSelectedLocation("HSR Layout, Bengaluru");
        sessionStorage.setItem("selectedLocation", "HSR Layout, Bengaluru");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  useEffect(() => {
    const pickupDate = sessionStorage.getItem("selectedPickupDate");
    const dropOffDate = sessionStorage.getItem("selectedDropoffDate");
    const pickupTime = sessionStorage.getItem("selectedPickupTime");
    const dropoffTime = sessionStorage.getItem("selectedDropoffTime");
    const selectedLocation = sessionStorage.getItem("selectedLocation");
    const storedPlanType = sessionStorage.getItem("currentPlanType");

    setSelectedPickup({
      date: pickupDate ? new Date(pickupDate) : new Date(),
      time: pickupTime || "10 AM",
    });

    setSelectedDropoff({
      date: dropOffDate
        ? new Date(dropOffDate)
        : (() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow;
          })(),
      time: dropoffTime || "10 AM",
    });

    // Restore current plan type from sessionStorage
    if (storedPlanType) {
      console.log("Restoring plan type from sessionStorage:", storedPlanType);
      setCurrentPlanType(storedPlanType);
    } else {
      // If no stored plan type, try to auto-detect from existing dates
      const pickup = pickupDate ? new Date(pickupDate) : new Date();
      const dropoff = dropOffDate
        ? new Date(dropOffDate)
        : (() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow;
          })();

      if (pickupDate && dropOffDate) {
        console.log(
          "Auto-detecting plan type from existing dates on page load"
        );
        const detectedPlan = detectPlanTypeFromDateRange(pickup, dropoff);
        setCurrentPlanType(detectedPlan);
        sessionStorage.setItem("currentPlanType", detectedPlan);

        // Notify components about the auto-detected plan
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("planTypeAutoDetected", {
              detail: { planType: detectedPlan, source: "pageLoad" },
            })
          );
        }, 100);
      }
    }

    // Check if we have a stored location, if not try to get current location
    if (selectedLocation) {
      setSelectedLocation(selectedLocation);
    } else {
      // Try to get user's current location
      getUserLocation();
    }
  }, []);

  return (
    <SearchBarContext.Provider
      value={{
        selectedPickup,
        selectedDropoff,
        selectedLocation,
        setSelectedPickup,
        setSelectedDropoff,
        setSelectedLocation,
        locationPermissionGranted,
        getUserLocation,
        adjustDropoffDateForPlan,
        handlePickupDateChange,
        currentPlanType,
        setCurrentPlanType,
        updateCurrentPlanType,
        detectPlanTypeFromDateRange,
        autoAdjustPlanTypeFromDates,
        rentalMode: rentalModeState,
        setRentalMode,
        subscriptionDuration: subscriptionDurationState,
        setSubscriptionDuration,
      }}
    >
      {children}
    </SearchBarContext.Provider>
  );
};

export { SearchBarContext, SearchBarProvider };
