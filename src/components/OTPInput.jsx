import { useState, useRef, useEffect } from "react";

const OTPInput = ({ length = 6, onChangeOTP, hasError }) => {
  const [otp, setOtp] = useState(Array(length).fill(""));
  const inputsRef = useRef([]);

  // Autofocus on first input when mounted
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // Whenever OTP changes → move focus to next available empty cell
  useEffect(() => {
    const firstEmptyIndex = otp.findIndex((d) => d === "");
    if (firstEmptyIndex !== -1) {
      inputsRef.current[firstEmptyIndex]?.focus();
    } else {
      inputsRef.current[length - 1]?.focus(); // focus last if all filled
    }
  }, [otp, length]);

  const handleChange = (value, index) => {
    if (/^\d$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      onChangeOTP(newOtp.join(""));
    } else if (value === "") {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      onChangeOTP(newOtp.join(""));
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").slice(0, length);
    if (/^\d+$/.test(pasteData)) {
      const newOtp = pasteData
        .split("")
        .concat(Array(length).fill(""))
        .slice(0, length);
      setOtp(newOtp);
      onChangeOTP(newOtp.join(""));
    }
  };

  return (
    <div className="flex mt-[10px] items-center gap-x-[14px]">
      {otp.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength="1"
          value={digit}
          onChange={(e) => handleChange(e.target.value, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
          className={`w-[48px] h-[48px] rounded-[8px] text-[18px] bg-[#F7F7F7] text-[#222222] text-center border border-[#EDEDED] focus:outline-none ${hasError ? "ring-1 ring-[#FF5467]" : "focus:ring-1 focus:ring-blue-500"}`}
        />
      ))}
    </div>
  );
};

export default OTPInput;