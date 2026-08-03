import { useState, useEffect } from "react";

const HowItWorks = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Array of scooter images - using the same image 3 times as requested
  const scooterImages = [
    "/images/Scooter.png",
    "/images/Scooter.png",
    "/images/Scooter.png",
  ];

  // Auto-rotate carousel every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === scooterImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [scooterImages.length]);

  return (
    <div className="flex flex-col items-center w-[90%] mt-[120px] mx-auto">
      <div className="max-w-[720px]">
        <p className="font-bold text-[36px] text-center text-[#0F0F0F]">
          The EZY Way to Ride
        </p>
        <p className="mt-[20px] font-medium text-center text-[18px] text-[#717171]">
          From booking to riding, we make going electric simple.
        </p>
      </div>
      <div className="mt-[75px] flex items-center">
        <div className="flex z-10 flex-col gap-y-[16px]">
          <div className="flex bg-white max-w-[592px] p-[32px] gap-x-[20px] border rounded-[24px] border-[#0000001A]">
            <div className="flex min-w-[54px] items-center justify-center rounded-[16px] bg-[#F5F5F5]">
              <img
                className="w-[24px] h-[24px]"
                src="/images/search-lg.png"
                alt="Search Icon"
              />
            </div>
            <div className="flex-1 flex flex-col gap-y-[8px]">
              <p className="font-black font-satoshi text-[24px]">
                Pick your EV
              </p>
              <p className="text-[18px] text-[#717171]">
                From daily commutes to weekend rides select the perfect EV plan
                at the right price.
              </p>
            </div>
          </div>
          <div className="flex bg-white max-w-[592px] p-[32px] gap-x-[20px] border rounded-[24px] border-[#0000001A]">
            <div className="flex min-w-[54px] items-center justify-center rounded-[16px] bg-[#F5F5F5]">
              <img
                className="w-[24px] h-[24px]"
                src="/images/calendar-check-02.png"
                alt="Calendar Check Icon"
              />
            </div>
            <div className="flex-1 flex flex-col gap-y-[8px]">
              <p className="font-black text-[24px]">Book online</p>
              <p className="text-[18px] text-[#717171]">
                Reserve online or at the hub easy, fast, and ready when you are
              </p>
            </div>
          </div>
          <div className="flex bg-white max-w-[592px] p-[32px] gap-x-[20px] border rounded-[24px] border-[#0000001A]">
            <div className="flex min-w-[54px] items-center justify-center rounded-[16px] bg-[#F5F5F5]">
              <img
                className="w-[24px] h-[24px]"
                src="/images/note-pad.svg"
                alt="Face Happy Icon"
              />
            </div>
            <div className="flex-1 flex flex-col gap-y-[8px]">
              <p className="font-black text-[24px] ">Submit KYC</p>
              <p className="text-[18px] text-[#717171]">
                Get started with a quick verification just your license and ID
                proof, and you’re ready to ride.
              </p>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="relative right-[60px] w-[740px] h-[638px] rounded-[24px] bg-[#F5F5F5] overflow-hidden">
            {/* Carousel Container */}
            <div className="relative w-full h-full">
              {scooterImages.map((image, index) => (
                <img
                  key={index}
                  className={`absolute top-1/2 -translate-y-1/2 w-full h-auto object-contain transition-opacity duration-500 ${
                    index === currentImageIndex ? "opacity-100" : "opacity-0"
                  }`}
                  src={image}
                  alt={`Scooter Image ${index + 1}`}
                />
              ))}
            </div>

            {/* Dots Indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {scooterImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentImageIndex
                      ? "bg-white shadow-lg"
                      : "bg-white/50 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
