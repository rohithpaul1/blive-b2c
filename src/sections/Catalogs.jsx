import { useState, useEffect, useMemo } from "react";
import Tabs from "../components/Tabs";
import Cards from "../components/Cards";
import Pagination from "../components/Pagination";
import { useNavigate } from "react-router-dom";
import { getAPI } from "../caller/axiosUrls";
import { getHubs } from "../lib/hubs";
import Loader from "../components/Loader";
import { useContext } from "react";
import { SearchBarContext } from "../contexts/SearchBarContext";
import { RENTAL_MODES } from "../utils/subscription";

// /catalogue/search (the real B2C backend) is scoped to one hub per call —
// there's no "every hub at once" version. No hub-picker UI exists yet (see
// conversation), so this defaults to the first hub /catalogue/hubs returns,
// same default-to-first pattern already used in Booking.jsx. Goes through
// the shared getHubs() cache so this doesn't fire its own separate request.
const fetchDefaultHubId = async () => {
  const hubs = await getHubs();
  return hubs?.[0]?.id ?? null;
};

// SUBSCRIPTION searches take a `howLong` enum, not a date range — the existing
// Daily/Weekly/Monthly tabs don't map 1:1 onto it (that enum has 5 options:
// 1week/1 month/3 months/6 months/12 months). Approximated here; worth a
// product call on whether subscription needs its own tab set instead.
const HOW_LONG_FOR_PLAN_TYPE = {
  daily: "1week",
  weekly: "1 month",
  monthly: "3 months",
};

const toApiIsoString = (date, time) => {
  if (!date) return null;
  const base = new Date(date);
  const [, timeVal, modifier] = /^(\d{1,2}(?::\d{2})?)\s*(AM|PM)?$/i.exec((time || "10 AM").trim()) || [];
  let [hours, minutes = "0"] = (timeVal || "10").split(":");
  hours = parseInt(hours, 10);
  if (modifier?.toUpperCase() === "PM" && hours < 12) hours += 12;
  if (modifier?.toUpperCase() === "AM" && hours === 12) hours = 0;
  base.setHours(hours, parseInt(minutes, 10) || 0, 0, 0);
  return base.toISOString();
};

const Catalogs = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [vehicles, setVehicles] = useState([]);
  const [hubId, setHubId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [currentPage, setCurrentPage] = useState(1);
  const [, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filtering state
  // The home catalog has no visible price filter, so it must not silently
  // exclude weekly or monthly plans whose cycle price is above ₹1,000.
  const [priceRange] = useState({ min: 0, max: Number.POSITIVE_INFINITY });
  const [availabilityFilter] = useState("all");
  const [sortBy] = useState("price");
  const [sortOrder] = useState("asc");

  // UI state
  const [, setBrands] = useState([]);

  const navigate = useNavigate();

  // Get search context for pickup/dropoff dates
  const {
    selectedPickup,
    selectedDropoff,
    adjustDropoffDateForPlan,
    updateCurrentPlanType,
    rentalMode,
  } = useContext(SearchBarContext);
  const isSubscription = rentalMode === RENTAL_MODES.subscription;

  const tabs = [
    { name: "Daily", planType: "daily" },
    { name: "Weekly", discount: 10, planType: "weekly" },
    { name: "Monthly", discount: 50, planType: "monthly" },
  ];

  // Fetch vehicles from /catalogue/search — real, priced, available results
  // for one hub. Unlike the old endpoint, this returns ONE plan tier per
  // call (whichever the date range / howLong resolves to), not all three
  // (daily/weekly/monthly) at once — so a tab change genuinely needs a new
  // call, not just a client-side re-slice. That already happens naturally
  // here since selectedPickup/selectedDropoff change per tab (see
  // handleTabChange below) and are in this effect's dependency array.
  const fetchVehicles = async () => {
    if (!hubId) return; // still resolving the default hub
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        hubId,
        rentalTerm: isSubscription ? "SUBSCRIPTION" : "FIXED_TERM",
        pickupDateTime: toApiIsoString(selectedPickup?.date, selectedPickup?.time) || new Date().toISOString(),
      });

      if (isSubscription) {
        params.append("howLong", HOW_LONG_FOR_PLAN_TYPE[tabs[selectedTab].planType] || "1 month");
      } else {
        const dropoffDateTime = toApiIsoString(selectedDropoff?.date, selectedDropoff?.time);
        if (dropoffDateTime) params.append("dropoffDateTime", dropoffDateTime);
      }

      const results = await getAPI(`/catalogue/search?${params}`);
      // `results || []` alone isn't enough — a non-array truthy response
      // (an error object, an unexpected wrapper) would pass that guard and
      // then crash every .map() below, taking down the whole page since
      // there's no error boundary above this. Array.isArray closes that.
      const list = Array.isArray(results) ? results : [];
      setVehicles(list);
      setTotalItems(list.length);
      setTotalPages(1);

      // No brand field on this endpoint's response — vehicle names here are
      // conventionally "Brand Model" (e.g. "Ather 450X"), so this is a
      // best-effort stand-in, not real brand data.
      const uniqueBrands = [...new Set(list.map((item) => item.name?.split(" ")[0]).filter(Boolean))];
      setBrands(uniqueBrands);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      setError(err.message || "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  // Resolve a default hub once on mount — see fetchDefaultHubId's comment.
  useEffect(() => {
    fetchDefaultHubId()
      .then(setHubId)
      .catch((err) => {
        console.error("Error fetching default hub:", err);
        setError("Failed to load hub locations");
        setLoading(false);
      });
  }, []);

  // Fetch vehicles when dependencies change
  useEffect(() => {
    fetchVehicles();
  }, [hubId, isSubscription, selectedTab, selectedPickup, selectedDropoff]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize current plan type on component mount and restore from sessionStorage
  useEffect(() => {
    const storedPlanType = sessionStorage.getItem("currentPlanType");

    if (storedPlanType) {
      // Find the tab index for the stored plan type
      const tabIndex = tabs.findIndex((tab) => tab.planType === storedPlanType);
      if (tabIndex !== -1) {
        console.log("Restoring selected tab from stored plan type:", {
          storedPlanType,
          tabIndex,
        });
        setSelectedTab(tabIndex);
        updateCurrentPlanType(storedPlanType);
        return;
      }
    }

    // Default initialization if no stored plan type
    const initialPlanType = tabs[selectedTab].planType;
    updateCurrentPlanType(initialPlanType);
  }, []); // Only run on mount

  // Listen for auto-detected plan type changes from date selection
  useEffect(() => {
    const handlePlanTypeAutoDetection = (event) => {
      const { planType, source } = event.detail;

      if (source === "dateRange" || source === "pageLoad") {
        console.log("Catalogs received auto-detected plan type:", {
          planType,
          source,
        });

        // Find the tab index for the auto-detected plan type
        const tabIndex = tabs.findIndex((tab) => tab.planType === planType);
        if (tabIndex !== -1 && tabIndex !== selectedTab) {
          console.log(
            `Auto-switching Catalogs tab from ${selectedTab} to ${tabIndex} (${planType})`
          );
          setSelectedTab(tabIndex);
        }
      }
    };

    window.addEventListener(
      "planTypeAutoDetected",
      handlePlanTypeAutoDetection
    );

    return () => {
      window.removeEventListener(
        "planTypeAutoDetected",
        handlePlanTypeAutoDetection
      );
    };
  }, [selectedTab, tabs]); // Dependencies to ensure we have current values

  // Transform /catalogue/search results to match Cards component format.
  // This endpoint already returns the ONE plan tier matching the requested
  // dates/howLong (server picks daily/weekly/monthly based on duration), so
  // there's no per-tab plan lookup needed here any more — the search call
  // itself (see fetchVehicles) already asked for the right one.
  //
  // Two fields have no real source in this endpoint's response and are
  // approximated: brandName (no brand object — derived from the vehicle
  // name's first word, e.g. "Ather 450X" -> "Ather") and several spec
  // fields (batteryType, perDayKmLimit, currentMileage, vehicleSpeed,
  // engineType, vehicleCategory) that simply aren't in the response —
  // defaulted the same way the old code already defaulted missing values.
  const transformVehicleData = (vehicleData) => {
    return (vehicleData || []).map((item) => {
      const plan = item.plan || {};
      const perDayPrice = plan.perDayPrice ?? plan.baseRate ?? 0;
      const totalAmount = plan.totalAmount ?? perDayPrice;
      const durationDays = plan.durationDays ?? 1;
      // Mirrors the old "what it'd cost at the daily rate" strike-through,
      // shown only when the plan's actual price is a real discount off that.
      const dailyRateEquivalent = perDayPrice * durationDays;
      const availableCount = item.availableUnits ?? 0;

      return {
        id: item.vehicleModelId,
        vehicleName: item.name,
        manufacturer: item.vehicleType || "",
        brandName: item.name?.split(" ")[0] || "EV",
        imgUrl: item.modelImages?.[0] || "/images/CartoonScooter.png",
        price: totalAmount,
        actualPrice: dailyRateEquivalent > totalAmount ? dailyRateEquivalent : null,

        range: item.rangePerCharge || 0,
        topSpeed: item.topSpeed || 0,
        chargeTime: item.chargingDuration || 0,

        batteryType: "charging",
        batteryCapacity: item.batteryCapacity || 0,
        perDayKmLimit: plan.defaultValues?.includedKm || 0,
        currentMileage: 0,
        vehicleSpeed: "standard",
        engineType: item.fuelType === "BEV" ? "ev" : "fuel",
        vehicleCategory: item.vehicleType === "SCOOTERS_BIKES" ? "two-wheeler" : "vehicle",
        b2cDeposit: plan.depositAmount,
        isAvailable: availableCount > 0,
        nextAvailableDate: availableCount > 0 ? "Available Now" : "Contact hub",
        availableCount,
        planId: plan.id,
        planName: plan.name,
        usageModel: isSubscription ? "payg" : "one_off",
        rentalMode,
        billingPolicy: null,
      };
    });
  };

  // Apply client-side filtering, sorting, and pagination
  const filteredAndSortedVehicles = useMemo(() => {
    let transformedVehicles = transformVehicleData(vehicles);

    // Apply price range filter
    transformedVehicles = transformedVehicles.filter(
      (vehicle) =>
        vehicle.price >= priceRange.min && vehicle.price <= priceRange.max
    );

    // Apply availability filter
    if (availabilityFilter === "available") {
      transformedVehicles = transformedVehicles.filter(
        (vehicle) => vehicle.isAvailable
      );
    } else if (availabilityFilter === "unavailable") {
      transformedVehicles = transformedVehicles.filter(
        (vehicle) => !vehicle.isAvailable
      );
    }

    // Apply sorting
    transformedVehicles.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "price":
          comparison = a.price - b.price;
          break;
        case "name":
          comparison = a.vehicleName.localeCompare(b.vehicleName);
          break;
        case "availability":
          comparison = b.availableCount - a.availableCount;
          break;
        default:
          comparison = a.price - b.price;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return transformedVehicles;
  }, [
    vehicles,
    selectedTab,
    priceRange,
    availabilityFilter,
    sortBy,
    sortOrder,
    rentalMode,
  ]);

  // Get only the first 6 items for display
  const displayedVehicles = useMemo(() => {
    return filteredAndSortedVehicles.slice(0, 6);
  }, [filteredAndSortedVehicles]);

  const handleTabChange = (tabIndex) => {
    setSelectedTab(tabIndex);

    // Auto-adjust dropoff date based on selected plan type
    const selectedPlanType = tabs[tabIndex].planType;
    updateCurrentPlanType(selectedPlanType);
    adjustDropoffDateForPlan(selectedPlanType);
  };

  // Handle navigation to SearchPage with selected plan type
  const handleSeeAllScooters = () => {
    const currentPlanType = tabs[selectedTab].planType;
    // Store the selected plan type in sessionStorage
    sessionStorage.setItem("selectedPlanType", currentPlanType);
    sessionStorage.setItem("selectedTabIndex", selectedTab.toString());
    navigate("/search");
  };

  if (loading) {
    return (
      <div className="mt-[72px] flex flex-col items-center bg-[#F1F2F3] px-[16px] py-[64px] sm:px-[32px] lg:mt-[110px] lg:px-[8vw] lg:py-[88px]">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-[72px] flex flex-col items-center bg-[#F1F2F3] px-[16px] py-[64px] sm:px-[32px] lg:mt-[110px] lg:px-[8vw] lg:py-[88px]">
        <p className="font-bold text-[24px] text-red-600">
          Error loading vehicles
        </p>
        <p className="mt-[8px] text-[16px] text-gray-600">{error}</p>
        <button
          onClick={() => fetchVehicles()}
          className="mt-[16px] px-[24px] py-[12px] bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <section className="mt-[72px] flex flex-col items-center bg-[#F1F2F3] px-[16px] py-[64px] sm:px-[32px] lg:mt-[110px] lg:px-[8vw] lg:py-[88px]">
      <h2 className="max-w-[920px] text-balance text-center text-[30px] font-bold leading-[1.15] text-[#0F0F0F] sm:text-[38px] lg:text-[48px]">
        {isSubscription
          ? "Choose an EV Subscription That Fits Your Routine"
          : "Choose EV Rentals That Match Your Needs"}
      </h2>
      <p className="mt-[16px] max-w-[720px] text-pretty text-center text-[16px] font-medium leading-[1.55] text-[#3f3f3f] sm:mt-[20px] sm:text-[18px]">
        {isSubscription
          ? "Choose how long you want to start. Your subscription then renews automatically until you cancel."
          : "Day trip, weekend escape, or city errand. BLive EZY fits your life, without the cost of ownership."}
      </p>

      {/* Tabs */}
      <Tabs
        selectedTab={selectedTab}
        setSelectedTab={handleTabChange}
        tabs={tabs}
      />

      {/* Vehicle Grid - Show only 6 cards */}
      <div className="mt-[40px] grid w-full grid-cols-1 gap-[20px] sm:grid-cols-2 lg:mt-[56px] xl:grid-cols-3 xl:gap-[28px]">
        <Cards
          isCatalog={true}
          cards={displayedVehicles}
          selectedPlanType={tabs[selectedTab].planType}
        />
      </div>

      {/* See All Button */}
      <div className="mt-[40px] flex flex-col items-center gap-y-[16px] sm:mt-[54px]">
        <button
          onClick={handleSeeAllScooters}
          className="flex min-h-[52px] cursor-pointer items-center justify-center gap-x-[8px] rounded-full bg-[#0F0F0F] px-[32px] py-[14px] transition-colors hover:bg-[#2b2b2b]"
        >
          <p className="text-white font-bold">See all Scooters</p>
          <img
            className="w-[24px] aspect-square"
            src="/images/arrow-right.png"
            alt="Arrow Icon"
          />
        </button>

        {/* Results Summary */}
        <p className="text-[14px] text-[#717171] text-center">
          Showing {displayedVehicles.length} of{" "}
          {filteredAndSortedVehicles.length} vehicles
          {totalItems > filteredAndSortedVehicles.length && (
            <span> (filtered from {totalItems} total)</span>
          )}
        </p>
      </div>
    </section>
  );
};

export default Catalogs;
