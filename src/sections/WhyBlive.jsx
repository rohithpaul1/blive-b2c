const WhyBlive = () => {
  return (
    <div className="py-[100px] px-[80px] flex flex-col items-center justify-center bg-[#0F0F0F]">
      <p className="font-bold text-[48px] text-white">
        Why We’re the #1 Choice for EV Rentals
      </p>
      <p className="font-medium mt-[24px] text-[18px] text-white">
        Reliable, convenient, and designed for every journey. BLive makes EV
        rentals effortless.
      </p>
      <div className="mt-[90px] flex justify-center gap-x-[32px]">
        <div className="flex-1 flex flex-col items-center">
          <div className="w-[48px] overflow-hidden flex items-center justify-center aspect-square outline-[4px] rounded-full bg-white outline-[#ffffffe5] ">
            <img
              className="w-[24px] aspect-square"
              src="/images/leaf.svg"
              alt="Leaf Icon"
            />
          </div>
          <p className="mt-[20px] font-medium text-[20px] text-center text-white">
            Eco-Friendly Travel
          </p>
          <p className="mt-[8px] text-[#D6D6D6] text-center px-[25px]">
            Zero emissions, 100% green.
          </p>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <div className="w-[48px] overflow-hidden flex items-center justify-center aspect-square outline-[4px] rounded-full bg-white outline-[#ffffffe5] ">
            <img
              className="w-[24px] aspect-square"
              src="/images/coins-hand.svg"
              alt="Stars Icon"
            />
          </div>
          <p className="mt-[20px] font-medium text-[20px] text-center text-white">
            Save More
          </p>
          <p className="mt-[8px] text-[#D6D6D6] text-center px-[25px]">
            No fuel costs, no hidden charges.
          </p>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <div className="w-[48px] overflow-hidden flex items-center justify-center aspect-square outline-[4px] rounded-full bg-white outline-[#ffffffe5] ">
            <img
              className="w-[24px] aspect-square"
              src="/images/plans.svg"
              alt="Stars Icon"
            />
          </div>
          <p className="mt-[20px] font-medium text-[20px] text-center text-white">
            Flexible Plans
          </p>
          <p className="mt-[8px] text-[#D6D6D6] text-center px-[25px]">
            From short rides to long rentals - we&apos;ve got you covered.
          </p>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <div className="w-[48px] overflow-hidden flex items-center justify-center aspect-square outline-[4px] rounded-full bg-white outline-[#ffffffe5] ">
            <img
              className="w-[24px] aspect-square"
              src="/images/thumbs-up.svg"
              alt="Thumbs Up Icon"
            />
          </div>
          <p className="mt-[20px] font-medium text-[20px] text-center text-white">
            Hassle-Free
          </p>
          <p className="mt-[8px] text-[#D6D6D6] text-center px-[25px]">
            Insurance, service & roadside support included.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WhyBlive;
