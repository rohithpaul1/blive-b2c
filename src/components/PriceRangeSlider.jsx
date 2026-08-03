const PriceRangeSlider = ({ minVal, maxVal, setMinVal, setMaxVal }) => {
  const minPrice = 100;
  const maxPrice = 2000;

  const handleMinChange = (e) => {
    const value = Math.min(Number(e.target.value), maxVal - 50);
    setMinVal(value);
  };

  const handleMaxChange = (e) => {
    const value = Math.max(Number(e.target.value), minVal + 50);
    setMaxVal(value);
  };

  const minPercent = ((minVal - minPrice) / (maxPrice - minPrice)) * 100;
  const maxPercent = ((maxVal - minPrice) / (maxPrice - minPrice)) * 100;

  return (
    <div className="w-full flex flex-col mt-[32px] relative">
      {/* Image Wrapper with Overlay */}
      <div className="relative w-full">
        <img
          src="/images/PriceRange.png"
          alt="Range Image"
          className="mb-[4px] ml-2 w-full object-cover"
        />

        {/* Left Overlay (Before Min) */}
        <div
          className="absolute top-0 left-0 h-full bg-gray-400 opacity-40"
          style={{ width: `${minPercent}%` }}
        />

        {/* Right Overlay (After Max) */}
        <div
          className="absolute top-0 right-0 h-full bg-gray-400 opacity-40"
          style={{ width: `${100 - maxPercent}%` }}
        />
      </div>

      {/* Slider Track */}
      <div className="relative w-full h-[2px] bg-gray-300">
        {/* Selected Range */}
        <div
          className="absolute h-[2px] bg-[#484848]"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />

        {/* Min Slider */}
        <input
          type="range"
          min={minPrice}
          max={maxPrice}
          value={minVal}
          onChange={handleMinChange}
          className="absolute left top-[-6px] w-full appearance-none pointer-events-auto"
          style={{
            zIndex: minVal > maxPrice - 100 ? 5 : 3,
          }}
        />

        {/* Max Slider */}
        <input
          type="range"
          min={minPrice}
          max={maxPrice}
          value={maxVal}
          onChange={handleMaxChange}
          className="absolute right top-[-6px] w-full appearance-none pointer-events-auto"
          style={{
            zIndex: 4,
          }}
        />
      </div>

      {/* Price Display */}
      <div className="flex justify-center mt-[32px] gap-x-[32px]">
        <div className="flex-1 flex flex-col gap-y-[4px]">
          <p className="font-medium text-[#717171] text-[12px]">
            Minimum Price
          </p>
          <input
            type="text"
            readOnly
            value={`₹${minVal}`}
            className="bg-[#F7F7F7] border text-[#717171] text-[14px] border-[#EDEDED] px-[16px] py-[13px] rounded-[8px]"
          />
        </div>
        <div className="flex-1 flex flex-col gap-y-[4px]">
          <p className="font-medium text-[#717171] text-[12px]">
            Maximum Price
          </p>
          <input
            type="text"
            readOnly
            value={`₹${maxVal}`}
            className="bg-[#F7F7F7] border text-[#717171] text-[14px] border-[#EDEDED] px-[16px] py-[13px] rounded-[8px]"
          />
        </div>
      </div>
    </div>
  );
};

export default PriceRangeSlider;