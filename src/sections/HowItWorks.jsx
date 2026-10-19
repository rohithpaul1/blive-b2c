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
    <div className="mx-auto mt-[64px] flex w-full flex-col items-center px-[20px] md:mt-[120px] md:w-[90%] md:px-0">
      <div className="max-w-[720px]">
        <h2 className="text-center text-[22px] font-bold leading-[1.2] text-[#0F0F0F] md:text-[36px]">
          The EZY Way to Ride
        </h2>
        <p className="mt-[8px] text-center text-[14px] font-medium text-[#6a6a6a] md:mt-[20px] md:text-[18px]">
          From booking to riding, we make going electric simple.
        </p>
      </div>
      <div className="mt-[32px] flex w-full flex-col-reverse items-center gap-[24px] md:mt-[75px] lg:w-auto lg:flex-row lg:gap-0">
        <div className="z-10 flex w-full flex-col gap-y-[12px] lg:w-auto lg:gap-y-[16px]">
          <div className="flex gap-x-[16px] rounded-[20px] border border-[#0000001A] bg-white p-[20px] lg:max-w-[592px] lg:gap-x-[20px] lg:rounded-[24px] lg:p-[32px]">
            <div className="flex h-[48px] min-w-[48px] items-center justify-center self-start rounded-[14px] bg-[#F5F5F5] lg:h-auto lg:min-w-[54px] lg:self-stretch lg:rounded-[16px]">
              <img
                className="w-[24px] h-[24px]"
                src="/images/search-lg.png"
                alt="Search Icon"
              />
            </div>
            <div className="flex-1 flex flex-col gap-y-[8px]">
              <p className="text-[16px] font-bold text-[#0F0F0F] lg:text-[24px] lg:font-black">
                Pick your EV
              </p>
              <p className="text-[14px] leading-[1.45] text-[#6a6a6a] lg:text-[18px]">
                From daily commutes to weekend rides select the perfect EV plan
                at the right price.
              </p>
            </div>
          </div>
          <div className="flex gap-x-[16px] rounded-[20px] border border-[#0000001A] bg-white p-[20px] lg:max-w-[592px] lg:gap-x-[20px] lg:rounded-[24px] lg:p-[32px]">
            <div className="flex h-[48px] min-w-[48px] items-center justify-center self-start rounded-[14px] bg-[#F5F5F5] lg:h-auto lg:min-w-[54px] lg:self-stretch lg:rounded-[16px]">
              <img
                className="w-[24px] h-[24px]"
                src="/images/calendar-check-02.png"
                alt="Calendar Check Icon"
              />
            </div>
            <div className="flex-1 flex flex-col gap-y-[8px]">
              <p className="text-[16px] font-bold text-[#0F0F0F] lg:text-[24px] lg:font-black">Book online</p>
              <p className="text-[14px] leading-[1.45] text-[#6a6a6a] lg:text-[18px]">
                Reserve online or at the hub easy, fast, and ready when you are
              </p>
            </div>
          </div>
          <div className="flex gap-x-[16px] rounded-[20px] border border-[#0000001A] bg-white p-[20px] lg:max-w-[592px] lg:gap-x-[20px] lg:rounded-[24px] lg:p-[32px]">
            <div className="flex h-[48px] min-w-[48px] items-center justify-center self-start rounded-[14px] bg-[#F5F5F5] lg:h-auto lg:min-w-[54px] lg:self-stretch lg:rounded-[16px]">
              <img
                className="w-[24px] h-[24px]"
                src="/images/note-pad.svg"
                alt="Face Happy Icon"
              />
            </div>
            <div className="flex-1 flex flex-col gap-y-[8px]">
              <p className="text-[16px] font-bold text-[#0F0F0F] lg:text-[24px] lg:font-black">Submit KYC</p>
              <p className="text-[14px] leading-[1.45] text-[#6a6a6a] lg:text-[18px]">
                Get started with a quick verification just your license and ID
                proof, and you’re ready to ride.
              </p>
            </div>
          </div>
        </div>
        <div className="relative w-full lg:w-auto">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[24px] bg-[#F5F5F5] lg:right-[60px] lg:aspect-auto lg:h-[638px] lg:w-[740px]">
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
                  aria-label={`Show image ${index + 1}`}
                  className={`h-3 w-3 rounded-full ring-[14px] ring-transparent transition-all duration-200 ${
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
