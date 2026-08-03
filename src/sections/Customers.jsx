import { useState, useEffect } from "react";

const testimonials = [
  {
    name: "Harija M.",
    location: "Whitefield, Bangalore",
    photo: "/images/customer1.png",
    text: `I needed an electric scooter for daily office trips. Found BLive through their instagram, rented their Ather 450X. Booking was straightforward. Delivery guy Suresh explained everything properly and answered my questions. Vehicle was also delivered in a very clean condition. When I had a charging issue after 2 weeks, the support team resolved this quickly. `,
  },
  {
    name: "Rajesh K.",
    location: "Koramangala, Bangalore",
    photo: "/images/customer2.png",
    text: `Rented the TVS iQube for weekend use. The overall  booking process was pretty easy. Delivery partner Ramesh delivered on time and showed me the features. Scooter runs well, no issues so far. Support responds fast when needed. Fair pricing too.`,
  },
  {
    name: "Priya S.",
    location: "Electronic City, Bangalore",
    photo: "/images/customer3.png",
    text: `First time with electric vehicle. Got the Bounce Infinity delivered next day. Gowrav from customer service called to check if everything was okay after first week. Vehicle performs as expected. Good support team. Saves money on petrol.`,
  },
];

const Customers = () => {
  const [index, setIndex] = useState(0);

  // auto rotate every 8s
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const goPrev = () =>
    setIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  const goNext = () => setIndex((prev) => (prev + 1) % testimonials.length);

  const t = testimonials[index];

  return (
    <section className="flex flex-col px-[clamp(20px,8.5vw,122px)] py-[88px] transition-all duration-500">
      <div className="flex items-start justify-between">
        <h2 className="text-[32px] font-bold text-[#0F0F0F] md:text-[40px]">
          What our customers say
        </h2>
        <div className="flex items-center gap-x-[16px] mt-2">
          <button
            onClick={goPrev}
            className="flex size-[48px] cursor-pointer items-center justify-center rounded-full border border-[#cfcfcf] bg-white transition-colors hover:bg-[#f7f7f7] md:size-[56px]"
          >
            <img
              className="size-[20px]"
              src="/images/arrow-left.png"
              alt="Arrow Icon"
            />
          </button>
          <button
            onClick={goNext}
            className="flex size-[48px] cursor-pointer items-center justify-center rounded-full bg-[#0F0F0F] transition-colors hover:bg-[#351a75] md:size-[56px]"
          >
            <img
              className="size-[20px]"
              src="/images/arrow-right.png"
              alt="Arrow Icon"
            />
          </button>
        </div>
      </div>

      <blockquote className="mt-[48px] max-w-[1120px] text-[20px] font-medium leading-[1.7] text-[#313131] transition-all duration-500 md:text-[26px]">
        “{t.text}”
      </blockquote>

      <div className="mt-[44px] flex items-center gap-x-[18px]">
        <div className="size-[64px] overflow-hidden rounded-full">
          <img
            className="h-full w-full object-cover"
            src={t.photo}
            alt={`${t.name} Photo`}
          />
        </div>
        <div className="flex flex-col gap-y-[4px]">
          <p className="text-[18px] font-bold text-[#0F0F0F]">{t.name}</p>
          <p className="text-[14px] text-[#737373]">From {t.location}</p>
        </div>
      </div>
    </section>
  );
};

export default Customers;
