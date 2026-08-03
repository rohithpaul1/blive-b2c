import { useState, useEffect, useMemo } from "react";
import Tabs from "../components/Tabs";
import Cards from "../components/Cards";
import Pagination from "../components/Pagination";
import { useNavigate } from "react-router-dom";
import { getAPI } from "../caller/axiosUrls";
import Loader from "../components/Loader";
import { useContext } from "react";
import { SearchBarContext } from "../contexts/SearchBarContext";

const Catalogs = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [currentPage, setCurrentPage] = useState(1);
  const [, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filtering state
  const [selectedBrand] = useState("all");
  const [priceRange] = useState({ min: 0, max: 1000 });
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
  } = useContext(SearchBarContext);

  const tabs = [
    { name: "Daily", planType: "daily" },
    { name: "Weekly", discount: 10, planType: "weekly" },
    { name: "Monthly", discount: 50, planType: "monthly" },
  ];

  // Helper function to format date and time for API
  const formatDateTimeForAPI = (date, time) => {
    if (!date) return null;

    // Parse time string (e.g., "10 AM", "2 PM")
    const parseTime = (timeStr) => {
      const [time, modifier] = timeStr.split(" ");
      let [hours, minutes] = time.split(":");
      if (!minutes) minutes = "00";

      hours = parseInt(hours, 10);
      if (modifier.toUpperCase() === "PM" && hours < 12) {
        hours += 12;
      }
      if (modifier.toUpperCase() === "AM" && hours === 12) {
        hours = 0;
      }

      return `${hours.toString().padStart(2, "0")}:${minutes}`;
    };

    // Format date as YYYY-MM-DD
    const dateStr = new Date(date).toISOString().split("T")[0];
    const timeStr = parseTime(time || "10 AM");

    // Return formatted datetime string
    return `${dateStr} ${timeStr}:00.000`;
  };

  // Fetch vehicles from API with pickup/dropoff dates
  const fetchVehicles = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: "1",
        limit: "50",
        ...filters,
      });

      // Add pickup and dropoff dates if available
      if (selectedPickup?.date) {
        const pickupDateTime = formatDateTimeForAPI(
          selectedPickup.date,
          selectedPickup.time
        );
        if (pickupDateTime) {
          params.append("pickupDate", pickupDateTime);
        }
      }

      if (selectedDropoff?.date) {
        const dropoffDateTime = formatDateTimeForAPI(
          selectedDropoff.date,
          selectedDropoff.time
        );
        if (dropoffDateTime) {
          params.append("dropoffDate", dropoffDateTime);
        }
      }

      const response = await getAPI(
        `/vehicle-plan/vehicle-model-with-plan?${params}`
      );

      if (response.status === "success" && response.data?.data) {
        setVehicles(response.data.data);

        // Update pagination info
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages);
          setTotalItems(response.data.pagination.total);
        }

        // Extract unique brands for filter
        const uniqueBrands = [
          ...new Set(response.data.data.map((item) => item.brand.name)),
        ];
        setBrands(uniqueBrands);
      } else {
        throw new Error("Failed to fetch vehicles");
      }
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      setError(err.message || "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  // Fetch vehicles when dependencies change
  useEffect(() => {
    const filters = {};
    if (selectedBrand !== "all") filters.brand = selectedBrand;
    if (availabilityFilter !== "all")
      filters.available = availabilityFilter === "available";

    fetchVehicles(filters);
  }, [selectedBrand, availabilityFilter, selectedPickup, selectedDropoff]); // Added pickup/dropoff dependencies

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

  // Transform API data to match Cards component format
  const transformVehicleData = (vehicleData, planType) => {
    return vehicleData.map((vehicle) => {
      const { model, plan, brand, availableVehiclesCount } = vehicle;

      // Get price based on selected tab
      let price;
      let actualPrice = null;

      switch (planType) {
        case "daily":
          price = plan.enterDailyPlanPrice;
          break;
        case "weekly":
          price = plan.enterWeeklyPlanPrice;
          actualPrice = plan.enterDailyPlanPrice * 7;
          break;
        case "monthly":
          price = plan.enterMonthlyPlanPrice;
          actualPrice = plan.enterDailyPlanPrice * 30;
          break;
        default:
          price = plan.enterDailyPlanPrice;
      }

      return {
        id: model.id,
        vehicleName: model.modelName,
        manufacturer: model.manufacturer,
        brandName: brand.name,
        imgUrl: brand.brandLogo || `/images/${brand.name}.png`,
        price: price,
        actualPrice: actualPrice,

        // Use real data from API instead of hardcoded values
        range: model.range || 0,
        topSpeed: model.speed || 0,
        chargeTime: model.batteryChargingTime || 0,

        // Additional vehicle specs from API
        batteryType: model.batteryType || "charging",
        batteryCapacity: model.batteryCapacity || 0,
        perDayKmLimit: model.perDayKmLimit || 0,
        currentMileage: model.currentMileage || 0,
        vehicleSpeed: model.vehicleSpeed || "standard",
        engineType: model.engineType || "ev",
        vehicleCategory: model.vehicleCategory || "two-wheeler",
        b2cDeposit: model.b2cDeposit,
        isAvailable: availableVehiclesCount > 0,
        nextAvailableDate:
          availableVehiclesCount > 0 ? "Available Now" : "30th Aug, 10am",
        availableCount: availableVehiclesCount,
        planId: plan.id,
        planName: plan.name,
      };
    });
  };

  // Apply client-side filtering, sorting, and pagination
  const filteredAndSortedVehicles = useMemo(() => {
    const currentPlanType = tabs[selectedTab].planType;
    let transformedVehicles = transformVehicleData(vehicles, currentPlanType);

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
      <div className="mt-[135px] bg-[#F1F2F3] flex flex-col items-center py-[100px] px-[15%]">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-[135px] bg-[#F1F2F3] flex flex-col items-center py-[100px] px-[15%]">
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
    <div className="mt-[135px] bg-[#F1F2F3] flex flex-col items-center py-[100px] px-[15%]">
      <p className="font-bold text-[48px] text-[#0F0F0F]">
        Choose EV Rentals That Match Your Needs
      </p>
      <p className="mt-[24px] font-medium text-[18px] text-center text-[#0F0F0F] px-[15%]">
        Day trip, weekend escape, or city errand. BLive EZY fits your life,
        without the cost of ownership.
      </p>

      {/* Tabs */}
      <Tabs
        selectedTab={selectedTab}
        setSelectedTab={handleTabChange}
        tabs={tabs}
      />

      {/* Vehicle Grid - Show only 6 cards */}
      <div className="mt-[72px] grid grid-cols-3 gap-x-[38px] gap-y-[54px] w-full">
        <Cards
          isCatalog={true}
          cards={displayedVehicles}
          selectedPlanType={tabs[selectedTab].planType}
        />
      </div>

      {/* See All Button */}
      <div className="mt-[54px] flex flex-col items-center gap-y-[16px]">
        <button
          onClick={handleSeeAllScooters}
          className="cursor-pointer flex items-center justify-center rounded-[64px] py-[16px] px-[40px] gap-x-[8px] bg-[#0F0F0F] hover:bg-gray-800 transition-colors"
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
    </div>
  );
};

export default Catalogs;
