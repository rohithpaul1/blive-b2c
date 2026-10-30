import { useContext, useEffect, useState } from "react";
import { LoginPageContext } from "../contexts/LoginPageContext";
import { ProductContext } from "../contexts/ProductContext";
import { UserContext } from "../contexts/UserContext";
import { isValidPhoneNumber } from "../utils/validators";
import OTPPanel from "./OTPPanel";
import NewUserPage from "./NewUserPage";
import toast from "react-hot-toast";
import SpanLoader from "./SpanLoader";
import { useNavigate } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";
import { SIMULATE_OTP } from "../config/env";
import { Headphones, Wrench, X, Zap } from "lucide-react";
import { franchiseHome as c } from "../config/franchiseHome";

const Login = () => {
  const [isOTPSent, setIsOTPSent] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState("+91");
  const [showNewUserPage, setShowNewUserPage] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sender, setSender] = useState(false);

  const { setShowLoginPage } = useContext(LoginPageContext);
  const { selectedProduct } = useContext(ProductContext);
  const { userData, isAuthenticated } = useContext(UserContext);
  const { signIn } = useAuthActions();
  const [awaitingProfile, setAwaitingProfile] = useState(false);

  const navigate = useNavigate();

  const handleSendOTP = async () => {
    if (!isValidPhoneNumber(phoneNumber)) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }

    if (sender) return;
    else setSender(true);

    try {
      await signIn("phone", { phone: `${selectedCountryCode}${phoneNumber}` });
      toast.success("OTP sent successfully!");
      setIsOTPSent(true);
    } catch (error) {
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setSender(false);
    }
  };

  const onVerifiedOTP = async () => {
    setIsOTPSent(false);
    setAwaitingProfile(true);
  };

  useEffect(() => {
    if (!awaitingProfile || !isAuthenticated || !userData) return;
    setAwaitingProfile(false);
    if (userData.currentState === "basic-profile-pending") {
      setShowNewUserPage(true);
      return;
    }
    setShowLoginPage(false);
    if (selectedProduct) navigate("/booking");
  }, [awaitingProfile, isAuthenticated, navigate, selectedProduct, setShowLoginPage, userData]);

  const updateUserData = () => {
    setShowNewUserPage(false);
    setShowLoginPage(false);

    // If there's a selected product, navigate to booking page
    if (selectedProduct) {
      navigate("/booking");
    }
  };

  return (
    <div className="fixed z-50 w-screen h-screen top-0 left-0 bg-black/50 flex items-end md:items-center justify-center">
      {showNewUserPage ? (
        <NewUserPage
          onSuccess={updateUserData}
          setShowNewUserPage={setShowNewUserPage}
          setShowLoginPage={setShowLoginPage}
        />
      ) : isOTPSent ? (
        <OTPPanel
          isLogin={true}
          resendCb={handleSendOTP}
          onSuccess={onVerifiedOTP}
          selectedCountryCode={selectedCountryCode}
          setIsOTPSent={setIsOTPSent}
          phoneNumber={phoneNumber}
          title={"Verify Phone Number"}
          simulationCode={SIMULATE_OTP ? "123456" : null}
        />
      ) : (
        <div className="flex self-end md:self-center w-full md:w-[1000px] md:max-w-none max-h-[92%] rounded-t-[24px] md:rounded-[16px] overflow-hidden login-shadow bg-white">
          {/* Franchise panel: city lockup, headline, the NDuro on the stage, three promises. */}
          <div className="sixt-stage hidden w-[440px] shrink-0 flex-col px-[40px] pb-[36px] pt-[40px] text-white md:flex">
            <div className="flex items-center gap-[12px]">
              <span className="font-display text-[26px] leading-[0.85] tracking-[0.06em] text-[#f4b9a8]">{c.city}</span>
              <span aria-hidden="true" className="h-[22px] w-px bg-white/30" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">{c.franchiseName}</span>
            </div>
            <p className="font-display m-0 mt-[22px] text-[40px] leading-[0.95]">Your ride is one step away.</p>
            <div className="relative mt-[18px] flex h-[220px] items-end justify-center">
              <span aria-hidden="true" className="absolute bottom-[6%] left-1/2 h-[10%] w-[70%] -translate-x-1/2 rounded-[50%] bg-black/55 blur-[14px]" />
              <img className="relative h-full w-full object-contain object-bottom" src={c.model.cutout || "/images/home/nduro-side.png"} alt={c.model.name} />
            </div>
            <ul className="m-0 mt-auto flex list-none flex-col gap-[14px] p-0 pt-[22px]">
              {[
                { Icon: Zap, title: "From ₹150 a day", body: "Subscribe monthly and save 50% on the daily rate." },
                { Icon: Wrench, title: "Maintenance included", body: "We look after the scooter. You just ride." },
                { Icon: Headphones, title: "Help, day or night", body: `24/7 support on ${c.supportPhone}.` },
              ].map(({ Icon, title, body }) => (
                <li key={title} className="flex items-start gap-[12px]">
                  <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-white/[0.14]">
                    <Icon className="size-[17px]" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-[15px] font-bold">{title}</span>
                    <span className="mt-[2px] block text-[13px] leading-[1.45] text-white/75">{body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative flex flex-1 flex-col pb-[30px] md:pb-0">
            <div className="py-[24px] px-[32px] flex items-center justify-between header-shadow w-full">
              <div className="flex flex-col">
                <p className="text-[24px] font-bold text-[#212121]">
                  {selectedProduct ? "Log in to finish your booking" : "Log in or sign up"}
                </p>
                <p className="mt-[4px] text-[14px] text-[#3A3A3A]">
                  We'll text a one-time code to your mobile. No password needed.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLoginPage(false)}
                aria-label="Close"
                className="flex size-[40px] shrink-0 items-center justify-center rounded-full hover:bg-[#f2f2f2]"
              >
                <X className="size-[22px] text-[#212121]" aria-hidden="true" />
              </button>
            </div>
            {selectedProduct && (
              <div className="mt-[24px] flex items-center gap-x-[12px] mx-[32px] rounded-[16px] border border-[#EDEDED] py-[12px] px-[16px] bg-white">
                <img
                  className="h-[64px] w-[84px] rounded-[8px] bg-[#f2f1f4] object-contain"
                  src={c.model.cutout || selectedProduct.imgUrl}
                  alt=""
                />
                <div className="flex flex-col">
                  <p className="font-bold text-[18px] text-[#484848]">
                    {selectedProduct.vehicleName}
                  </p>
                  <p className="text-[#3A3A3A] text-[12px]">
                    {selectedProduct.rentalMode === "subscription" ? "Subscription" : "Rate plan"}: {selectedProduct.selectedPlanType || "daily"}
                    {selectedProduct.rentalMode === "subscription" && selectedProduct.subscriptionDuration
                      ? ` · ${selectedProduct.subscriptionDuration} ${selectedProduct.selectedPlanType === "monthly" ? "month" : selectedProduct.selectedPlanType === "weekly" ? "week" : "day"}${Number(selectedProduct.subscriptionDuration) === 1 ? "" : "s"} minimum`
                      : ""}
                  </p>
                </div>
              </div>
            )}
            {sender && <SpanLoader />}
            <div className="mt-[32px] mx-[32px] flex flex-col">
              <p className="text-[12px] text-[#717171]">Phone Number</p>
              <div className="mt-[4px] gap-x-[12px] flex items-center">
                <div className="relative w-fit">
                  <select
                    disabled={sender}
                    value={selectedCountryCode}
                    onChange={(e) => setSelectedCountryCode(e.target.value)}
                    className="rounded-[8px] border border-[#EDEDED] outline-none p-[16px] pr-[40px] bg-[#F7F7F7] font-bold text-[14px] text-[#222222] appearance-none"
                  >
                    <option value="+91">
                      IN (+91)
                    </option>
                  </select>
                  <img
                    src="/images/Chevron-Down.png"
                    alt="Chevron"
                    className="pointer-events-none absolute right-[12px] top-1/2 -translate-y-1/2 w-[16px] h-[16px]"
                  />
                </div>
                <input
                  disabled={sender}
                  value={phoneNumber}
                  maxLength="10"
                  onChange={(e) => {
                    const onlyNums = e.target.value.replace(/\D/g, "");
                    setPhoneNumber(onlyNums);
                  }}
                  placeholder="0000000000"
                  className="rounded-[8px] w-full border border-[#EDEDED] outline-none p-[16px] bg-[#F7F7F7] text-[16px] tracking-[0.04em] text-[#222222] focus:border-[#c44536] focus:bg-white"
                  type="text"
                  inputMode="numeric"
                />
              </div>
            </div>
            <button
              disabled={sender || phoneNumber.length !== 10}
              onClick={handleSendOTP}
              className="mt-[24px] mx-[32px] rounded-[24px] bg-[#c44536] px-[24px] py-[13px] font-bold text-[#FDFDFD] transition-colors hover:bg-[#a8392b] disabled:cursor-not-allowed disabled:bg-[#CBCBCB]"
            >
              {sender ? "Sending code…" : "Get code"}
            </button>
            <p className="mx-[32px] mt-[14px] text-[12px] leading-[1.5] text-[#717171]">
              By continuing you agree to receive a one-time code by SMS. Standard messaging rates may apply.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
