import SearchBar from "../components/SearchBar";
import ProfileDropdown from "../components/ProfileDropdown";
import { useContext, useState } from "react";
import { UserContext } from "../contexts/UserContext";
import { LoginPageContext } from "../contexts/LoginPageContext";
import Login from "../components/Login";
import { useNavigate, useLocation } from "react-router-dom";

const Navbar = ({ onSearchPage, expanded, onSearchTrigger }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const {
    token,
    userData,
    unseenNotificationsCount,
    markAllNotificationsAsSeen,
  } = useContext(UserContext);
  const { showLoginPage, setShowLoginPage } = useContext(LoginPageContext);

  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      {showLoginPage && <Login />}
      <nav
        className={`fixed top-0 z-30 flex w-full flex-col items-center justify-center px-[clamp(20px,4vw,64px)] py-[10px] ${
          expanded ? "bg-white header-shadow" : "h-[72px] bg-white/95"
        }`}
      >
        <div className="flex min-h-[48px] w-full items-center justify-between self-start">
          <img
            onClick={() => navigate("/home")}
            className="h-[34px] w-auto cursor-pointer"
            src="/images/BliveLogo.svg"
            alt="BLive"
          />
          {token ? (
            <div className="flex items-center gap-x-[12px] md:gap-x-[20px]">
              <div className="flex items-center gap-x-[2px] md:gap-x-[8px]">
                <span
                  onClick={() => navigate("/help-center")}
                  className={`cursor-pointer flex items-center gap-x-[7px] rounded-full p-[9px] duration-300 transition-all ${
                    location.pathname === "/help-center"
                      ? "bg-[#f2f2f2]"
                      : "hover:bg-[#f7f7f7]"
                  }`}
                >
                  <img
                    className="w-[20px] h-[20px]"
                    src="/images/Help-Black.png"
                    alt="Help Icon"
                  />
                  <p
                    className="hidden text-[13px] font-bold text-black md:block"
                  >
                    Help
                  </p>
                </span>
                <span
                  onClick={() => navigate("/my-bookings")}
                  className={`cursor-pointer flex items-center gap-x-[7px] rounded-full p-[9px] duration-300 transition-all ${
                    location.pathname === "/my-bookings"
                      ? "bg-[#f2f2f2]"
                      : "hover:bg-[#f7f7f7]"
                  }`}
                >
                  <img
                    className="w-[20px] h-[20px]"
                    src="/images/Trip-Black.png"
                    alt="Help Icon"
                  />
                  <p
                    className="hidden text-[13px] font-bold text-black md:block"
                  >
                    My Bookings
                  </p>
                </span>
                <span
                  onClick={() => {
                    console.log(
                      "🔍 Notifications button clicked, unseen count:",
                      unseenNotificationsCount
                    );
                    // Mark all notifications as seen when clicked
                    if (unseenNotificationsCount > 0) {
                      console.log("🔍 Calling markAllNotificationsAsSeen...");
                      markAllNotificationsAsSeen();
                    } else {
                      console.log(
                        "🔍 No unseen notifications, skipping mark as seen"
                      );
                    }
                    navigate("/notifications");
                  }}
                  className={`cursor-pointer flex items-center gap-x-[7px] rounded-full p-[9px] duration-300 transition-all ${
                    location.pathname === "/notification"
                      ? "bg-[#f2f2f2]"
                      : "hover:bg-[#f7f7f7]"
                  }`}
                >
                  <div className="relative">
                    <img
                      className="w-[20px] h-[20px]"
                      src="/images/Notifications-Black.png"
                      alt="Help Icon"
                    />
                    {unseenNotificationsCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unseenNotificationsCount > 99
                          ? "99+"
                          : unseenNotificationsCount}
                      </span>
                    )}
                  </div>
                  <p
                    className="hidden text-[13px] font-bold text-black md:block"
                  >
                    Notifications
                  </p>
                </span>
              </div>
              <div
                id="profile-button"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="relative flex h-[42px] w-[84px] cursor-pointer items-center gap-x-[10px] rounded-full border border-[#d8d8d8] bg-white px-[10px] py-[5px]"
              >
                <img
                  src="/images/Menu-Black.png"
                  alt="Menu"
                />
                <div className="min-h-[30px] min-w-[30px] overflow-hidden rounded-full border-2 border-white">
                  <img
                    className="w-full h-full object-cover"
                    src={userData?.profileUrl || "/images/placeholder.jpeg"}
                    alt="User Image"
                  />
                </div>
                <ProfileDropdown
                  userData={userData}
                  setShowProfileDropdown={setShowProfileDropdown}
                  showProfileDropdown={showProfileDropdown}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginPage(true)}
              className="flex h-[40px] cursor-pointer items-center justify-center rounded-full bg-[#351a75] px-[24px] py-[8px] text-[13px] font-bold text-white transition-colors hover:bg-[#2c155f]"
            >
              Login or Signup
            </button>
          )}
        </div>
        {onSearchPage ? (
          <SearchBar onSearchPage={true} onSearchTrigger={onSearchTrigger} />
        ) : (
          expanded && (
            <div className="mt-[6px] flex h-[46px] w-full items-center border-t border-[#ededed]">
              <button
                onClick={() => navigate(-1)}
                className="cursor-pointer flex items-center gap-x-[10px]"
              >
                <img
                  className="w-[24px] h-[24px]"
                  src="/images/Chevron-Left.png"
                  alt="Left Back Icon"
                />
                <p className="font-medium text-[#222222]">Back</p>
              </button>
            </div>
          )
        )}
      </nav>
    </>
  );
};

export default Navbar;
