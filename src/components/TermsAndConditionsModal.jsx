import { useEffect } from 'react';

const TermsAndConditionsModal = ({ isOpen, onClose }) => {
    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        
        // Cleanup on unmount
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Handle escape key press
    useEffect(() => {
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscapeKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-[16px] w-[90vw] max-w-[800px] h-[90vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-[24px] border-b border-gray-200">
                    <h2 className="text-[24px] font-bold text-black">Terms and Conditions</h2>
                    <button 
                        onClick={onClose}
                        className="w-[40px] h-[40px] flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all duration-200 text-[20px]"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-[24px]">
                    <div className="prose prose-sm max-w-none text-[14px] leading-[1.6] text-[#333]">
                        <p className="text-[12px] text-gray-600 mb-4">Arcis Clean Energy Private Ltd – Last Updated on 026/09/2025</p>
                        
                        <p className="mb-4">
                            These Terms of Service govern your use of the BLive EZY application, website and technology platform (the "Services") provided by Arcis Clean Energy Private Ltd. (including any subsidiaries or affiliates of Arcis Clean Energy Private Ltd., collectively, "BLive"). Specifically, the Services include the BLive network of websites that link to these Terms of Service (including any versions optimized for viewing on a wireless or tablet device); email newsletters published or distributed by BLive; apps published by BLive, including the "BLive" mobile app; or any other services, interactive features, and communications made available by BLive, however accessed and/or used, that are operated by BLive, made available by BLive, or produced and maintained by BLive and its related companies. The foregoing Services may be used to access vehicle rental services ("Rental Services") offered by B Live and/or third party providers ("Platform Partners").
                        </p>

                        <p className="mb-4 font-semibold text-[#000]">
                            BY USING OUR SERVICES, YOU ARE ACCEPTING THE PRACTICES DESCRIBED IN THESE TERMS OF SERVICE. IF YOU DO NOT AGREE TO THESE TERMS OF SERVICE, PLEASE DO NOT USE THE SERVICES. WE RESERVE THE RIGHT TO MODIFY OR AMEND THESE TERMS OF SERVICE FROM TIME TO TIME WITHOUT NOTICE, BUT WILL NOTIFY YOU OF ANY MATERIAL CHANGES. YOUR CONTINUED USE OF OUR SERVICES FOLLOWING THE POSTING OF OR NOTICE OF CHANGES TO THESE TERMS WILL MEAN YOU ACCEPT THOSE CHANGES. UNLESS WE PROVIDE YOU WITH SPECIFIC NOTICE, NO CHANGES TO OUR TERMS OF USE WILL APPLY RETROACTIVELY.
                        </p>

                        <p className="mb-6">
                            For Rental Services, you may also be required to execute a Rental Agreement, Waiver of Liability and Release or similar document between you and BLive or a Platform Partner. Any decision to accept Rental Services is made at your sole discretion.
                        </p>

                        <p className="mb-4">
                            This is a legal agreement between you ("you" or "user") and B Live that states the material terms and conditions that govern your use of the Services. This agreement, together with all updates, supplements, additional terms, and all of BLive's rules and policies collectively constitute this "Agreement" between you and BLive.
                        </p>

                        <h3 className="text-[16px] font-bold text-black mt-6 mb-3">1. Access License</h3>
                        <p className="mb-4">
                            BLive grants you a limited, revocable, non-exclusive, non-transferable license to access and make use of the Services or its content. This license does not include any resale or commercial use of the Services or its contents; any collection and use of any product listings, descriptions, or prices; any derivative use of the Services or their contents; any downloading or copying of account information for the benefit of another merchant; or any use of data mining, robots, cookies, or similar data gathering and extraction tools. Except as expressly permitted herein, the Services and/or any portion of the Services may not be reproduced, sold, resold, visited or otherwise exploited for any purpose without BLive's express written consent. Any unauthorized use automatically terminates the permissions and/or licenses granted by us to you.
                        </p>

                        <h3 className="text-[16px] font-bold text-black mt-6 mb-3">2. Copyright and Ownership</h3>
                        <p className="mb-4">
                            All of the content featured or displayed on the Services, including without limitation text, graphics, photographs, images, moving images, sound, and illustrations ("Content"), is owned by BLive, its licensors, vendors, agents and/or its Content providers. All elements of the Services, including without limitation the general design and the Content, are protected by trade dress, copyright, moral rights, trademark and other laws relating to intellectual property rights. The Services may only be used for the intended purpose for which such Services are being made available. Except as permitted by copyright law, you may not modify any of the materials and you may not copy, distribute, transmit, display, perform, reproduce, publish, license, create derivative works from, transfer or sell any information or work contained on the Services.
                        </p>

                        <p className="mb-4">
                            Except as authorized under the copyright laws, you are responsible for obtaining permission before reusing any copyrighted material that is available on the Services. You shall comply with all applicable domestic and international laws, statutes, ordinances and regulations regarding your use of the Services. The Services, Content and all related rights shall remain the exclusive property of BLive or its licensors, vendors, agents, and/or its Content providers unless otherwise expressly agreed.
                        </p>

                        <p className="mb-4">
                            You will not remove any copyright, trademark or other proprietary notices from material found on the Services.
                        </p>

                        <h3 className="text-[16px] font-bold text-black mt-6 mb-3">3. Trademarks/No Endorsement</h3>
                        <p className="mb-4">
                            All trademarks, service marks and trade names of BLive used herein (including but not limited to: B Live name, BLive corporate logo, the Services design, and any names or logos of any Platform Partners) (collectively "Marks") are trademarks or registered trademarks of Live or its affiliates, partners, vendors, licensors or Platform Partners. You may not use, copy, reproduce, republish, upload, post, transmit, distribute, or modify Marks in any way, including in advertising or publicity pertaining to distribution of materials on the Services, without B Live's prior written consent. You shall not use B Live's name or any language, pictures or symbols which could, in BLive's judgment, imply B Live's endorsement in any (i) written or oral advertising or presentation, or (ii) brochure, newsletter, book, or other written material of whatever nature, without prior written consent.
                        </p>

                        <h3 className="text-[16px] font-bold text-black mt-6 mb-3">4. Account Registration and Security</h3>
                        <p className="mb-4">
                            You understand that you will need to create an account to have access to the Services, including Rental Services. You will: (a) provide true, accurate, current and complete information about yourself as prompted by the Services' registration, sign-in, or subscription page (such information being the "Registration Data") and (b) maintain and promptly update the Registration Data to keep it true, accurate, current and complete. If you provide any information that is untrue, inaccurate, not current or incomplete, or B Live has reasonable grounds to suspect that such information is untrue, inaccurate, not current or incomplete, B Live has the right to suspend or terminate your account and refuse any and all current or future use of the Services (or any portion thereof). You are responsible for the security and confidentiality of your password and account. Furthermore, you are responsible for any and all activities that occur under your account. You will not share your account information or your user name and password with any third party or permit any third party to logon to the Services using your account information. You agree to immediately notify us of any unauthorized use of your account or any other breach of security of which you become aware.
                        </p>

                        <p className="mb-4">
                            You are responsible for taking precautions and providing security measures best suited for your situation and intended use of the Services. BLive's collection, use, and disclosure of all data, including Registration Data is governed by BLive's Privacy Policy, located at BLive.co/privacy.
                        </p>

                        <h3 className="text-[16px] font-bold text-black mt-6 mb-3">5. Payment Terms</h3>
                        
                        <h4 className="text-[14px] font-semibold text-black mt-4 mb-2">5.1 Payment Method & Payments</h4>
                        <p className="mb-4">
                            You may be required to provide BLive with a valid credit card, debit card, or other payment account ("Payment Method") in order to use certain Services, including Rental Services provided by BLive or a Platform Partner. When you add a Payment Method to your BLive account, you will be asked to provide customary billing information. You must provide accurate, current, and complete information when adding a Payment Method and it is your obligation to keep your Payment Method up-to-date at all times.
                        </p>

                        <p className="mb-4">
                            You represent and warrant to BLive that you are authorized to use any Payment Method you furnish to B Live. You authorize BLive to charge the Payment Method for all fees incurred by you with respect to Rental Services (or other services offered by B Live or Platform Partners from time to time), including applicable sales, use, VAT/GST and other local government charges. If you dispute any charge on your account, you must contact BLive within 10 business days from the end of the month within which the disputed charge occurred, and provide to BLive all trip information that is necessary to identify the disputed charge, such as the date of the trip and the approximate starting and ending times of the ride associated with the disputed charge. You agree to immediately inform BLive of all changes relating to the Payment Method.
                        </p>

                        <h4 className="text-[14px] font-semibold text-black mt-4 mb-2">5.2 Auto-Update</h4>
                        <p className="mb-4">
                            BLive or its Platform Partner may require or make available an option for you to preload a balance associated with your account and automatically make payments on a recurring basis ("Auto-Update"). By enabling Auto-Update, you opt to automatically reload your account balance each time your account reaches or falls below zero or another specified amount. B Live or its affiliates or Platform Partners may, at any time, without any notice to you, discontinue Auto-Update.
                        </p>

                        <p className="mb-4">
                            To use Auto-Update, you may be required to choose: (a) the balance amount at which you wish to automatically load your account balance, and/or (b) the amount you wish to load/add (such amount, "Auto-Update Amount"). If your account is eligible for a bonus for your Auto-Update selection ("Auto-Update Bonus"), your Auto-Update Bonus will be charged first for using the applicable Rental Services. Auto-Update Bonus amounts may only be used for Rental Services, and Auto-Update Bonus amounts are not recoverable if your account is closed for any reason.
                        </p>

                        <h3 className="text-[16px] font-bold text-black mt-6 mb-3">6. Binding Arbitration and Class Action Waiver</h3>
                        <p className="mb-4 font-semibold text-red-600">
                            PLEASE READ THIS SECTION CAREFULLY – IT MAY SIGNIFICANTLY AFFECT YOUR LEGAL RIGHTS, INCLUDING YOUR RIGHT TO FILE A LAWSUIT IN COURT.
                        </p>

                        <h4 className="text-[14px] font-semibold text-black mt-4 mb-2">6.1 Initial Dispute Resolution</h4>
                        <p className="mb-4">
                            The BLive application contains means to receive support and address any concerns you may have regarding your use of Rental Services. The parties shall use their best efforts through this support process to settle any dispute, claim, question, or disagreement and engage in good faith negotiations which shall be a condition to either party initiating mediation, arbitration, or a lawsuit.
                        </p>

                        <h4 className="text-[14px] font-semibold text-black mt-4 mb-2">6.2 Binding Arbitration</h4>
                        <p className="mb-4">
                            If the parties do not reach an agreed upon solution through the support process, then either party may initiate binding arbitration as the sole means to resolve claims, subject to the terms set forth below. Specifically, all claims arising out of or relating to these Terms of Service, and the parties' relationship with each other shall be finally settled by binding arbitration administered by a mutually agreed upon arbitrator or arbitration service.
                        </p>

                        <h4 className="text-[14px] font-semibold text-black mt-4 mb-2">6.3 Location</h4>
                        <p className="mb-4">
                            The arbitration will take place in Goa, Maharashtra or a mutually agreed upon location.
                        </p>

                        <h4 className="text-[14px] font-semibold text-black mt-4 mb-2">6.4 Class Action Waiver</h4>
                        <p className="mb-4">
                            The parties further agree that any arbitration shall be conducted in their individual capacities only and not as a class action or other representative action, and the parties expressly waive their right to file a class action or seek relief on a class basis. YOU AND BLive AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.
                        </p>

                        <h3 className="text-[16px] font-bold text-black mt-6 mb-3">17. DISCLAIMERS</h3>
                        <p className="mb-4 font-semibold">
                            YOUR USE OF THE SERVICES AND ANY RENTAL SERVICES IS AT YOUR RISK. THE INFORMATION, MATERIALS AND SERVICES PROVIDED ON OR THROUGH THE SERVICES ARE PROVIDED "AS IS" WITHOUT ANY WARRANTIES OF ANY KIND INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, SECURITY OR NON-INFRINGEMENT OF INTELLECTUAL PROPERTY. NEITHER BLIVE, NOR ANY OF ITS AFFILIATES WARRANT THE ACCURACY OR COMPLETENESS OF THE INFORMATION, MATERIALS OR SERVICES PROVIDED ON OR THROUGH THE SERVICES.
                        </p>

                        <h3 className="text-[16px] font-bold text-black mt-6 mb-3">18. LIMITATIONS OF LIABILITY</h3>
                        <p className="mb-4 font-semibold">
                            BLIVE DOES NOT ASSUME ANY RESPONSIBILITY, NOR WILL BE LIABLE, FOR ANY DAMAGES TO, OR ANY VIRUSES THAT MAY INFECT YOUR COMPUTER, TELECOMMUNICATION EQUIPMENT, OR OTHER PROPERTY CAUSED BY OR ARISING FROM YOUR ACCESS TO, USE OF, OR BROWSING THE SERVICES. IN NO EVENT SHALL BLIVE'S TOTAL LIABILITY TO YOU FOR ALL DAMAGES, LOSSES, AND CAUSES OF ACTION WHETHER IN CONTRACT, TORT (INCLUDING, BUT NOT LIMITED TO, NEGLIGENCE), OR OTHERWISE EXCEED THE GREATER OF (A) RUPEES FIFTEEN THOUSAND (Rs.15,000/-); or (B) THE TOTAL FEES YOU HAVE PAID TO BLIVE OR ITS PLATFORM PARTNER IN THE PREVIOUS THREE (3) MONTH PERIOD.
                        </p>

                        <h3 className="text-[16px] font-bold text-black mt-6 mb-3">Privacy</h3>
                        <p className="mb-4">
                            Data collection and use, including data collection and use of personally identifiable information is governed by BLive's Privacy Policy which is incorporated into and is a part of this Agreement.
                        </p>

                        <h3 className="text-[16px] font-bold text-black mt-6 mb-3">General</h3>
                        <p className="mb-4">
                            Any claim relating to, and the use of, this Services and the materials contained herein is governed by the laws of the State of Maharashtra. You consent to the exclusive jurisdiction of the courts located in Goa, Maharashtra. These Terms of Service set forth the entire understanding and agreement between us with respect to the subject matter hereof.
                        </p>

                        <h3 className="text-[16px] font-bold text-black mt-6 mb-3">Additional Assistance</h3>
                        <p className="mb-4">
                            If you do not understand any of the foregoing Terms of Service or if you have any questions or comments, we invite you to contact us at info@blive.co.in.
                        </p>

                        <h3 className="text-[16px] font-bold text-black mt-6 mb-3">Copyright Notice</h3>
                        <p className="mb-4">
                            All design, graphics, text selections, arrangements, and all software are Copyright © 2025-2026 Arcis Clean Energy Pvt Ltd. and its related companies or its licensors. ALL RIGHTS RESERVED.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-[24px] flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-[24px] py-[12px] bg-[#000000] text-white font-medium text-[14px] rounded-[24px] hover:bg-[#333333] transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TermsAndConditionsModal;
