const Tabs = ({ selectedTab, setSelectedTab, tabs }) => {
  return (
    <div className="mt-[32px] grid w-full max-w-[610px] grid-cols-3 gap-[4px] rounded-full bg-white p-[4px] sm:mt-[48px]">
      {tabs.map((tab, i) => (
        <button
          type="button"
          key={"tab-" + tab.name + "-" + i}
          onClick={() => setSelectedTab(i)}
          className={`flex min-h-[46px] min-w-0 cursor-pointer items-center justify-center gap-[6px] rounded-full px-[8px] text-center transition-colors sm:gap-[10px] sm:px-[14px] ${
            selectedTab === i
              ? "bg-[#151226] text-white"
              : "text-[#4f4a53] hover:bg-[#f5f3f6]"
          }`}
          aria-pressed={selectedTab === i}
        >
          <p
            className={`truncate text-[13px] font-medium sm:text-[15px] ${
              selectedTab === i ? "font-bold" : ""
            }`}
          >
            {tab.name}
          </p>
          {tab.discount && (
            <div className="hidden items-center justify-center sm:flex">
              <p className={`rounded-full px-[7px] py-[2px] text-[10px] font-bold ${selectedTab === i ? "bg-white/14 text-white" : "bg-[#f6f1fb] text-[#5b367e]"}`}>
                Save {tab.discount}%
              </p>
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
