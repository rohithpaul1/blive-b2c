const Tabs = ({ selectedTab, setSelectedTab, tabs }) => {
  return (
    <div className="relative flex items-center justify-center mt-[65px] w-[610px] h-[48px] rounded-[30px] py-[3px] px-[6px] gap-[3px] bg-white overflow-hidden">
      <div
        className={`absolute top-[3px] left-[6px] h-[42px] w-[calc(33.333%-6px)] rounded-[32px] menu-gradient transition-transform duration-500`}
        style={{ transform: `translateX(${selectedTab * 100}%)` }}
      />
      {tabs.map((tab, i) => (
        <div
          key={"tab-" + tab.name + "-" + i}
          onClick={() => setSelectedTab(i)}
          className="cursor-pointer flex-1 z-10 flex gap-x-[12px] items-center justify-center"
        >
          <p
            className={`font-medium text-center transition-all duration-500 ${
              selectedTab === i ? "text-white font-bold" : ""
            }`}
          >
            {tab.name}
          </p>
          {tab.discount && (
            <div className="w-[82px] flex justify-center items-center h-[22px]">
              <p className="bg-[#fff5f7] py-[1px] px-[8px] font-bold text-[12px] gap-[4px] border rounded-[4px] border-[#FBB6CE] text-[#702459]">
                Save {tab.discount}%
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Tabs;
