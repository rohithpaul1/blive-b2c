import { useState, useEffect, useRef } from "react";

const SortDropdown = ({ sortOption, setSortOption, setShowSortDropdown, showSortDropdown }) => {
    const [tempSort, setTempSort] = useState(sortOption);

    const sortRef = useRef(null);

    const options = [
        "Relevance",
        "Lowest Price",
        "Highest Price",
        "Lowest Charging Time",
        "Highest Charging Time",
        "Lowest Range",
        "Highest Range",
    ];

    useEffect(() => {
        if (showSortDropdown) setTempSort(sortOption);
    }, [sortOption, showSortDropdown]);

    useEffect(() => {
        function handleClickOutside(event) {
        // IDs to ignore
        const ignoreIds = ["sort-btn", "sort-apply"];

        // Check if clicked element has any of those IDs or is inside them
        const clickedInsideIgnored = ignoreIds.some((id) =>
            document.getElementById(id)?.contains(event.target)
        );

        if (
            sortRef.current &&
            !sortRef.current.contains(event.target) &&
            !clickedInsideIgnored
        ) {
            setShowSortDropdown(false);
        }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <>
        {/* Phones: a bottom sheet over a dimmed page. md and up: the original dropdown. */}
        {showSortDropdown && <div className="fixed inset-0 z-[59] bg-black/40 md:hidden" aria-hidden="true" />}
        <div ref={sortRef} className={`overflow-hidden bg-white calender-shadow ${showSortDropdown
            ? "fixed inset-x-0 bottom-0 z-[60] w-full rounded-t-[20px] pt-[8px] pb-[calc(16px+env(safe-area-inset-bottom,0px))] md:absolute md:inset-x-auto md:bottom-auto md:left-0 md:z-20 md:mt-[620px] md:h-[562px] md:w-[438px] md:rounded-[16px] md:py-[16px]"
            : "hidden md:absolute md:left-0 md:z-20 md:mt-[50px] md:block md:h-0 md:w-[138px] md:rounded-[16px]"} md:transition-all md:duration-500`}>
            <p className="py-[14px] text-left px-[24px] text-[18px] font-bold text-[#222222] md:px-[32px] md:py-[16px]">Sort by</p>

            {options.map((option, idx) => (
                <div key={idx} className="w-full flex items-center gap-x-[12px] px-[24px] h-[52px] md:px-[32px] md:h-[58px]">
                    <label className="flex items-center gap-x-[12px] cursor-pointer w-full">
                        <input
                            type="radio"
                            name="filter"
                            value={option}
                            checked={tempSort === option}
                            onChange={(e) => setTempSort(e.target.value)}
                            className="hidden peer"
                        />
                        <span className="w-4 h-4 rounded-full border-3 border-white outline outline-[#CBCBCB] peer-checked:outline-[#0011A7] peer-checked:bg-[#0011A7]" />
                        <p className="text-[15px] font-medium text-[#222222]">{option}</p>
                    </label>
                </div>
            ))}

            <button
                id="sort-apply"
                onClick={() => {
                    setSortOption(tempSort);
                    setShowSortDropdown(false);
                }}
                className="mt-[16px] cursor-pointer w-[90%] mx-auto bg-black py-[13px] px-[24px] rounded-[24px] flex items-center justify-center font-bold text-[#FDFDFD]"
            >
                Apply
            </button>
        </div>
        </>
    );
};

export default SortDropdown;