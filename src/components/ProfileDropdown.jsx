import { useRef, useEffect, useContext } from "react";
import { UserContext } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";

const ProfileDropdown = ({ userData, showProfileDropdown, setShowProfileDropdown }) => {
    const profileDropdownRef = useRef(null);

    const { logout } = useContext(UserContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout(); // Clear all storage and state
        navigate('/home'); // Redirect to home page
        setShowProfileDropdown(false); // Close dropdown
    };

    useEffect(() => {
        if (!showProfileDropdown) return undefined;
        function handleClickOutside(event) {
        // IDs to ignore
        const ignoreIds = ["profile-button"];

        // Check if clicked element has any of those IDs or is inside them
        const clickedInsideIgnored = ignoreIds.some((id) =>
            document.getElementById(id)?.contains(event.target)
        );

        if (
            profileDropdownRef.current &&
            !profileDropdownRef.current.contains(event.target) &&
            !clickedInsideIgnored
        ) {
            setShowProfileDropdown(false);
        }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [setShowProfileDropdown, showProfileDropdown]);

    if (!showProfileDropdown) return null;
    
    return (
        <div ref={profileDropdownRef} className="absolute right-0 top-full z-20 mt-[8px] flex w-[min(316px,calc(100vw-32px))] flex-col overflow-hidden rounded-[16px] bg-white opacity-100 calender-shadow">
            <div className="profile-tab p-[20px]">
                <div className="flex items-center gap-x-[16px]">
                    {userData?.profileImage ? (
                        <img 
                            className="w-[32px] h-[32px] aspect-square rounded-full border-[2px] border-white object-cover" 
                            src={userData.profileImage} 
                            alt="Profile" 
                        />
                    ) : (
                        <p className="flex items-center justify-center w-[32px] aspect-square font-medium text-[12px] text-[#222222] rounded-full border-[2px] bg-[#EDEDED] border-[#FFFFFF] overflow-hidden">
                            {userData?.firstName?.charAt(0).toUpperCase()}
                        </p>
                    )}
                    <p className="truncate text-[#FDFDFD] text-[18px] font-bold">{userData?.firstName + " " + userData?.lastName}</p>
                </div>
            </div>
            <div className="py-[8px] flex flex-col bg-white">
                {[
                    ["My Bookings", "/my-bookings"],
                    ["Wallet", "/wallet"],
                    ["Notifications", "/notifications"],
                    ["Help Center", "/help-center"],
                    ["Account & Settings", "/profile"],
                ].map(([label, to]) => (
                    <button key={to} onClick={() => navigate(to)} className="px-[24px] text-left cursor-pointer hover:bg-gray-100 min-h-[48px] text-[15px] text-[#222222] font-medium">{label}</button>
                ))}
                <button onClick={handleLogout} className="mt-[4px] border-t border-[#ebebeb] px-[24px] text-left cursor-pointer hover:bg-gray-100 min-h-[48px] text-[15px] text-[#BE4907] font-bold">Sign Out</button>
            </div>
        </div>
    )
}

export default ProfileDropdown;
