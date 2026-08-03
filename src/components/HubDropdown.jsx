import { useState, useRef, useEffect } from "react";

const HubDropdown = ({ 
    hubs, 
    selectedHubId, 
    setSelectedHubId, 
    isLoading, 
    placeholder = "Select a hub" 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const selectedHub = hubs.find(hub => hub.id === selectedHubId);


    const handleHubSelect = (hubId) => {
        setSelectedHubId(hubId);
        setIsOpen(false);
    };

    if (isLoading) {
        return (
            <div className="rounded-[8px] w-full border border-[#EDEDED] p-[16px] bg-[#F7F7F7] text-[14px] text-[#222222]">
                Loading hubs...
            </div>
        );
    }

    return (
        <div ref={dropdownRef} className="relative w-full">
            {/* Dropdown Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="rounded-[8px] w-full border border-[#EDEDED] outline-none p-[16px] pr-[40px] bg-[#F7F7F7] text-[14px] text-[#222222] text-left flex items-center justify-between"
            >
                <span>
                    {selectedHub ? (
                        <>
                            {selectedHub.hubName || selectedHub.name || `Hub ${selectedHub.id}`}
                            {selectedHub.contactNo && ` (Contact +91 ${selectedHub.contactNo})`}
                            {selectedHub.availableCount !== undefined && ` (${selectedHub.availableCount} Available)`}
                        </>
                    ) : (
                        placeholder
                    )}
                </span>
                <img
                    src="/images/Chevron-Down.png"
                    alt="Chevron"
                    className={`w-[20px] h-[20px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-[4px] bg-white border border-[#EDEDED] rounded-[8px] shadow-lg z-50 max-h-[300px] overflow-y-auto">
                    {hubs.length === 0 ? (
                        <div className="p-[16px] text-[14px] text-[#666666] text-center">
                            No hubs available
                        </div>
                    ) : (
                        hubs.map((hub, index) => (
                            <button
                                key={hub.id || index}
                                onClick={() => handleHubSelect(hub.id)}
                                className={`w-full text-left p-[16px] hover:bg-[#F7F7F7] transition-colors ${
                                    selectedHubId === hub.id ? 'bg-[#E3F2FD] text-[#1B29A9]' : 'text-[#222222]'
                                } ${index !== hubs.length - 1 ? 'border-b border-[#EDEDED]' : ''}`}
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium text-[14px]">
                                        {hub.hubName || hub.name || `Hub ${hub.id}`}
                                    </span>
                                    <div className="flex items-center gap-x-[8px] mt-[4px]">
                                        {hub.contactNo && (
                                            <span className="text-[12px] text-[#666666]">
                                                (Contact +91 {hub.contactNo})
                                            </span>
                                        )}
                                        {hub.availableCount !== undefined && (
                                            <span className="text-[12px] text-[#666666]">
                                                ({hub.availableCount} Available)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default HubDropdown;
