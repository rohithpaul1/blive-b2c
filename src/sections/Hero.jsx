import HeroKPICard from "../components/HeroKPICard";
import SearchBar from "../components/SearchBar";

const Hero = () => {
  return (
    <div id="hero" className="relative h-[46dvh] min-h-[360px] w-full md:h-[100dvh] md:min-h-[560px]">
      <div className="relative h-full w-full md:h-[90dvh]">
        <div className="absolute w-full h-full hero-gradient z-20" />
        {/* The video has its headline baked into the top of the frame, which gets cropped
            at phone width. On phones we crop that band off and set the same line as real text. */}
        <div className="absolute inset-0 overflow-hidden md:static md:h-full">
          <video
            className="absolute bottom-0 left-0 h-[150%] w-full object-cover object-bottom md:static md:h-full md:object-top"
            src="https://ezy-prod.s3.ap-south-1.amazonaws.com/Blive-B2C.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
        </div>
        <h1 className="absolute inset-x-[20px] top-[92px] z-30 text-balance text-[20px] font-bold leading-[1.25] text-white [text-shadow:0_1px_12px_rgba(0,0,0,0.35)] md:sr-only">
          From cafés to co-working spots, discover Bengaluru at your own pace with Ezy Scooters
        </h1>
        {/* <HeroKPICard /> */}
        <SearchBar />
      </div>
    </div>
  );
};

export default Hero;
