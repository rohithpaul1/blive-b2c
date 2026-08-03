import { useEffect, useState } from "react";
import PriceRangeSlider from "./PriceRangeSlider";

const FilterPage = ({ data, selectedFilters, setSelectedFilters, setShowFiltersPage }) => {
    const [minVal, setMinVal] = useState(selectedFilters?.minPrice);
    const [maxVal, setMaxVal] = useState(selectedFilters?.maxPrice);
    const [selectedTempBrand, setSelectedTempBrand] = useState(selectedFilters?.selectedBrand);
    const [selectedTempRange, setSelectedTempRange] = useState(selectedFilters?.selectedRange);

    // Sync with parent filters whenever they change
    useEffect(() => {
        setMinVal(selectedFilters?.minPrice);
        setMaxVal(selectedFilters?.maxPrice);
        setSelectedTempBrand(selectedFilters?.selectedBrand);
        setSelectedTempRange(selectedFilters?.selectedRange);
    }, [selectedFilters]);

    return (
        <div className="fixed top-0 left-0 z-30 h-screen w-screen bg-black/50 flex items-center justify-center">
            <div className="w-[900px] max-h-[90%] py-[24px] px-[32px] bg-white overflow-y-auto">
                <p className="font-bold text-[18px] text-[#222222]">Price Range</p>
                <p className="text-[#222222] font-medium">The average price per day is ₹{data?.avgPrice} for your dates</p>
                <div className="flex mt-[24px] flex-col w-full">
                    <PriceRangeSlider minVal={minVal} maxVal={maxVal} setMinVal={setMinVal} setMaxVal={setMaxVal} />
                </div>

                <hr className="mt-[24px] border-[#D9D9D9]" />
                <div className="flex flex-col mt-[24px]">
                    <p className="font-bold text-[18px] text-[#222222]">Brand</p>
                    <div className="flex items-center mt-[24px] overflow-x-auto noscroll gap-x-[16px]">
                        {data?.brands?.map((brand, i) => (
                            <div
                                key={brand.name + i}
                                onClick={() => setSelectedTempBrand(brand)}
                                className={`${selectedTempBrand?.name === brand.name ? "border-[#434249] bg-[#DDDCE3]" : "border-[#D9D9D9] bg-white"} transition-all duration-500 cursor-pointer flex items-center gap-x-[8px] py-[6px] h-[40px] px-[16px] border rounded-[24px] min-w-fit`}
                            >
                                <img src={brand.img} alt={`${brand.name} Logo`} className="h-2/3 max-w-[40px] object-contain mix-blend-multiply" />
                                <p className="font-medium text-[14px] text-[#3A3A3A] whitespace-nowrap">
                                    {brand.name} ({brand.qty})
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
                        setSelectedFilters({ minPrice: 100, maxPrice: 2000 });
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