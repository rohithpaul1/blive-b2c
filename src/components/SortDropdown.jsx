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
        <div ref={sortRef} className={`absolute left-0 overflow-hidden transition-all duration-500 ${showSortDropdown ? "mt-[620px] w-[438px] h-[562px] py-[16px]" : "mt-[50px] h-0 w-[138px]"} rounded-[16px] z-20 bg-white calender-shadow`}>
            <p className="py-[16px] text-left px-[32px] text-[18px] font-bold text-[#222222]">Sort</p>

            {options.map((option, idx) => (
                <div key={idx} className="w-full flex items-center gap-x-[12px] px-[32px] h-[58px]">
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
                        <p className="font-medium text-[#222222]">{option}</p>
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
    );
};

export default SortDropdown;