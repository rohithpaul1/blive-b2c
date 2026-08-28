import HeroKPICard from "../components/HeroKPICard";
import SearchBar from "../components/SearchBar";
import { useTenantConfig } from "../contexts/TenantConfigContext";

const Hero = () => {
  const { branding } = useTenantConfig();

  return (
    <div id="hero" className="relative h-[78dvh] min-h-[560px] w-full md:h-[100dvh]">
      <div className="relative h-full w-full md:h-[90dvh]">
        <div className="absolute w-full h-full hero-gradient z-20" />
        <video
          // Forces a remount when branding resolves after first paint —
          // some browsers (Safari included) don't reload a <video> just
          // because its src attribute changed in place.
          key={branding.heroVideoUrl}
          className="h-full w-full object-cover object-center md:object-top"
          src={branding.heroVideoUrl}
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
