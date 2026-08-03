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
    <footer className="min-h-[100px] bg-[#0F0F0F] flex justify-between items-center px-[10%]">
      {/* Left blank */}
      <div className="text-white flex items-center gap-x-[10px]">
        <a className="text-white" href="tel:08047190022">
          080-4719-0022
        </a>{" "}
        <FaPhone className="w-[24px]" />
      </div>

      {/* Center nav */}
      <nav className="flex justify-center items-center gap-[24px]">
        <p
          onClick={() => setShowTermsModal(true)}
          className="text-[#D9DBE1] text-[14px] figtree cursor-pointer hover:text-white transition-colors"
        >
          Terms & Conditions
        </p>
        <p
          onClick={() => setShowPrivacyModal(true)}
          className="text-[#D9DBE1] text-[14px] figtree cursor-pointer hover:text-white transition-colors"
        >
          Privacy Policy
        </p>
        <p
          onClick={() => navigate("/help-center")}
          className="text-[#D9DBE1] text-[14px] figtree cursor-pointer hover:text-white transition-colors"
        >
          Help Center
        </p>
        <a
          href="mailto:contact@blive.co.in"
          className="text-[#D9DBE1] text-[14px] figtree cursor-pointer hover:text-white transition-colors"
        >
          Contact Us
        </a>
      </nav>

      {/* Right socials */}
      <div className="flex justify-end items-center gap-[16px]">
        <FaInstagram
          onClick={() =>
            window.open("https://www.instagram.com/blive.electric/", "_blank")
          }
          className="cursor-pointer w-[24px] text-white"
        />
        <FaLinkedinIn
          onClick={() =>
            window.open(
              "https://www.linkedin.com/company/bliveindia/posts/?feedView=all",
              "_blank"
            )
          }
          className="cursor-pointer w-[24px] text-white"
        />
        <FaFacebook
          onClick={() =>
            window.open(
              "https://www.facebook.com/bliveemobilityplatform/",
              "_blank"
            )
          }
          className="cursor-pointer w-[24px] text-white"
        />
        <FaYoutube
          onClick={() =>
            window.open(
              "https://www.youtube.com/@bliveemobilityplatform/shorts",
              "_blank"
            )
          }
          className="cursor-pointer w-[24px] text-white"
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
