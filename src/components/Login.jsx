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
    <div className="fixed z-50 w-screen h-screen top-0 left-0 bg-black/50 flex items-center justify-center">
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
        <div className="flex w-[1000px] max-h-[90%] rounded-[16px] overflow-hidden login-shadow bg-white">
          <div className="flex flex-col w-[460px] bg-[#F7F7F7] h-full pt-[50px] px-[52px] gap-y-[30px]">
            <div className="flex gap-x-[15px] items-start">
              <div className="bg-white rounded-full p-2 w-10 h-10 flex items-center justify-center flex-shrink-0 text-xl">
                🛵
              </div>
              <div className="flex flex-col gap-y-[8px]">
                <p className="font-bold text-[18px] text-[#222222]">
                  Diverse EV Selection
                </p>
                <p className="text-[14px] text-[#3A3A3A] mr-4">
                  From budget-friendly city commuters to premium long-range EVs
                  — find the perfect ride for your needs and budget.
                </p>
              </div>
            </div>
            <div className="flex gap-x-[15px] items-start">
              <div className="bg-white rounded-full p-2 w-10 h-10 flex items-center justify-center flex-shrink-0 text-xl">
                💸
              </div>
              <div className="flex flex-col gap-y-[8px]">
                <p className="font-bold text-[18px] text-[#222222]">
                  Transparent & Affordable Pricing
                </p>
                <p className="text-[14px] text-[#3A3A3A] mr-4">
                  No hidden fees. Just simple, competitive rates so you can ride
                  worry-free.
                </p>
              </div>
            </div>
            <div className="flex gap-x-[15px] items-start">
              <div className="bg-white rounded-full p-2 w-10 h-10 flex items-center justify-center flex-shrink-0 text-xl">
                ⚡️
              </div>
              <div className="flex flex-col gap-y-[8px]">
                <p className="font-bold text-[18px] text-[#222222]">
                  Quick & Easy Booking
                </p>
                <p className="text-[14px] text-[#3A3A3A] mr-4">
                  Book your EV in minutes — anytime, anywhere.
                </p>
              </div>
            </div>
            <div className="flex gap-x-[15px] items-start">
              <div className="bg-white rounded-full p-2 w-10 h-10 flex items-center justify-center flex-shrink-0 text-xl">
                🛠️
              </div>
              <div className="flex flex-col gap-y-[8px]">
                <p className="font-bold text-[18px] text-[#222222]">
                  All-Inclusive Experience
                </p>
                <p className="text-[14px] text-[#3A3A3A] mr-4">
                  Insurance, servicing, and roadside assistance included. You
                  ride, we handle the rest.
                </p>
              </div>
            </div>
            <img
              className="w-2/3 self-center"
              src="/images/ScooterLogin.png"
              alt="Scooter Image"
            />
          </div>
          <div className="relative flex flex-1 flex-col">
            <div className="py-[24px] px-[32px] flex items-center justify-between header-shadow w-full">
              <div className="flex flex-col">
                <p className="text-[24px] font-bold text-[#212121]">
                  Login or Sign up to continue booking
                </p>
                <p className="mt-[4px] text-[14px] text-[#3A3A3A]">
                  Get started with BLive EZY—just verify your Mobile Number.
                </p>
              </div>
              <img
                onClick={() => setShowLoginPage(false)}
                className="cursor-pointer w-[24px] aspect-square"
                src="/images/Close.png"
                alt="Close Icon"
              />
            </div>
            {selectedProduct && (
              <div className="mt-[24px] flex items-center gap-x-[12px] mx-[32px] rounded-[16px] border border-[#EDEDED] py-[12px] px-[16px] bg-white">
                <img
                  className="w-[64px] h-[64px] rounded-[8px] object-cover"
                  src={selectedProduct.imgUrl}
                  alt="Scooter Book Image"
                />
                <div className="flex flex-col">
                  <p className="font-bold text-[18px] text-[#484848]">
                    {selectedProduct.vehicleName}
                  </p>
                  <p className="text-[#3A3A3A] text-[11px]">
                    Rate Plan : Daily
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
                  className="rounded-[8px] w-full border border-[#EDEDED] outline-none p-[16px] bg-[#F7F7F7] text-[14px] text-[#222222]"
                  type="text"
                  inputMode="numeric"
                />
              </div>
            </div>
            <button
              disabled={sender}
              onClick={handleSendOTP}
              className="mt-[24px] mx-[32px] cursor-pointer bg-[#000000] py-[13px] px-[24px] rounded-[24px] text-[#FDFDFD] font-bold"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
