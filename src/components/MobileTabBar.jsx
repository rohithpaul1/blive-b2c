import { createElement, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, CalendarCheck, WalletCards, LifeBuoy, UserRound } from "lucide-react";
import { UserContext } from "../contexts/UserContext";
import { LoginPageContext } from "../contexts/LoginPageContext";

// Phone-only bottom navigation, modelled on Airbnb's mobile web tab bar.
// Hidden from md up (desktop keeps the header links) and on focused flows
// (checkout, booking detail, pay link, business site) that own the bottom edge.
const TABS = [
  { to: "/home", label: "Explore", Icon: Search, match: ["/home", "/search"] },
  { to: "/my-bookings", label: "Bookings", Icon: CalendarCheck, auth: true, match: ["/my-bookings"] },
  { to: "/wallet", label: "Wallet", Icon: WalletCards, auth: true, match: ["/wallet"] },
  { to: "/help-center", label: "Help", Icon: LifeBuoy, match: ["/help-center"] },
  { to: "/profile", label: "Profile", Icon: UserRound, auth: true, match: ["/profile", "/notifications"] },
];

const HIDDEN_PREFIXES = ["/booking", "/business", "/pay"];

const MobileTabBar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { token } = useContext(UserContext);
  const { setShowLoginPage } = useContext(LoginPageContext);

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  return (
    <>
      {/* Spacer so the last bit of every page can scroll clear of the bar */}
      <div aria-hidden="true" className="h-[calc(64px+env(safe-area-inset-bottom,0px))] md:hidden" />
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-[44] border-t border-[#ebebeb] bg-white/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur md:hidden"
      >
        <ul className="mx-auto flex h-[64px] max-w-[560px] items-stretch justify-around">
          {TABS.map(({ to, label, Icon, auth, match }) => {
            const active = match.some((m) => pathname.startsWith(m));
            return (
              <li key={to} className="flex-1">
                <button
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => (auth && !token ? setShowLoginPage(true) : navigate(to))}
                  className={`flex h-full w-full flex-col items-center justify-center gap-[4px] text-[12px] font-medium transition-colors ${
                    active ? "text-[#c44536]" : "text-[#6a6a6a]"
                  }`}
                >
                  {createElement(Icon, { size: 22, strokeWidth: active ? 2.4 : 1.8, "aria-hidden": true })}
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
};

export default MobileTabBar;
