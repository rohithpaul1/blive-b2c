import { useContext, useState, useEffect, useMemo, useCallback } from "react";
import Navbar from "../sections/Navbar";
import ModelPicker from "../components/ModelPicker";
import { franchiseHome } from "../config/franchiseHome";
import { SearchBarContext } from "../contexts/SearchBarContext";
import Pagination from "../components/Pagination";
import Loader from "../components/Loader";
import SortDropdown from "../components/SortDropdown";
import FilterPage from "../components/FilterPage";
import { ProductContext } from "../contexts/ProductContext";
import { getAPI } from "../caller/axiosUrls";
import Footer from "../sections/Footer";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { RENTAL_MODES, rentalPlanFor } from "../utils/subscription";

const VEHICLE_IMAGES = {
  Lectrix: "/images/home/nduro-side.png",
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
    selectedPickup,
    selectedDropoff,
    adjustDropoffDateForPlan,
    updateCurrentPlanType,
    rentalMode,
  } = useContext(SearchBarContext);
  const isSubscription = rentalMode === RENTAL_MODES.subscription;
  const { setSelectedProduct } = useContext(ProductContext);

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
        perKmCharge: model.perKmCharge ?? null,
        currentMileage: model.currentMileage || 0,
        vehicleSpeed: model.vehicleSpeed || "standard",
        engineType: model.engineType || "ev",
        vehicleCategory: model.vehicleCategory || "two-wheeler",
        b2cDeposit: model.b2cDeposit,
        onboardingFee: (configuredPlan?.onboardingFee ?? plan.onboardingFee) ?? 0,
        openingWalletBalance: (configuredPlan?.openingWalletBalance ?? plan.openingWalletBalance) ?? 0,
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

  // One entry per model with every plan it offers, in the filtered and sorted order.
  const pickerModels = useMemo(() => {
    const byId = new Map();
    ["daily", "weekly", "monthly"].forEach((planType) => {
      transformVehicleData(vehicles, planType).forEach((card) => {
        const entry = byId.get(card.id) || { ...card, plans: {} };
        entry.plans[planType] = {
          price: card.price,
          card: {
            price: card.price,
            actualPrice: card.actualPrice,
            planId: card.planId,
            planName: card.planName,
            onboardingFee: card.onboardingFee,
            openingWalletBalance: card.openingWalletBalance,
            billingPolicy: card.billingPolicy,
          },
        };
        byId.set(card.id, entry);
      });
    });
    // This franchise rents only its own brand; other models in the catalog stay hidden.
    const brand = String(franchiseHome.model.brand || "").toLowerCase();
    const ownBrand = (m) =>
      !brand ||
      String(m.brandName || "").toLowerCase().includes(brand) ||
      String(m.vehicleName || "").toLowerCase().includes(brand);
    return filteredAndSortedVehicles.map((v) => byId.get(v.id)).filter((m) => m && ownBrand(m));
  }, [vehicles, rentalMode, filteredAndSortedVehicles]);

  const handlePlanPick = (planType) => {
    setSelectedPlanType(planType);
    updateCurrentPlanType(planType);
    adjustDropoffDateForPlan(planType);
  };

  const showCatalogTools = pickerModels.length > 1;

  // overflow-x-clip (not hidden) so the sticky filter row sticks to the page scroll
  return (
    <div className="w-full overflow-x-clip bg-white">
      <Navbar
        onSearchPage={true}
        expanded={true}
        onSearchTrigger={handleSearchTrigger}
      />
      <main className="px-[16px] pb-[72px] pt-[96px] sm:px-[28px] md:px-[clamp(32px,6vw,96px)] md:pb-[88px] md:pt-[108px]">
        {isLoading ? (
          <Loader />
        ) : (
          <>
            {/* Phones: one swipeable row of filter chips pinned under the search bar, then a short count. */}
            <div className="flex flex-col">
              {showCatalogTools && (
              <div className={`sticky top-[82px] ${showSortDropdown || showFiltersPage ? "z-[60]" : "z-30"} order-first -mx-[16px] border-b border-[#ebebeb] bg-white px-[16px] pb-[12px] md:static md:order-none md:mx-0 md:mt-[20px] md:border-[#ededed] md:bg-transparent md:px-0 md:pb-[18px]`}>
                <div className="relative">
                  <div className="-mx-[16px] flex items-center gap-[8px] overflow-x-auto px-[16px] [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
                    <button
                      type="button"
                      onClick={() => setShowFiltersPage(true)}
                      className="flex h-[36px] shrink-0 cursor-pointer items-center gap-[6px] whitespace-nowrap rounded-full border border-[#dddddd] bg-white px-[14px] text-[13px] font-medium text-[#222222] transition-colors hover:border-[#222222] md:h-[44px] md:text-[14px]"
                    >
                      <SlidersHorizontal size={15} aria-hidden="true" />
                      Filters
                    </button>
                    <button
                      id="sort-btn"
                      type="button"
                      onClick={() => setShowSortDropdown(!showSortDropdown)}
                      aria-expanded={showSortDropdown}
                      className="flex h-[36px] shrink-0 cursor-pointer items-center gap-[6px] whitespace-nowrap rounded-full border border-[#222222] bg-[#222222] px-[14px] text-[13px] font-medium text-white md:h-[44px] md:text-[14px]"
                    >
                      {sortOption}
                      <ChevronDown size={15} className={`transition-transform duration-300 ${showSortDropdown ? "rotate-180" : ""}`} aria-hidden="true" />
                    </button>
                    <span className="flex h-[36px] shrink-0 items-center whitespace-nowrap rounded-full border border-[#dddddd] px-[14px] text-[13px] font-medium text-[#222222] md:h-[44px] md:text-[14px]">
                      All models
                    </span>
                    <span className="flex h-[36px] shrink-0 items-center whitespace-nowrap rounded-full border border-[#dddddd] px-[14px] text-[13px] font-medium text-[#222222] md:h-[44px] md:text-[14px]">
                      EV only
                    </span>
                  </div>
                  <SortDropdown
                    showSortDropdown={showSortDropdown}
                    setShowSortDropdown={setShowSortDropdown}
                    sortOption={sortOption}
                    setSortOption={handleSortChange}
                  />
                </div>
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
              )}

              <div className="mt-[16px] md:mt-[24px]">
                {pickerModels.length > 0 ? (
                  <ModelPicker
                    models={pickerModels}
                    selectedPlanType={selectedPlanType}
                    onPlanChange={handlePlanPick}
                    pickup={selectedPickup}
                    dropoff={selectedDropoff}
                    cutout={pickerModels.length === 1 ? franchiseHome.model.cutout : null}
                  />
                ) : (
                  <div className="rounded-[20px] border border-[#e3e0e8] px-[24px] py-[48px] text-center">
                    <h1 className="font-display m-0 text-[40px] leading-none text-[#0f0d16]">No scooters for these dates</h1>
                    <p className="m-0 mt-[10px] text-[16px] text-[#5a5562]">
                      The {franchiseHome.model.name} isn't listed for these dates yet. Try different dates, or call {franchiseHome.supportPhone}.
                    </p>
                  </div>
                )}
              </div>
            {maxPages > 1 && (
              <Pagination
                selectedPage={selectedPage}
                setSelectedPage={handlePageChange}
                maxPages={maxPages}
              />
            )}
            </div>
          </>
        )}
      </main>
      {/* Marketing sections stay on the home page; results end at the footer. */}
      <Footer />
    </div>
  );
};

export default SearchPage;
