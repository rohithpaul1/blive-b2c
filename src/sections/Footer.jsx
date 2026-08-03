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
      <div className="flex items-center gap-x-[10px] text-[13px] text-white">
        <a className="text-white" href="tel:08047190022">
          080-4719-0022
        </a>{" "}
        <FaPhone className="w-[16px]" />
      </div>

      {/* Center nav */}
      <nav className="flex flex-wrap items-center justify-center gap-x-[24px] gap-y-[10px]">
        <p
          onClick={() => setShowTermsModal(true)}
          className="figtree cursor-pointer text-[12px] text-[#D9DBE1] transition-colors hover:text-white"
        >
          Terms & Conditions
        </p>
        <p
          onClick={() => setShowPrivacyModal(true)}
          className="figtree cursor-pointer text-[12px] text-[#D9DBE1] transition-colors hover:text-white"
        >
          Privacy Policy
        </p>
        <p
          onClick={() => navigate("/help-center")}
          className="figtree cursor-pointer text-[12px] text-[#D9DBE1] transition-colors hover:text-white"
        >
          Help Center
        </p>
        <a
          href="mailto:contact@blive.co.in"
          className="figtree cursor-pointer text-[12px] text-[#D9DBE1] transition-colors hover:text-white"
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
