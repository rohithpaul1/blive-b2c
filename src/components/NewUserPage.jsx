import { useContext, useState } from "react";
import SpanLoader from "./SpanLoader";
import { postAPI } from "../caller/axiosUrls";
import toast from "react-hot-toast";
import { UserContext } from "../contexts/UserContext";
import TermsAndConditionsModal from "./TermsAndConditionsModal";

const NewUserPage = ({ setShowNewUserPage, setShowLoginPage, onSuccess }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [sender, setSender] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);

    const { userData } = useContext(UserContext);

    const updateName = async () => {
        if (!firstName || !lastName) {
            toast.error("Please enter both first and last names.");
            return;
        }

        if (sender) return;
        else setSender(true);
        
        try {
            const response = await postAPI('/user-onboarding/update-user', {
                id: userData?.id,
                firstName,
                lastName
            })
            toast.success("Name added/updated successfully!");
            onSuccess(response.data);
        } catch (error) {
            toast.error(error.message || "Something went wrong. Please try again.");
        } finally {
            setSender(false);
        }
    }

    return (
        <div className="relative w-[664px] h-[490px] rounded-[16px] login-shadow bg-white overflow-hidden flex flex-col">
            {sender && <SpanLoader />}
            {/* Header */}
            <div className="py-[24px] flex items-center header-shadow px-[32px]">
                <div className="flex flex-1 items-center gap-x-[20px]">
                <img
                    onClick={() => {
                        setShowLoginPage(false);
                        setShowNewUserPage(false);
                    }}
                    className="cursor-pointer w-[24px] aspect-square"
                    src="/images/Chevron-Left.png"
                    alt="Chevron Icon"
                />
                <div className="flex flex-col">
                    <p className="font-bold text-[24px] text-[#212121]">Let’s Get Started</p>
                    <p className="text-[14px] text-[#3A3A3A]">
                        Enter your name as it appears on your ID for a smooth booking.
                    </p>
                </div>
                </div>
                <img
                onClick={() => {
                    setShowLoginPage(false);
                    setShowNewUserPage(false);
                }}
                className="w-[24px] aspect-square cursor-pointer"
                src="/images/Close.png"
                alt="Close Icon"
                />
            </div>
            {/* Body */}
            <div className="flex flex-col flex-1 px-[32px]">

                <div className="mt-[32px] ">
                    <p className="text-[12px] text-[#717171]">First Name</p>
                    <input disabled={sender} value={firstName} onChange={(e) => setFirstName(e.target.value)} type="text" className="border mt-[4px] outline-none border-[#EDEDED] text-[14px] h-[48px] w-full bg-[#F7F7F7] p-[16px] rounded-[8px]" placeholder="Enter first name" />
                    <p className="mt-[16px] text-[12px] text-[#717171]">Last Name</p>
                    <input disabled={sender} value={lastName} onChange={(e) => setLastName(e.target.value)} type="text" className="border mt-[4px] outline-none border-[#EDEDED] text-[14px] h-[48px] w-full bg-[#F7F7F7] p-[16px] rounded-[8px]" placeholder="Enter last name" />
                    <p className="mt-[24px] text-[14px] text-[#3A3A3A]">By continuing, you agree to our <span onClick={() => setShowTermsModal(true)} className="font-bold text-[#1B29A9] underline underline-offset-2 cursor-pointer hover:text-[#0F0F0F]">Terms of Service</span> & <span onClick={() => setShowTermsModal(true)} className="font-bold text-[#1B29A9] underline underline-offset-2 cursor-pointer hover:text-[#0F0F0F]">Privacy Policy</span></p>
                </div>
                
                {/* Spacer (this takes up all the remaining height) */}
                <span className="flex-1" />

                {/* Bottom Button */}
                <div className="pb-[32px]">
                    <button
                        disabled={!(firstName && lastName) || sender}
                        onClick={() => {
                            if (firstName && lastName) updateName();
                        }}
                        className={`w-full h-[48px] font-bold text-[#FDFDFD] rounded-[24px] py-[13px] px-[24px] ${
                        (firstName && lastName)
                            ? "bg-[#000000] cursor-pointer"
                            : "bg-[#CBCBCB] cursor-not-allowed"
                        }`}
                    >
                        Signup
                    </button>
                </div>
            </div>
            <TermsAndConditionsModal 
                isOpen={showTermsModal} 
                onClose={() => setShowTermsModal(false)} 
            />
        </div>
    )
}

export default NewUserPage;