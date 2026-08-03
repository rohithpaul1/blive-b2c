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

    return (
        <div ref={locationRef} className={`absolute ${showLocation ? "h-[392px] py-[16px] mt-[35px]" : "h-0 mt-0"} left-[35px] w-[432px] overflow-hidden transition-all duration-500 rounded-[16px] bg-white calender-shadow`}>
            {/* Get Current Location Option */}
            {!locationPermissionGranted && (
                <button 
                    onClick={() => {
                        getUserLocation();
                        setShowLocation(false);
                    }} 
                    className="w-full hover:bg-blue-50 cursor-pointer flex items-center h-[60px] truncate overflow-hidden px-[32px] gap-x-[10px] border-b border-gray-100"
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
                }} key={location + i} className="w-full hover:bg-gray-200 cursor-pointer flex items-center h-[60px] truncate overflow-hidden px-[32px] gap-x-[10px]">
                    <img className="w-[24px] aspect-square" src="/images/Location.png" alt="Location Icon" />
                    <p className="font-medium text-[#222222]">{location}</p>
                </button>
            ))}
        </div>
    )
}

export default LocationDropdown;