const WhyBlive = () => {
  const reasons = [
    {
      icon: "/images/stars.svg",
      title: "Diverse EV selection",
      text: "From budget-friendly city commuters to premium long-range rides, pick an EV that fits your route, style, and budget.",
    },
    {
      icon: "/images/coins-hand.svg",
      title: "Transparent, affordable pricing",
      text: "See the rental, deposit, and included kilometres before checkout. No surprises when you collect the vehicle.",
    },
    {
      icon: "/images/check-verified.svg",
      title: "Easy, fast booking",
      text: "Choose your EV in minutes, complete verification online, and collect it from the most convenient BLive hub.",
    },
  ];

  return (
    <section className="flex flex-col items-center justify-center bg-[#0f0f0f] px-[clamp(20px,8vw,120px)] py-[88px] text-white">
      <h2 className="text-center text-[36px] font-bold md:text-[44px]">Why BLive?</h2>
      <p className="mt-[14px] max-w-[720px] text-center text-[15px] text-[#d2d2d2]">
        Your trusted partner for effortless and eco-friendly EV rentals.
      </p>
      <div className="mt-[64px] grid w-full max-w-[1180px] grid-cols-1 gap-[48px] md:grid-cols-3 md:gap-[32px]">
        {reasons.map((reason) => (
          <article key={reason.title} className="flex flex-col items-center text-center">
            <div className="flex size-[48px] items-center justify-center rounded-full bg-white ring-4 ring-white/10">
              <img className="size-[24px]" src={reason.icon} alt="" />
            </div>
            <h3 className="mt-[20px] text-[18px] font-bold">{reason.title}</h3>
            <p className="mt-[8px] max-w-[340px] text-[13px] leading-[1.65] text-[#c9c9c9]">
              {reason.text}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default WhyBlive;
