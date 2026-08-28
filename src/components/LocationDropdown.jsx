import { useState, useRef, useEffect } from "react";
import { getHubs } from "../lib/hubs";

// Fallback shown while /catalogue/hubs is loading (or if it fails) so the
// dropdown never looks empty/broken.
const DEFAULT_LOCATIONS = [
    "HSR Layout, Bengaluru",
    "Jayanagar, Bengaluru",
    "Koramangala, Bengaluru",
    "Indiranagar, Bengaluru",
    "Whitefield, Bengaluru",
    "Electronic City, Bengaluru"
];

const LocationDropdown = ({ setSelectedLocation, setShowLocation, showLocation }) => {
    const [locations, setLocations] = useState(DEFAULT_LOCATIONS);
    const locationRef = useRef(null);

    // Real hub names from the B2C backend — just the name, nothing else.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const hubs = await getHubs();
                const names = hubs.map((hub) => hub.name).filter(Boolean);
                if (!cancelled && names.length > 0) setLocations(names);
            } catch (error) {
                console.warn("[LocationDropdown] failed to load hubs, keeping default list:", error);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        function handleClickOutside(event) {
        // IDs to ignore
        const ignoreIds = ["location"];

        // Check if clicked element has any of those IDs or is inside them
        const clickedInsideIgnored = ignoreIds.some((id) =>
            document.getElementById(id)?.contains(event.target)
        );

        if (
            locationRef.current &&
            !locationRef.current.contains(event.target) &&
            !clickedInsideIgnored
        ) {
            setShowLocation(false);
        }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    if (!showLocation) return null;

    return (
        <div ref={locationRef} className="absolute left-0 mt-[16px] max-h-[392px] w-[min(432px,calc(100vw-48px))] overflow-y-auto rounded-[20px] bg-white py-[12px] calender-shadow">
            {/* Location Options */}
            {locations.map((location, i) => (
                <button onClick={() => {
                    setSelectedLocation(location);
                    sessionStorage.setItem('selectedLocation', location);
                    setShowLocation(false);
                }} key={location + i} className="flex min-h-[56px] w-full cursor-pointer items-center gap-x-[10px] overflow-hidden truncate px-[24px] hover:bg-[#f6f5f7]">
                    <img className="w-[24px] aspect-square" src="/images/Location.png" alt="Location Icon" />
                    <p className="font-medium text-[#222222]">{location}</p>
                </button>
            ))}
        </div>
    )
}

export default LocationDropdown;
