import SearchBar from "../components/SearchBar";
import ProfileDropdown from "../components/ProfileDropdown";
import { useContext, useState } from "react";
import { UserContext } from "../contexts/UserContext";
import { LoginPageContext } from "../contexts/LoginPageContext";
import Login from "../components/Login";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "convex/react";
import { WalletCards } from "lucide-react";

const compactRupees = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

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
  const isBusinessWebsite = location.pathname.startsWith("/business");
  const wallet = useQuery(
    "b2c/wallet:summary",
    token && !isBusinessWebsite ? {} : "skip"
  );

  return (
    <>
      {showLoginPage && !isBusinessWebsite && <Login />}
      <nav
        className={`fixed top-0 z-30 flex w-full flex-col items-center justify-center px-[clamp(20px,4vw,64px)] py-[10px] ${
          expanded ? "bg-white header-shadow" : "h-[72px] bg-white/95"
        }`}
      >
        <div className="flex min-h-[48px] w-full items-center justify-between self-start">
          <img
            onClick={() => navigate(isBusinessWebsite ? "/business" : "/home")}
            className="h-[34px] w-auto cursor-pointer"
            src="/images/BliveLogo.svg"
            alt="BLive"
          />
          {isBusinessWebsite ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/home")}
                className="flex h-10 items-center justify-center rounded-full px-3 text-[12px] font-bold text-[#3f3a42] transition-colors hover:bg-[#f7f7f7] sm:px-4 sm:text-[13px]"
              >
                <span className="sm:hidden">Personal</span>
                <span className="hidden sm:inline">Personal rentals</span>
              </button>
              <button
                type="button"
                onClick={() => navigate("/business/access")}
                className="flex h-10 items-center justify-center rounded-full bg-[#351a75] px-4 text-[12px] font-bold text-white transition-colors hover:bg-[#2c155f] sm:px-5 sm:text-[13px]"
              >
                Business login
              </button>
            </div>
          ) : token ? (
            <div className="flex items-center gap-x-1.5 md:gap-x-3">
              <button
                type="button"
                onClick={() => navigate("/business")}
                className="hidden min-h-10 items-center rounded-full px-3 text-[12px] font-bold text-[#3f3a42] transition-colors hover:bg-[#f7f7f7] sm:flex sm:px-4 sm:text-[13px]"
              >
                For Business
              </button>
              {wallet?.showInHeader && (
                <button
                  type="button"
                  onClick={() => navigate("/wallet")}
                  aria-label={`Wallet balance ${compactRupees(wallet.availableBalance)}`}
                  className={`flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm font-bold transition-colors ${
                    location.pathname === "/wallet"
                      ? "border-[#cbbce9] bg-[#f4f0fc] text-[#48258f]"
                      : "border-[#dfdfe3] bg-white text-[#303035] hover:border-[#b8a7dc] hover:bg-[#faf8ff]"
                  }`}
                >
                  <WalletCards size={18} aria-hidden="true" />
                  <span>{compactRupees(wallet.availableBalance)}</span>
                </button>
              )}
              <div className="flex items-center gap-x-[2px] md:gap-x-[8px]">
                <button
                  type="button"
                  onClick={() => navigate("/help-center")}
                  aria-label="Help"
                  className={`hidden min-h-10 min-w-10 cursor-pointer items-center gap-x-[7px] rounded-full p-[9px] transition-all duration-300 lg:flex ${
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
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/my-bookings")}
                  aria-label="My Bookings"
                  className={`hidden min-h-10 min-w-10 cursor-pointer items-center gap-x-[7px] rounded-full p-[9px] transition-all duration-300 sm:flex ${
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
                </button>
                <button
                  type="button"
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
                  aria-label="Notifications"
                  className={`flex min-h-10 min-w-10 cursor-pointer items-center gap-x-[7px] rounded-full p-[9px] transition-all duration-300 ${
                    location.pathname === "/notifications"
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
                </button>
              </div>
              <div
                id="profile-button"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setShowProfileDropdown(!showProfileDropdown);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Open account menu"
                aria-expanded={showProfileDropdown}
                className="relative flex h-[42px] w-[70px] cursor-pointer items-center gap-x-[8px] rounded-full border border-[#d8d8d8] bg-white px-[8px] py-[5px] md:w-[84px] md:gap-x-[10px] md:px-[10px]"
              >
                <img
                  src="/images/Menu-Black.png"
                  alt="Menu"
                />
                <div className="min-h-[30px] min-w-[30px] overflow-hidden rounded-full border-2 border-white">
                  <img
                    className="w-full h-full object-cover"
                    src={userData?.profileUrl || userData?.profileImage || "/images/placeholder.jpeg"}
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/business")}
                className="hidden h-10 items-center justify-center rounded-full px-3 text-[12px] font-bold text-[#3f3a42] transition-colors hover:bg-[#f7f7f7] sm:flex sm:px-4 sm:text-[13px]"
              >
                For Business
              </button>
              <button
                onClick={() => setShowLoginPage(true)}
                className="flex h-[40px] cursor-pointer items-center justify-center rounded-full bg-[#351a75] px-[24px] py-[8px] text-[13px] font-bold text-white transition-colors hover:bg-[#2c155f]"
              >
                Login or Signup
              </button>
            </div>
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
