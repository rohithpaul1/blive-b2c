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
    <div className="my-[100px] flex flex-col px-[10%] transition-all duration-500">
      <div className="flex items-start justify-between">
        <p className="font-bold text-[40px] text-[#0F0F0F]">
          Stories That Move Us
        </p>
        <div className="flex items-center gap-x-[16px] mt-2">
          <button
            onClick={goPrev}
            className="flex items-center justify-center bg-white border-[2px] cursor-pointer w-[64px] aspect-square rounded-full border-[#C0C0C0]"
          >
            <img
              className="w-[24px] h-[24px]"
              src="/images/arrow-left.png"
              alt="Arrow Icon"
            />
          </button>
          <button
            onClick={goNext}
            className="flex items-center justify-center bg-[#0F0F0F] w-[64px] cursor-pointer aspect-square rounded-full"
          >
            <img
              className="w-[24px] h-[24px]"
              src="/images/arrow-right.png"
              alt="Arrow Icon"
            />
          </button>
        </div>
      </div>

      <p className="mt-[60px] font-medium opacity-[80%] text-[32px] text-[#0F0F0F] mr-[10%] transition-all duration-500">
        “{t.text}”
      </p>

      <div className="mt-[64px] flex items-center gap-x-[24px]">
        <div className="w-[80px] aspect-square rounded-full overflow-hidden">
          <img
            className="h-full w-full object-cover"
            src={t.photo}
            alt={`${t.name} Photo`}
          />
        </div>
        <div className="flex flex-col gap-y-[4px]">
          <p className="font-bold text-[24px] text-[#0F0F0F]">{t.name}</p>
          <p className="text-[20px] text-[#737373]">From {t.location}</p>
        </div>
      </div>
    </div>
  );
};

export default Customers;
