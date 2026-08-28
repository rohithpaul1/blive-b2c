import { useEffect, useRef, useState } from "react";
import PriceRangeSlider from "./PriceRangeSlider";

// PriceRangeSlider always needs real numbers to position its handles —
// selectedFilters.minPrice/maxPrice are null until the user actually
// applies a price filter (see SearchPage.jsx), so the slider falls back to
// its own full range (matches PriceRangeSlider's own hardcoded 100/2000
// bounds) rather than rendering with min/max stuck at null.
const DEFAULT_MIN_PRICE = 100;
const DEFAULT_MAX_PRICE = 2000;

const FilterPage = ({ data, selectedFilters, setSelectedFilters, setShowFiltersPage }) => {
    const [minVal, setMinVal] = useState(selectedFilters?.minPrice ?? DEFAULT_MIN_PRICE);
    const [maxVal, setMaxVal] = useState(selectedFilters?.maxPrice ?? DEFAULT_MAX_PRICE);
    const [selectedTempBrand, setSelectedTempBrand] = useState(selectedFilters?.selectedBrand);
    const [selectedTempRange, setSelectedTempRange] = useState(selectedFilters?.selectedRange);
    const panelRef = useRef(null);

    // Sync with parent filters whenever they change
    useEffect(() => {
        setMinVal(selectedFilters?.minPrice ?? DEFAULT_MIN_PRICE);
        setMaxVal(selectedFilters?.maxPrice ?? DEFAULT_MAX_PRICE);
        setSelectedTempBrand(selectedFilters?.selectedBrand);
        setSelectedTempRange(selectedFilters?.selectedRange);
    }, [selectedFilters]);

    // Close on an outside click — same mousedown-outside-the-panel pattern
    // already used by LocationDropdown.jsx/ProfileDropdown.jsx elsewhere in
    // this app, so this modal behaves consistently with those instead of
    // needing its own separate close mechanism. Discards any in-progress,
    // not-yet-applied slider/pill picks, same as if Apply was never clicked.
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setShowFiltersPage(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [setShowFiltersPage]);

    return (
        <div className="fixed top-0 left-0 z-30 h-screen w-screen bg-black/50 flex items-center justify-center">
            <div ref={panelRef} className="w-[900px] max-h-[90%] py-[24px] px-[32px] bg-white overflow-y-auto">
                <p className="font-bold text-[18px] text-[#222222]">Price Range</p>
                <p className="text-[#222222] font-medium">The average price per day is ₹{data?.avgPrice} for your dates</p>
                <div className="flex mt-[24px] flex-col w-full">
                    <PriceRangeSlider minVal={minVal} maxVal={maxVal} setMinVal={setMinVal} setMaxVal={setMaxVal} />
                </div>

                <hr className="mt-[24px] border-[#D9D9D9]" />
                <div className="flex flex-col mt-[24px]">
                    <p className="font-bold text-[18px] text-[#222222]">Brand</p>
                    <div className="flex items-center mt-[24px] overflow-x-auto noscroll gap-x-[16px]">
                        {data?.brands?.map((brand) => (
                            <div
                                key={brand.id}
                                onClick={() => setSelectedTempBrand(selectedTempBrand?.id === brand.id ? null : brand)}
                                className={`${selectedTempBrand?.id === brand.id ? "border-[#434249] bg-[#DDDCE3]" : "border-[#D9D9D9] bg-white"} transition-all duration-500 cursor-pointer flex items-center gap-x-[8px] py-[6px] h-[40px] px-[16px] border rounded-[24px] min-w-fit`}
                            >
                                {brand.logoUrl ? (
                                    <img src={brand.logoUrl} alt={`${brand.name} Logo`} className="h-2/3 max-w-[40px] object-contain mix-blend-multiply" />
                                ) : (
                                    <span className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-[#EDEDED] text-[10px] font-bold text-[#717171]">
                                        {brand.name?.charAt(0).toUpperCase()}
                                    </span>
                                )}
                                <p className="font-medium text-[14px] text-[#3A3A3A] whitespace-nowrap">
                                    {brand.name}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <hr className="mt-[24px] border-[#D9D9D9]" />
                <div className="flex flex-col mt-[24px]">
                    <p className="font-bold text-[18px] text-[#222222]">Range</p>
                    <div className="flex items-center mt-[24px] overflow-x-auto noscroll gap-x-[16px]">
                        {data?.ranges?.map((range, i) => (
                            <div
                                key={range.from + "_" + range.to + "_" + i}
                                onClick={() => setSelectedTempRange(range)}
                                className={`${selectedTempRange?.from === range.from && selectedTempRange?.to === range.to ? "border-[#434249] bg-[#DDDCE3]" : "border-[#D9D9D9] bg-white"} transition-all duration-500 cursor-pointer flex items-center gap-x-[8px] py-[6px] h-[40px] px-[16px] border rounded-[24px] min-w-fit`}
                            >
                                <p className="font-medium text-[14px] text-[#3A3A3A] whitespace-nowrap">
                                    {range.from} {range?.to ? "to" : "kms"} {range?.to ? range.to + "kms" : "& above"} ({range.qty})
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-[24px] py-[16px] px-[16px] flex items-center gap-x-[16px]">
                    <p onClick={() => {
                        setSelectedFilters({ minPrice: null, maxPrice: null, selectedBrand: null, selectedRange: null });
                        setShowFiltersPage(false);
                    }} className="text-center cursor-pointer underline font-semibold text-[#484848] text-[14px] flex-1">Clear Filters</p>
                    <button
                        onClick={() => {
                            setSelectedFilters({ minPrice: minVal, maxPrice: maxVal, selectedBrand: selectedTempBrand, selectedRange: selectedTempRange });
                            setShowFiltersPage(false);
                        }}
                        className="cursor-pointer flex-1 bg-[#000000] font-bold text-[#FDFDFD] py-[13px] px-[24px] flex items-center justify-center rounded-[24px] h-[48px]"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilterPage;