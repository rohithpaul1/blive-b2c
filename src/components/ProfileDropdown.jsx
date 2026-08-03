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
    }, []);
    
    return (
        <div ref={profileDropdownRef} className={`absolute right-0 overflow-hidden transition-all duration-500 ${showProfileDropdown ? "max-h-[234px] mt-[300px] w-[316px] opacity-100" : "max-h-0 w-[100px] mt-[50px] opacity-0"} z-20 calender-shadow bg-white rounded-[16px] flex flex-col`}>
            <div className="profile-tab p-[24px]">
                <div className="flex items-center gap-x-[16px]">
                    {userData?.profileImage ? (
                        <img 
                            className="w-[32px] h-[32px] aspect-square rounded-full border-[2px] border-white object-cover" 
                            src={userData.profileImage} 
                            alt="Profile" 
                        />
                    ) : (
                        <p className="flex items-center justify-center w-[32px] aspect-square poppins font-medium text-[12px] text-[#222222] rounded-full border-[2px] bg-[#EDEDED] border-[#FFFFFF] overflow-hidden">
                            {userData?.firstName?.charAt(0).toUpperCase()}
                        </p>
                    )}
                    <p className="text-[#FDFDFD] text-[22px] font-bold">{userData?.firstName + " " + userData?.lastName}</p>
                </div>
            </div>
            <div className="py-[16px] flex flex-col bg-white">
                <button onClick={() => navigate("/profile")} className="px-[32px] text-left cursor-pointer hover:bg-gray-200 min-h-[60px] text-[#222222] font-medium">Account & Settings</button>
                <button onClick={handleLogout} className="px-[32px] text-left cursor-pointer hover:bg-gray-200 min-h-[60px] text-[#BE4907] font-bold">Sign Out</button>
            </div>
        </div>
    )
}

export default ProfileDropdown;