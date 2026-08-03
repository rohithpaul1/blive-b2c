import { useContext, useState, useEffect, useMemo, useCallback } from "react";
import Navbar from "../sections/Navbar";
import Cards from "../components/Cards";
import { SearchBarContext } from "../contexts/SearchBarContext";
import Pagination from "../components/Pagination";
import Loader from "../components/Loader";
import SortDropdown from "../components/SortDropdown";
import FilterPage from "../components/FilterPage";
import { ProductContext } from "../contexts/ProductContext";
import { getAPI } from "../caller/axiosUrls";
import WhyBlive from "../sections/WhyBlive";
import Customers from "../sections/Customers";
import Footer from "../sections/Footer";
import { RENTAL_MODES, rentalPlanFor } from "../utils/subscription";

const VEHICLE_IMAGES = {
  Ather: "/images/Scooter (1).png",
  Ola: "/images/Scooter (3).png",
  TVS: "/images/Scooter (2).png",
  Revolt: "/images/Scooter.png",
  Ampere: "/images/Scooter (2).png",
  Pure: "/images/Scooter.png",
};

const SearchPage = () => {
  // Pagination state
  const [selectedPage, setSelectedPage] = useState(1);
  const [maxPages, setMaxPages] = useState(1);
  const [itemsPerPage] = useState(12);

  // Filtering and sorting state
  const [sortOption, setSortOption] = useState("Lowest Price");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFiltersPage, setShowFiltersPage] = useState(false);

  // Plan type state (from Catalogs)
  const [selectedPlanType, setSelectedPlanType] = useState("daily");
  const [, setSelectedTabIndex] = useState(0);

  // Track if user came from catalog selection
  const [fromCatalogSelection, setFromCatalogSelection] = useState(false);

  // API data state
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter data state
  const [filterData, setFilterData] = useState({
    avgPrice: 230,
    brands: [],
    ranges: [],
  });

  const [selectedFilters, setSelectedFilters] = useState({
    minPrice: 0,
    maxPrice: 1000,
    selectedBrand: null,
    selectedRange: null,
  });

  const {
    selectedLocation,
    adjustDropoffDateForPlan,
    updateCurrentPlanType,
    rentalMode,
    setRentalMode,
  } = useContext(SearchBarContext);
  const isSubscription = rentalMode === RENTAL_MODES.subscription;
  const { setSelectedProduct } = useContext(ProductContext);

  const handleRentalModeChange = (mode) => {
    const enteringSubscription =
      mode === RENTAL_MODES.subscription &&
      rentalMode !== RENTAL_MODES.subscription;

    setRentalMode(mode);
    if (enteringSubscription) {
      setSelectedPlanType("monthly");
      setSelectedTabIndex(2);
    }
  };

  // Plan type options (same as Catalogs)
  const planTypes = useMemo(
    () => [
      { name: "Daily", planType: "daily" },
      { name: "Weekly", discount: 10, planType: "weekly" },
      { name: "Monthly", discount: 50, planType: "monthly" },
    ],
    []
  );

  // Fetch vehicles from API with pagination and filters
  const fetchVehicles = useCallback(
    async (page = 1, filters = {}) => {
      try {
        setIsLoading(true);

        // Build query parameters
        const params = new URLSearchParams({
          page: page.toString(),
          limit: itemsPerPage.toString(),
          ...filters,
        });

        const response = await getAPI(
          `/vehicle-plan/vehicle-model-with-plan?${params}`
        );

        if (response.status === "success" && response.data?.data) {
          setVehicles(response.data.data);

          // Update pagination info
          if (response.data.pagination) {
            setMaxPages(response.data.pagination.totalPages);
          }

          // Update filter data with real API data
          updateFilterData(response.data.data);
        } else {
          throw new Error("Failed to fetch vehicles");
        }
      } catch (err) {
        console.error("Error fetching vehicles:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [itemsPerPage]
  );

  // Update filter data based on API response
  const updateFilterData = (vehicleData) => {
    // Extract unique brands
    const brandMap = new Map();
    const rangeMap = new Map();

    vehicleData.forEach((vehicle) => {
      const { brand, model } = vehicle;

      // Count brands
      if (brandMap.has(brand.name)) {
        brandMap.set(brand.name, brandMap.get(brand.name) + 1);
      } else {
        brandMap.set(brand.name, 1);
      }

      // Count ranges
      const range = model.range || 0;
      let rangeKey;
      if (range <= 40) rangeKey = "0-40";
      else if (range <= 80) rangeKey = "40-80";
      else if (range <= 120) rangeKey = "80-120";
      else rangeKey = "120+";

      if (rangeMap.has(rangeKey)) {
        rangeMap.set(rangeKey, rangeMap.get(rangeKey) + 1);
      } else {
        rangeMap.set(rangeKey, 1);
      }
    });

    // Convert to arrays
    const brands = Array.from(brandMap.entries()).map(([name, qty]) => ({
      img: `/images/${name}.png`,
      name,
      qty,
    }));

    const ranges = [
      { from: 0, to: 40, qty: rangeMap.get("0-40") || 0 },
      { from: 40, to: 80, qty: rangeMap.get("40-80") || 0 },
      { from: 80, to: 120, qty: rangeMap.get("80-120") || 0 },
      { from: 120, qty: rangeMap.get("120+") || 0 },
    ];

    setFilterData((prev) => ({
      ...prev,
      brands,
      ranges,
    }));
  };

  // Transform API data to match Cards component format with plan type
  const transformVehicleData = (vehicleData, planType) => {
    return vehicleData.map((vehicle) => {
      const { model, plan, brand, availableVehiclesCount } = vehicle;
      const configuredPlan = rentalPlanFor(vehicle, rentalMode, planType);

      if (isSubscription && !configuredPlan) return null;

      // Get price based on selected plan type
      let price;
      let actualPrice = null;

      switch (planType) {
        case "daily":
          price = configuredPlan?.price ?? plan.enterDailyPlanPrice;
          break;
        case "weekly":
          price = configuredPlan?.price ?? plan.enterWeeklyPlanPrice;
          actualPrice = plan.enterDailyPlanPrice * 7;
          break;
        case "monthly":
          price = configuredPlan?.price ?? plan.enterMonthlyPlanPrice;
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
        imgUrl:
          model.imageUrl ||
          model.image ||
          VEHICLE_IMAGES[brand.name] ||
          "/images/Scooter.png",
        brandLogoUrl: brand.brandLogo || `/images/${brand.name}.png`,
        price: price,
        actualPrice: actualPrice,
        range: model.range || 0,
        topSpeed: model.speed || 0,
        chargeTime: model.batteryChargingTime || 0,
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
        planId: configuredPlan?.id ?? plan.id,
        planName: configuredPlan?.name ?? plan.name,
        usageModel: isSubscription ? "payg" : "one_off",
        rentalMode,
        billingPolicy: configuredPlan?.billingPolicy ?? null,
      };
    }).filter(Boolean);
  };

  // Apply client-side filtering and sorting
  const filteredAndSortedVehicles = useMemo(() => {
    let transformedVehicles = transformVehicleData(vehicles, selectedPlanType);

    // Apply price range filter
    if (selectedFilters.minPrice > 0 || selectedFilters.maxPrice < 1000) {
      transformedVehicles = transformedVehicles.filter(
        (vehicle) =>
          vehicle.price >= selectedFilters.minPrice &&
          vehicle.price <= selectedFilters.maxPrice
      );
    }

    // Apply brand filter
    if (selectedFilters.selectedBrand) {
      transformedVehicles = transformedVehicles.filter(
        (vehicle) => vehicle.brandName === selectedFilters.selectedBrand.name
      );
    }

    // Apply range filter
    if (selectedFilters.selectedRange) {
      transformedVehicles = transformedVehicles.filter((vehicle) => {
        const range = vehicle.range;
        const { from, to } = selectedFilters.selectedRange;
        if (to) {
          return range >= from && range <= to;
        } else {
          return range >= from;
        }
      });
    }

    // Apply sorting
    transformedVehicles.sort((a, b) => {
      let comparison = 0;

      switch (sortOption) {
        case "Lowest Price":
          comparison = a.price - b.price;
          break;
        case "Highest Price":
          comparison = b.price - a.price;
          break;
        case "Name A-Z":
          comparison = a.vehicleName.localeCompare(b.vehicleName);
          break;
        case "Name Z-A":
          comparison = b.vehicleName.localeCompare(a.vehicleName);
          break;
        case "Highest Range":
          comparison = b.range - a.range;
          break;
        case "Lowest Range":
          comparison = a.range - b.range;
          break;
        default:
          comparison = a.price - b.price;
      }

      return comparison;
    });

    return transformedVehicles;
  }, [vehicles, selectedPlanType, selectedFilters, sortOption, rentalMode]);

  // Handle page change
  const handlePageChange = (page) => {
    setSelectedPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle filter application
  const handleFilterApply = (filters) => {
    setSelectedFilters(filters);
    setSelectedPage(1); // Reset to first page when applying filters
  };

  // Handle sort change
  const handleSortChange = (newSortOption) => {
    setSortOption(newSortOption);
    setSelectedPage(1); // Reset to first page when sorting
  };

  // Handle search trigger from SearchBar
  const handleSearchTrigger = (planType, tabIndex) => {
    console.log(
      "Search triggered with plan type:",
      planType,
      "tab index:",
      tabIndex
    );
    setSelectedPlanType(planType);
    setSelectedTabIndex(tabIndex);
    updateCurrentPlanType(planType);
    setSelectedPage(1); // Reset to first page
    setFromCatalogSelection(false); // Mark as not from catalog selection

    // Fetch new vehicles with the updated plan type
    fetchVehicles(1);
  };

  // Load selected plan type from sessionStorage on mount
  useEffect(() => {
    const storedPlanType = sessionStorage.getItem("selectedPlanType");
    const storedTabIndex = sessionStorage.getItem("selectedTabIndex");

    console.log("SearchPage loading from sessionStorage:", {
      storedPlanType,
      storedTabIndex,
    });

    if (storedPlanType) {
      console.log("Setting selectedPlanType to:", storedPlanType);
      setSelectedPlanType(storedPlanType);
      setFromCatalogSelection(true); // Mark that we came from catalog

      // Update current plan type in context
      updateCurrentPlanType(storedPlanType);

      // Auto-adjust dropoff date for the selected plan type
      adjustDropoffDateForPlan(storedPlanType);
    }
    if (storedTabIndex) {
      console.log("Setting selectedTabIndex to:", parseInt(storedTabIndex));
      setSelectedTabIndex(parseInt(storedTabIndex));
    }

    // Clear the stored values after reading
    sessionStorage.removeItem("selectedPlanType");
    sessionStorage.removeItem("selectedTabIndex");
  }, [updateCurrentPlanType, adjustDropoffDateForPlan]);

  // Log when selectedPlanType changes
  useEffect(() => {
    console.log(
      "SearchPage selectedPlanType state changed to:",
      selectedPlanType
    );
  }, [selectedPlanType]);

  // Fetch vehicles on component mount
  useEffect(() => {
    fetchVehicles(selectedPage);
  }, [selectedPage, fetchVehicles]);

  // Clear selected product on mount
  useEffect(() => {
    sessionStorage.removeItem("selectedProduct");
    setSelectedProduct(null);
  }, [setSelectedProduct]);

  // Listen for auto-detected plan type changes from date selection
  useEffect(() => {
    const handlePlanTypeAutoDetection = (event) => {
      const { planType, source } = event.detail;

      if (
        (source === "dateRange" || source === "pageLoad") &&
        !fromCatalogSelection
      ) {
        console.log("SearchPage received auto-detected plan type:", {
          planType,
          source,
        });

        // Find the tab index for the auto-detected plan type
        const tabIndex = planTypes.findIndex(
          (plan) => plan.planType === planType
        );
        if (tabIndex !== -1) {
          console.log(
            `Auto-switching SearchPage to ${planType} plan (tab ${tabIndex})`
          );
          setSelectedPlanType(planType);
          setSelectedTabIndex(tabIndex);
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
  }, [fromCatalogSelection, planTypes]); // Dependencies to ensure we have current values

  return (
    <div className="w-full overflow-x-hidden overflow-y-auto bg-white">
      <Navbar
        onSearchPage={true}
        expanded={true}
        onSearchTrigger={handleSearchTrigger}
      />
      <main className="px-[16px] pb-[72px] pt-[158px] sm:px-[28px] md:px-[clamp(32px,6vw,96px)] md:pb-[88px] md:pt-[196px]">
        {isLoading ? (
          <Loader />
        ) : (
          <>
            <div className="flex flex-col gap-[6px]">
              <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#6d5a9b]">
                {isSubscription ? "Subscriptions" : "Fixed rentals"}
              </span>
              <div className="flex flex-col gap-[4px] sm:flex-row sm:items-end sm:justify-between">
                <h1 className="text-[24px] font-bold text-[#1f1f1f]">
                  {filteredAndSortedVehicles?.length} vehicles available in {selectedLocation}
                </h1>
                <p className="text-[14px] text-[#6b6b6b]">
                  {isSubscription
                    ? "Choose how long you expect to ride. Billing renews automatically until you cancel."
                    : "Choose a vehicle now. You can confirm pickup and extras next."}
                </p>
              </div>
            </div>

            <div className="mt-[20px] flex flex-col gap-[10px] rounded-[16px] border border-[#eceaef] bg-[#faf9fb] p-[8px] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-[12px]">
              <div className="grid grid-cols-2 rounded-[12px] bg-[#efedf1] p-[3px]">
                {[
                  [RENTAL_MODES.fixed, "Fixed rental"],
                  [RENTAL_MODES.subscription, "Subscription"],
                ].map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleRentalModeChange(mode)}
                    className={`min-h-[44px] rounded-[10px] px-[14px] py-[9px] text-[12px] font-bold transition ${
                      rentalMode === mode
                        ? "bg-white text-[#26212c] shadow-sm"
                        : "text-[#746e79]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-[4px] rounded-[12px] border border-[#e4e1e7] bg-white p-[3px]">
                {planTypes.map((plan, index) => (
                  <button
                    key={plan.planType}
                    type="button"
                    onClick={() => handleSearchTrigger(plan.planType, index)}
                    className={`min-h-[44px] rounded-[9px] px-[10px] py-[8px] text-[12px] font-medium transition sm:px-[14px] ${
                      selectedPlanType === plan.planType
                        ? "bg-[#2b2630] text-white"
                        : "text-[#5f5964] hover:bg-[#f5f3f6]"
                    }`}
                  >
                    {plan.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-[24px] flex flex-wrap items-center justify-between gap-[16px] border-b border-[#ededed] pb-[18px]">
              <div className="relative flex flex-wrap items-center gap-[8px]">
                <button
                  id="sort-btn"
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex min-h-[44px] cursor-pointer items-center gap-x-[8px] rounded-full border border-[#D9D9D9] bg-white px-[14px] py-[8px] transition-colors hover:border-[#8d7ab8]"
                >
                  <img
                    className="w-[16px] aspect-sqaure"
                    src="/images/Sort-Down.png"
                    alt="Sort Down Icon"
                  />
                  <p className="font-medium text-[12px] text-[#3A3A3A]">
                    {sortOption}
                  </p>
                  <img
                    className={`${
                      showSortDropdown ? "rotate-180" : ""
                    } transition-all duration-500 w-[20px] aspect-sqaure`}
                    src="/images/mynaui_chevron-down.png"
                    alt="Dropdown Icon"
                  />
                </button>
                <SortDropdown
                  showSortDropdown={showSortDropdown}
                  setShowSortDropdown={setShowSortDropdown}
                  sortOption={sortOption}
                  setSortOption={handleSortChange}
                />
                <span className="hidden sm:block w-[1px] h-[20px] bg-[#EDEDED]" />
                <span className="rounded-full border border-[#e4e4e4] bg-[#fafafa] px-[14px] py-[8px] text-[12px] font-medium text-[#3a3a3a]">
                  All models
                </span>
                <span className="rounded-full border border-[#e4e4e4] bg-[#fafafa] px-[14px] py-[8px] text-[12px] font-medium text-[#3a3a3a]">
                  EV only
                </span>
              </div>
              <button
                onClick={() => setShowFiltersPage(true)}
                className="flex min-h-[44px] cursor-pointer items-center gap-x-[8px] rounded-full border border-transparent px-[12px] py-[8px] transition-colors hover:border-[#e4e4e4]"
              >
                <img
                  className="w-[20px] aspect-sqaure"
                  src="/images/Filter.png"
                  alt="Filter Icon"
                />
                <p className="font-bold text-[#00010C]">All Filters</p>
              </button>
              {showFiltersPage && (
                <FilterPage
                  data={filterData}
                  showFiltersPage={showFiltersPage}
                  setShowFiltersPage={setShowFiltersPage}
                  selectedFilters={selectedFilters}
                  setSelectedFilters={handleFilterApply}
                />
              )}
            </div>
            <div className="mt-[30px] grid w-full grid-cols-1 gap-[20px] sm:grid-cols-2 xl:grid-cols-3 xl:gap-[28px]">
              <Cards
                cards={filteredAndSortedVehicles}
                selectedPlanType={selectedPlanType}
              />
            </div>
            <Pagination
              selectedPage={selectedPage}
              setSelectedPage={handlePageChange}
              maxPages={maxPages}
            />
          </>
        )}
      </main>
      <WhyBlive />
      <Customers />
      <Footer />
    </div>
  );
};

export default SearchPage;
