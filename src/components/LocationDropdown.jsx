import { useState, useRef, useEffect } from "react";

const LocationDropdown = ({ setSelectedLocation, setShowLocation, showLocation, locationPermissionGranted, getUserLocation }) => {
    const [locations] = useState([
        "HSR Layout, Bengaluru",
        "Jayanagar, Bengaluru",
        "Koramangala, Bengaluru",
        "Indiranagar, Bengaluru",
        "Whitefield, Bengaluru",
        "Electronic City, Bengaluru"
    ]);
    const locationRef = useRef(null);

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
            {/* Get Current Location Option */}
            {!locationPermissionGranted && (
                <button 
                    onClick={() => {
                        getUserLocation();
                        setShowLocation(false);
                    }} 
                    className="flex min-h-[56px] w-full cursor-pointer items-center gap-x-[10px] overflow-hidden truncate border-b border-gray-100 px-[24px] hover:bg-[#f7f4fb]"
                >
                    <img className="w-[24px] aspect-square" src="/images/Location.png" alt="Location Icon" />
                    <div className="flex flex-col items-start">
                        <p className="font-medium text-[#222222]">Get Current Location</p>
                        <p className="text-[12px] text-[#666]">Allow location access</p>
                    </div>
                </button>
            )}
            
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
