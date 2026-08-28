import { useContext, useState, useEffect, useMemo, useCallback } from "react";
import Navbar from "../sections/Navbar";
import Cards from "../components/Cards";
import { SearchBarContext } from "../contexts/SearchBarContext";
import Pagination from "../components/Pagination";
import Loader from "../components/Loader";
import SortDropdown from "../components/SortDropdown";
import FilterPage from "../components/FilterPage";
import { ProductContext } from "../contexts/ProductContext";
import WhyBlive from "../sections/WhyBlive";
import Customers from "../sections/Customers";
import Footer from "../sections/Footer";
import { RENTAL_MODES } from "../utils/subscription";
import { getDefaultHubId, rangeToBucket, searchVehicles, transformSearchResult } from "../lib/catalogueSearch";
import { getVehicleOems } from "../lib/vehicleOem";

const SearchPage = () => {
  // Pagination — /catalogue/search has no page/limit params, it returns
  // everything for the hub in one shot, so this pages the full result set
  // client-side instead of asking the server for one page at a time.
  const [selectedPage, setSelectedPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [hubId, setHubId] = useState(null);

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

  // null minPrice/maxPrice means "the user hasn't applied a price filter" —
  // deliberately not seeded with concrete numbers (e.g. 0/1000), otherwise
  // fetchVehicles below can't tell "no filter yet" apart from "the user
  // applied exactly this range" and would send minPrice/maxPrice on every
  // search, including the very first unfiltered one from Home.
  const [selectedFilters, setSelectedFilters] = useState({
    minPrice: null,
    maxPrice: null,
    selectedBrand: null,
    selectedRange: null,
  });

  const {
    selectedLocation,
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

  // Resolve a default hub once on mount — /catalogue/search is scoped to
  // one hub per call, no hub-picker UI exists yet (see conversation).
  useEffect(() => {
    getDefaultHubId()
      .then(setHubId)
      .catch((err) => console.error("Error resolving default hub:", err));
  }, []);

  // "Brand" pills come from the real GET /catalogue/vehicle-oem list — a
  // tenant-wide OEM directory, not something guessed from vehicle names —
  // fetched once (it doesn't depend on hub/dates/term at all).
  useEffect(() => {
    getVehicleOems()
      .then((oems) => {
        setFilterData((prev) => ({
          ...prev,
          brands: oems.map((oem) => ({ id: oem.id, name: oem.name, logoUrl: oem.logoUrl })),
        }));
      })
      .catch((err) => console.error("Error fetching vehicle OEMs:", err));
  }, []);

  // Base (unfiltered by price/range) fetch, used only to compute
  // FilterPage's brand/range facet counts. Deliberately independent of
  // selectedFilters — those counts should describe the whole catalogue for
  // these hub/dates/term, not whatever price/range filter is currently
  // applied (otherwise applying one filter would make every OTHER facet's
  // count look wrong, e.g. drop to 0 once the list itself is filtered down
  // to just that bucket).
  useEffect(() => {
    if (!hubId) return undefined;
    let cancelled = false;
    searchVehicles({
      hubId,
      isSubscription,
      planType: selectedPlanType,
      pickup: selectedPickup,
      dropoff: selectedDropoff,
    })
      .then((results) => {
        if (!cancelled) updateFilterData(results);
      })
      .catch((err) => console.error("Error fetching filter facet data:", err));
    return () => {
      cancelled = true;
    };
  }, [hubId, isSubscription, selectedPlanType, selectedPickup, selectedDropoff]);

  // Fetch the actual displayed/paginated vehicle list from /catalogue/search
  // — server-side filtered by FilterPage's price range, range-bucket pill,
  // and brand pill (confirmed query params: minPrice, maxPrice, rangeBuckets,
  // oemIds) so filtering applies across the whole catalogue instead of just
  // whatever page of results was already fetched. No page/limit params on
  // this endpoint — it returns everything matching in one shot, paged
  // client-side below instead.
  const fetchVehicles = useCallback(async () => {
    try {
      setIsLoading(true);
      const results = await searchVehicles({
        hubId,
        isSubscription,
        planType: selectedPlanType,
        pickup: selectedPickup,
        dropoff: selectedDropoff,
        minPrice: selectedFilters.minPrice,
        maxPrice: selectedFilters.maxPrice,
        rangeBucket: rangeToBucket(selectedFilters.selectedRange),
        oemId: selectedFilters.selectedBrand?.id,
      });
      setVehicles(results);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
    } finally {
      setIsLoading(false);
    }
  }, [
    hubId,
    isSubscription,
    selectedPlanType,
    selectedPickup,
    selectedDropoff,
    selectedFilters.minPrice,
    selectedFilters.maxPrice,
    selectedFilters.selectedRange,
    selectedFilters.selectedBrand,
  ]);

  // Update the "Range" pill counts from a base (unfiltered) fetch. Brand
  // pills are NOT computed here any more — see the getVehicleOems effect
  // above — this endpoint's response has no OEM id on each result to count
  // by, only a vehicle-model name, which isn't a reliable way to attribute
  // a result back to one of the real OEMs above.
  const updateFilterData = (vehicleData) => {
    const rangeMap = new Map();

    vehicleData.forEach((item) => {
      const range = item.rangePerCharge || 0;
      let rangeKey;
      if (range <= 40) rangeKey = "0-40";
      else if (range <= 80) rangeKey = "40-80";
      else if (range <= 120) rangeKey = "80-120";
      else rangeKey = "120+";

      rangeMap.set(rangeKey, (rangeMap.get(rangeKey) || 0) + 1);
    });

    const ranges = [
      { from: 0, to: 40, qty: rangeMap.get("0-40") || 0 },
      { from: 40, to: 80, qty: rangeMap.get("40-80") || 0 },
      { from: 80, to: 120, qty: rangeMap.get("80-120") || 0 },
      { from: 120, qty: rangeMap.get("120+") || 0 },
    ];

    setFilterData((prev) => ({ ...prev, ranges }));
  };

  // Transform API data to match Cards component format. Search already
  // returns the ONE plan tier matching the requested dates/howLong, so
  // there's no per-tab plan lookup needed here any more (see
  // transformSearchResult's comment for field-by-field detail).
  const transformVehicleData = (vehicleData) =>
    (vehicleData || []).map((item) => transformSearchResult(item, { isSubscription, rentalMode }));

  // Apply client-side filtering and sorting
  const filteredAndSortedVehicles = useMemo(() => {
    let transformedVehicles = transformVehicleData(vehicles);

    // Apply price range filter — only once the user has actually applied
    // one; null here (see selectedFilters' initial state) must NOT get
    // coerced into a 0 lower/upper bound, which would filter out every
    // real vehicle (price <= null -> price <= 0).
    if (selectedFilters.minPrice != null || selectedFilters.maxPrice != null) {
      const min = selectedFilters.minPrice ?? 0;
      const max = selectedFilters.maxPrice ?? Infinity;
      transformedVehicles = transformedVehicles.filter(
        (vehicle) => vehicle.price >= min && vehicle.price <= max
      );
    }

    // Brand is filtered server-side now (oemIds, see fetchVehicles) — this
    // endpoint's response has no OEM id per result to re-check client-side
    // against selectedFilters.selectedBrand, unlike price/range above.

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

  // /catalogue/search has no page/limit params — this pages the already
  // client-side-filtered/sorted list instead of asking the server for one
  // page at a time (which the old endpoint used to do).
  const maxPages = Math.max(1, Math.ceil(filteredAndSortedVehicles.length / itemsPerPage));
  const pagedVehicles = useMemo(
    () => filteredAndSortedVehicles.slice((selectedPage - 1) * itemsPerPage, selectedPage * itemsPerPage),
    [filteredAndSortedVehicles, selectedPage, itemsPerPage]
  );

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

    // No manual fetchVehicles() call needed — the effect below already
    // re-fetches whenever selectedPlanType changes.
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

  // Fetch vehicles whenever the actual search parameters change — page
  // changes don't refetch (see pagedVehicles above), fetchVehicles' own
  // useCallback deps are what decide when this really needs to run.
  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

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
      <main className="px-[16px] pb-[72px] pt-[158px] sm:px-[28px] md:px-[clamp(32px,6vw,96px)] md:pb-[88px] md:pt-[108px]">
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
                  {filteredAndSortedVehicles?.length} vehicles available{selectedLocation ? ` in ${selectedLocation}` : ""}
                </h1>
                <p className="text-[14px] text-[#6b6b6b]">
                  {isSubscription
                    ? "Choose how long you expect to ride. Billing renews automatically until you cancel."
                    : "Choose a vehicle now. You can confirm pickup and extras next."}
                </p>
              </div>
            </div>

            <div className="mt-[20px] flex flex-wrap items-center justify-between gap-[16px] border-b border-[#ededed] pb-[18px]">
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
                cards={pagedVehicles}
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
