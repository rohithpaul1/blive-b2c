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
        className={`w-full px-[40px] flex flex-col pt-[12px] items-center justify-center absolute ${
          expanded ? "bg-white header-shadow" : "h-[72px]"
        } z-30`}
      >
        <div className="flex w-full justify-between items-start self-start">
          <img
            onClick={() => navigate("/home")}
            className="h-[50px] cursor-pointer"
            src="/images/BliveLogo.svg"
            alt="BLive"
          />
          {token ? (
            <div className="flex items-center gap-x-[24px]">
              <div className="flex items-center gap-x-[16px]">
                <span
                  onClick={() => navigate("/help-center")}
                  className={`cursor-pointer flex items-center gap-x-[8px] p-[12px] duration-500 transition-all ${
                    location.pathname === "/help-center"
                      ? "bg-[#EDEDED] rounded-[24px]"
                      : ""
                  }`}
                >
                  <img
                    className="w-[20px] h-[20px]"
                    src={`/images/Help${expanded ? "-Black" : ""}.png`}
                    alt="Help Icon"
                  />
                  <p
                    className={`text-[16px] ${
                      expanded ? "text-black" : "text-white"
                    } font-bold`}
                  >
                    Help
                  </p>
                </span>
                <span
                  onClick={() => navigate("/my-bookings")}
                  className={`cursor-pointer flex items-center gap-x-[8px] p-[12px] duration-500 transition-all ${
                    location.pathname === "/my-bookings"
                      ? "bg-[#EDEDED] rounded-[24px]"
                      : ""
                  }`}
                >
                  <img
                    className="w-[20px] h-[20px]"
                    src={`/images/Trip${expanded ? "-Black" : ""}.png`}
                    alt="Help Icon"
                  />
                  <p
                    className={`text-[16px] ${
                      expanded ? "text-black" : "text-white"
                    } font-bold`}
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
                  className={`cursor-pointer flex items-center gap-x-[8px] p-[12px duration-500 transition-all] ${
                    location.pathname === "/notification"
                      ? "bg-[#EDEDED] rounded-[24px]"
                      : ""
                  }`}
                >
                  <div className="relative">
                    <img
                      className="w-[20px] h-[20px]"
                      src={`/images/Notifications${
                        expanded ? "-Black" : ""
                      }.png`}
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
                    className={`text-[16px] ${
                      expanded ? "text-black" : "text-white"
                    } font-bold`}
                  >
                    Notifications
                  </p>
                </span>
              </div>
              <div
                id="profile-button"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="relative cursor-pointer flex items-center w-[105px] gap-x-[16px] border-[#CBCBCB] rounded-[30px] border-[1px] px-[16px] py-[8px] h-[50px]"
              >
                <img
                  src={`/images/Menu${expanded ? "-Black" : ""}.png`}
                  alt="Menu"
                />
                <div className="rounded-[50%] min-w-[32px] min-h-[32px] overflow-hidden border-[2px] border-white">
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
              className="py-[8px] px-[32px] flex items-center h-[40px] cursor-pointer justify-center rounded-full bg-[#000000] font-bold text-white text-[14px]"
            >
              Login or Signup
            </button>
          )}
        </div>
        {onSearchPage ? (
          <SearchBar onSearchPage={true} onSearchTrigger={onSearchTrigger} />
        ) : (
          expanded && (
            <div className="h-[52px] mt-[10px] flex items-center w-full border-b border-[#EDEDED]">
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
