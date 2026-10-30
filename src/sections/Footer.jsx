import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { FaLinkedinIn } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";
import { FaYoutube } from "react-icons/fa6";
import { FaFacebook } from "react-icons/fa";
import { FaPhone } from "react-icons/fa";
import TermsAndConditionsModal from "../components/TermsAndConditionsModal";
import PrivacyPolicyModal from "../components/PrivacyPolicyModal";

const Footer = () => {
  const navigate = useNavigate();
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  return (
    <footer className="flex min-h-[96px] flex-col items-center justify-between gap-[22px] bg-[#0F0F0F] px-[clamp(20px,8vw,120px)] py-[26px] md:flex-row">
      <div className="flex items-center gap-x-[10px] text-[15px] font-medium text-white md:text-[13px]">
        <a className="text-white" href="tel:08047190022">
          080-4719-0022
        </a>{" "}
        <FaPhone className="w-[16px]" />
      </div>

      {/* Center nav */}
      <nav className="flex flex-wrap items-center justify-center gap-x-[20px] gap-y-0 md:gap-x-[24px] md:gap-y-[10px]">
        <p
          onClick={() => setShowTermsModal(true)}
          className="flex min-h-[44px] cursor-pointer items-center text-[14px] text-[#D9DBE1] transition-colors hover:text-white md:min-h-0 md:text-[13px]"
        >
          Terms & Conditions
        </p>
        <p
          onClick={() => setShowPrivacyModal(true)}
          className="flex min-h-[44px] cursor-pointer items-center text-[14px] text-[#D9DBE1] transition-colors hover:text-white md:min-h-0 md:text-[13px]"
        >
          Privacy Policy
        </p>
        <p
          onClick={() => navigate("/help-center")}
          className="flex min-h-[44px] cursor-pointer items-center text-[14px] text-[#D9DBE1] transition-colors hover:text-white md:min-h-0 md:text-[13px]"
        >
          Help Center
        </p>
        <a
          href="mailto:contact@blive.co.in?subject=Business%20enquiry"
          className="flex min-h-[44px] cursor-pointer items-center text-[14px] text-[#D9DBE1] transition-colors hover:text-white md:min-h-0 md:text-[13px]"
        >
          Business enquiries
        </a>
        <a
          href="mailto:contact@blive.co.in"
          className="flex min-h-[44px] cursor-pointer items-center text-[14px] text-[#D9DBE1] transition-colors hover:text-white md:min-h-0 md:text-[13px]"
        >
          Contact Us
        </a>
      </nav>

      {/* Right socials */}
      <div className="flex items-center justify-end gap-[14px]">
        <FaInstagram
          onClick={() =>
            window.open("https://www.instagram.com/blive.electric/", "_blank")
          }
          className="w-[18px] cursor-pointer text-white"
        />
        <FaLinkedinIn
          onClick={() =>
            window.open(
              "https://www.linkedin.com/company/bliveindia/posts/?feedView=all",
              "_blank"
            )
          }
          className="w-[18px] cursor-pointer text-white"
        />
        <FaFacebook
          onClick={() =>
            window.open(
              "https://www.facebook.com/bliveemobilityplatform/",
              "_blank"
            )
          }
          className="w-[18px] cursor-pointer text-white"
        />
        <FaYoutube
          onClick={() =>
            window.open(
              "https://www.youtube.com/@bliveemobilityplatform/shorts",
              "_blank"
            )
          }
          className="w-[18px] cursor-pointer text-white"
        />
      </div>
      <TermsAndConditionsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
      <PrivacyPolicyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </footer>
  );
};

export default Footer;
