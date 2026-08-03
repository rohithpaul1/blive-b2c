import HeroKPICard from "../components/HeroKPICard";
import SearchBar from "../components/SearchBar";

const Hero = () => {
  return (
    <div id="hero" className="relative h-[78dvh] min-h-[560px] w-full md:h-[100dvh]">
      <div className="relative h-full w-full md:h-[90dvh]">
        <div className="absolute w-full h-full hero-gradient z-20" />
        <video
          className="h-full w-full object-cover object-center md:object-top"
          src="https://ezy-prod.s3.ap-south-1.amazonaws.com/Blive-B2C.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        {/* <HeroKPICard /> */}
        <SearchBar />
      </div>
    </div>
  );
};

export default Hero;
