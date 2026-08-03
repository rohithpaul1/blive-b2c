import { useContext, useEffect, useState } from "react";
import { LoginPageContext } from "../contexts/LoginPageContext";
import OTPInput from "./OTPInput";
import toast from "react-hot-toast";
import { postAPI } from "../caller/axiosUrls";
import SpanLoader from "./SpanLoader";

const OTPPanel = ({ isLogin = false, resendCb, selectedCountryCode, setIsOTPSent, phoneNumber, title, onSuccess }) => {
  const [timeLeft, setTimeLeft] = useState(90); 
  const [hasError, setHasError] = useState(false); 
  const [otp, setOtp] = useState('');
  const [sender, setSender] = useState(false);

  const { setShowLoginPage } = useContext(LoginPageContext);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const handleResend = () => {
    if (timeLeft > 0) return;
    resendCb();
    setTimeLeft(90);
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }

    if (sender) return;
    else setSender(true);
    
    try {
      setHasError(false);
      const response = await postAPI('/v1/sms/verify-otp', {
        countryCode: selectedCountryCode.replace('+', ''),
        phoneNumber,
        otp
      });
      toast.success("OTP verified successfully!");
      const { token, ...restData } = response.data;
      if (isLogin) onSuccess(token.accessToken, restData);
      else onSuccess();
    } catch (error) {
      setHasError(true);
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setSender(false);
    }
  } 

  return (
    <div className="relative w-[664px] h-[400px] rounded-[16px] login-shadow bg-white overflow-hidden flex flex-col">
      {sender && <SpanLoader />}
      {/* Header */}
      <div className="py-[24px] flex items-center header-shadow px-[32px]">
        <div className="flex flex-1 items-center gap-x-[20px]">
          <img
            onClick={() => setIsOTPSent(false)}
            className="cursor-pointer w-[24px] aspect-square"
            src="/images/Chevron-Left.png"
            alt="Chevron Icon"
          />
          <div className="flex flex-col">
            <p className="font-bold text-[24px] text-[#212121]">{title}</p>
            <p className="text-[14px] text-[#3A3A3A]">
              Enter the code we sent to{" "}
              {phoneNumber ? 
              <span className="font-bold">
                {selectedCountryCode} {phoneNumber}
              </span> :
              <span>
                your aadhar registered number
              </span>}
            </p>
          </div>
        </div>
        <img
          onClick={() => {
            setShowLoginPage(false);
            setIsOTPSent(false);
          }}
          className="w-[24px] aspect-square cursor-pointer"
          src="/images/Close.png"
          alt="Close Icon"
        />
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 px-[32px]">
        {/* OTP Inputs */}
        <div className="mt-[32px]">
          <p className="text-[12px] text-[#717171]">Verification Code</p>
            <OTPInput onChangeOTP={(val) => {
                setHasError(false);
                setOtp(val);
            }} hasError={hasError} />
            {hasError && (
                <p className="mt-[4px] text-[11px] text-[#BE4907]">
                Verification code is incorrect. Please try again
                </p>
            )}
        </div>

        {/* Resend Section */}
        <div className="mt-[20px] flex items-center gap-x-[12px]">
          <p className="text-[#3A3A3A] text-[13px]">
            Didn’t receive a code?
            <span className="font-bold ml-1">({formatTime(timeLeft)})</span>
          </p>
          <button
            onClick={handleResend}
            disabled={timeLeft > 0 || sender}
            className={`font-medium text-[14px] ${
              (timeLeft > 0 || sender)
                ? "text-[#969696] cursor-not-allowed"
                : "text-[#1B29A9] cursor-pointer"
            }`}
          >
            Resend Code
          </button>
        </div>

        {/* Spacer (this takes up all the remaining height) */}
        <span className="flex-1" />

        {/* Bottom Button */}
        <div className="pb-[32px]">
          <button
            disabled={sender}
            onClick={() => {
                if (otp.length === 6) verifyOTP();
            }}
            className={`w-full h-[48px] font-bold text-[#FDFDFD] rounded-[24px] py-[13px] px-[24px] ${
              otp.length === 6
                ? "bg-[#000000] cursor-pointer"
                : "bg-[#CBCBCB] cursor-not-allowed"
            }`}
          >
            Verify & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTPPanel;