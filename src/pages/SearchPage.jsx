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

  const { selectedLocation, adjustDropoffDateForPlan, updateCurrentPlanType } =
    useContext(SearchBarContext);
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

      // Get price based on selected plan type
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
        planId: plan.id,
        planName: plan.name,
      };
    });
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
  }, [vehicles, selectedPlanType, selectedFilters, sortOption]);

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
    <div className="w-full overflow-x-hidden overflow-y-auto">
      <Navbar
        onSearchPage={true}
        expanded={true}
        onSearchTrigger={handleSearchTrigger}
      />
      <div className="mt-[200px] pt-[50px] pb-[100px] px-[15%]">
        {isLoading ? (
          <Loader />
        ) : (
          <>
            <p className="font-bold text-[18px] text-[#222222]">
              {filteredAndSortedVehicles?.length} Bikes available for rent in{" "}
              {selectedLocation}
            </p>

            {/* Plan Type Tabs - Only show if not from catalog selection */}
            {/* {!fromCatalogSelection && (
              <div className="mt-[24px] flex items-center justify-center">
                <div className="relative flex items-center justify-center w-[610px] h-[48px] rounded-[30px] py-[3px] px-[6px] gap-[3px] bg-white overflow-hidden">
                  <div
                    className={`absolute top-[3px] left-[6px] h-[42px] w-[calc(33.333%-6px)] rounded-[32px] transition-transform duration-500`}
                    style={{
                      transform: `translateX(${selectedTabIndex * 100}%)`,
                      background:
                        "linear-gradient(94.52deg, #0F0F0F 12.24%, #561D5D 75.03%)",
                      boxShadow:
                        "0px 9px 28px 8px #0000000D, 0px 3px 6px -4px #0000001F, 0px 6px 16px 0px #00000014",
                    }}
                  />
                  {planTypes.map((plan, i) => (
                    <div
                      key={"plan-" + plan.name + "-" + i}
                      onClick={() => handlePlanTypeChange(plan.planType, i)}
                      className="cursor-pointer flex-1 z-10 flex gap-x-[12px] items-center justify-center"
                    >
                      <p
                        className={`font-bold text-center transition-all duration-500 ${
                          selectedTabIndex === i ? "text-white" : "text-black"
                        }`}
                      >
                        {plan.name}
                      </p>
                      {plan.discount && (
                        <div className="w-[72px] flex justify-center items-center h-[22px]">
                          <p className="bg-[#fff5f7] py-[1px] px-[8px] font-bold text-[12px] gap-[4px] border rounded-[4px] border-[#FBB6CE] text-[#702459]">
                            Save {plan.discount}%
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )} */}

            {/* Show selected plan type when coming from catalog */}
            {/* {fromCatalogSelection && (
              <div className="mt-[24px] flex items-center justify-center">
                <div className="flex items-center gap-x-[16px] bg-white rounded-[30px] py-[12px] px-[24px] shadow-md">
                  <p className="font-bold text-[18px] text-[#0F0F0F]">
                    {
                      planTypes.find((p) => p.planType === selectedPlanType)
                        ?.name
                    }{" "}
                    Plan
                  </p>
                  {planTypes.find((p) => p.planType === selectedPlanType)
                    ?.discount && (
                    <div className="flex justify-center items-center">
                      <p className="bg-[#fff5f7] py-[1px] px-[8px] font-bold text-[12px] border rounded-[4px] border-[#FBB6CE] text-[#702459]">
                        Save{" "}
                        {
                          planTypes.find((p) => p.planType === selectedPlanType)
                            ?.discount
                        }
                        %
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => setFromCatalogSelection(false)}
                    className="text-[#0F0F0F] underline text-[14px] font-medium hover:text-gray-600"
                  >
                    Change Plan
                  </button>
                </div>
              </div>
            )} */}

            <div className="mt-[16px] flex items-center justify-between">
              <div className="relative flex items-center gap-x-[8px]">
                <button
                  id="sort-btn"
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="cursor-pointer rounded-[24px] border border-[#D9D9D9] gap-x-[8px] py-[6px] px-[16px] h-[32px] flex items-center"
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
                <span className="block w-[2px] h-[20px] bg-[#EDEDED]" />
              </div>
              <button
                onClick={() => setShowFiltersPage(true)}
                className="cursor-pointer flex items-center p-[2px] gap-x-[8px]"
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
            <div className="mt-[30px] grid grid-cols-3 gap-x-[38px] gap-y-[54px] w-full">
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
      </div>
    </div>
  );
};

export default SearchPage;
