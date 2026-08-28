import { useEffect, useState } from "react";

const PriceRangeSlider = ({ minVal, maxVal, setMinVal, setMaxVal }) => {
  const minPrice = 100;
  const maxPrice = 2000;

  // Separate, freely-typable text state for the two price boxes below —
  // binding them straight to the numeric minVal/maxVal (as the old readOnly
  // version did) means there's nothing to type into: a controlled numeric
  // value can't represent "the field the user just cleared to type a fresh
  // number into". This mirrors it live while typing (so the slider above
  // moves as you type, same as dragging it) but only enforces the
  // min/max-need-50-apart-and-non-negative rule (same one the slider drag
  // handlers below already enforce) once the user leaves the field, so
  // clamping doesn't fight them mid-keystroke.
  const [minText, setMinText] = useState(String(minVal));
  const [maxText, setMaxText] = useState(String(maxVal));

  useEffect(() => setMinText(String(minVal)), [minVal]);
  useEffect(() => setMaxText(String(maxVal)), [maxVal]);

  const handleMinChange = (e) => {
    const value = Math.min(Number(e.target.value), maxVal - 50);
    setMinVal(value);
  };

  const handleMaxChange = (e) => {
    const value = Math.max(Number(e.target.value), minVal + 50);
    setMaxVal(value);
  };

  const handleMinInputChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    setMinText(digits);
    if (digits !== "") setMinVal(Number(digits));
  };

  const handleMaxInputChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    setMaxText(digits);
    if (digits !== "") setMaxVal(Number(digits));
  };

  const handleMinInputBlur = () => {
    if (minText === "") {
      setMinText(String(minVal));
      return;
    }
    const clamped = Math.max(0, Math.min(Number(minText), maxVal - 50));
    setMinVal(clamped);
    setMinText(String(clamped));
  };

  const handleMaxInputBlur = () => {
    if (maxText === "") {
      setMaxText(String(maxVal));
      return;
    }
    const clamped = Math.max(Number(maxText), minVal + 50);
    setMaxVal(clamped);
    setMaxText(String(clamped));
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

      {/* Price Display — editable: typing a number here updates the slider
          above just like dragging it does, not just the other way round. */}
      <div className="flex justify-center mt-[32px] gap-x-[32px]">
        <div className="flex-1 flex flex-col gap-y-[4px]">
          <p className="font-medium text-[#717171] text-[12px]">
            Minimum Price
          </p>
          <div className="flex items-center gap-x-[4px] bg-[#F7F7F7] border text-[#717171] text-[14px] border-[#EDEDED] px-[16px] py-[13px] rounded-[8px] focus-within:border-[#484848]">
            <span>₹</span>
            <input
              type="text"
              inputMode="numeric"
              value={minText}
              onChange={handleMinInputChange}
              onBlur={handleMinInputBlur}
              className="w-full bg-transparent outline-none"
            />
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-y-[4px]">
          <p className="font-medium text-[#717171] text-[12px]">
            Maximum Price
          </p>
          <div className="flex items-center gap-x-[4px] bg-[#F7F7F7] border text-[#717171] text-[14px] border-[#EDEDED] px-[16px] py-[13px] rounded-[8px] focus-within:border-[#484848]">
            <span>₹</span>
            <input
              type="text"
              inputMode="numeric"
              value={maxText}
              onChange={handleMaxInputChange}
              onBlur={handleMaxInputBlur}
              className="w-full bg-transparent outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceRangeSlider;
