import { useState, useEffect } from "react";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { getAPI } from '../caller/axiosUrls';
import { useContext } from 'react';
import { UserContext } from '../contexts/UserContext';

const PromocodePage = ({ setShowPromocodePage, setAppliedPromocode }) => {
    const [promocode, setPromocode] = useState('');
    const [showSucces, setShowSuccess] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [promoConfig, setPromoConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [, setIsNewUser] = useState(false);
    const [searchResult, setSearchResult] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);
    
    const { userData } = useContext(UserContext);

    // Check if user is new
    const checkNewUser = async () => {
        if (!userData?.id) return false;
        
        try {
            const response = await getAPI(`/vehicle-plan/check-new-user?userId=${userData.id}`);
            if (response.status === 'success') {
                return Boolean(response.data.newUser);
            }
            return false;
        } catch (error) {
            console.error('Error checking new user:', error);
            return false;
        }
    };

    // Fetch available coupons
    const fetchAvailableCoupons = async (newUserStatus) => {
        if (!userData?.id) return [];
        
        try {
            const response = await getAPI(`/vehicle-plan/available-coupons?userId=${userData.id}&newUser=${newUserStatus}`);
            if (response.status === 'success') {
                return response.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching coupons:', error);
            return [];
        }
    };

    // Load coupons on component mount
    useEffect(() => {
        const loadCoupons = async () => {
            try {
                setLoading(true);
                const newUserStatus = await checkNewUser();
                setIsNewUser(newUserStatus);
                
                const coupons = await fetchAvailableCoupons(newUserStatus);
                
                // Transform API data to match component format
                const transformedCoupons = coupons.map(coupon => ({
                    id: coupon.id,
                    offerTag: coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`,
                    promocode: coupon.code,
                    descripton: coupon.description,
                    discountAmount: coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`,
                    discountType: coupon.discountType,
                    discountValue: parseFloat(coupon.discountValue),
                    isApplicable: coupon.isActive && coupon.currentRedemptions < coupon.limitRedemptions,
                    couponData: coupon // Store original coupon data
                }));
                
                setPromocodeList(transformedCoupons);
            } catch (error) {
                console.error('Error loading coupons:', error);
            } finally {
                setLoading(false);
            }
        };

        loadCoupons();
    }, [userData]);

    const [promocodeList, setPromocodeList] = useState([]);

    // Search for promo code
    const searchPromoCode = async (code) => {
        if (!code.trim()) {
            setSearchResult(null);
            setHasError(false);
            return;
        }

        setSearchLoading(true);
        setHasError(false);

        try {
            // Search through available coupons
            const foundCoupon = promocodeList.find(coupon => 
                coupon.promocode.toLowerCase() === code.toLowerCase()
            );

            if (foundCoupon) {
                setSearchResult(foundCoupon);
                setHasError(false);
            } else {
                setSearchResult(null);
                setHasError(true);
            }
        } catch (error) {
            console.error('Error searching promo code:', error);
            setSearchResult(null);
            setHasError(true);
        } finally {
            setSearchLoading(false);
        }
    };

    // Handle input change with debounced search
    const handlePromoCodeChange = (e) => {
        const value = e.target.value;
        setPromocode(value);
        
        // Clear previous search result
        setSearchResult(null);
        setHasError(false);
        
        // Search after a short delay
        const timeoutId = setTimeout(() => {
            searchPromoCode(value);
        }, 500);

        return () => clearTimeout(timeoutId);
    };

    const applyPromocode = async (promocode, couponData = null) => {
        let result;
        
        if (couponData) {
            // Apply coupon from available coupons list
            result = { 
                promocode: couponData.code, 
                discountAmount: couponData.discountType === 'percentage' ? `${couponData.discountValue}%` : `₹${couponData.discountValue}`,
                discountType: couponData.discountType,
                discountValue: parseFloat(couponData.discountValue),
                couponId: couponData.id,
                couponData: couponData
            };
        } else {
            // Manual promocode entry (fallback)
            result = { 
                promocode, 
                discountAmount: "₹192",
                discountType: 'fixed',
                discountValue: 192
            };
        }
        
        setPromoConfig(result);
        setAppliedPromocode(result);
        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
            setShowPromocodePage(false);
        }, 1000);
    }
    
    return (
        <>
            {showSucces && 
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-screen h-screen bg-black/50 z-20 flex items-center justify-center">
                <div className="w-[550px] h-[228px] rounded-[16px] bg-white flex flex-col items-center justify-center">
                    <DotLottieReact
                        src="/images/confetti-ball.lottie"
                        loop
                        className='w-[72px] h-[72px]'
                        autoplay
                    />
                    <p className="text-[14px] text-[#222222] mt-[16px]">“{promoConfig?.promocode}” Applied</p>
                    <p className="text-[22px] font-bold text-[#222222] mt-[4px]">{promoConfig?.discountAmount} savings from this coupon</p>
                </div>
            </div>}
            <div className="w-[936px] h-[522px] bg-white rounded-[16px] login-shadow">
                <div className="py-[24px] flex items-center header-shadow px-[32px]">
                    <div className="flex flex-1 items-center gap-x-[20px]">
                        <div className="flex flex-col">
                            <p className="font-bold text-[24px] text-[#212121]">Apply Coupon Code</p>
                        </div>
                    </div>
                    <img
                        onClick={() => {
                            setShowPromocodePage(false);
                        }}
                        className="w-[24px] aspect-square cursor-pointer"
                        src="/images/Close.png"
                        alt="Close Icon"
                    />
                </div>
                <div className="flex flex-col flex-1 p-[32px]">
                    <p className="font-medium text-[22px] text-[#222222]">Enter Coupon Code</p>
                    <div className="flex gap-x-[24px] mt-[24px]">
                        <div className="flex flex-col flex-1">
                            <input 
                                value={promocode} 
                                onChange={handlePromoCodeChange} 
                                type="text" 
                                className={`flex-1 outline-none rounded-[8px] p-[16px] h-[48px] border ${hasError ? "border-[#FF5467]" : "border-[#EDEDED]"} text-[14px] bg-[#F7F7F7]`} 
                                placeholder="Enter code" 
                            />
                            {searchLoading && (
                                <p className="mt-[6px] text-[11px] text-[#3A3A3A]">Searching...</p>
                            )}
                            {hasError && !searchLoading && (
                                <p className="mt-[6px] text-[11px] poppins text-[#BE4907]">Coupon Not Found!</p>
                            )}
                            {searchResult && !searchLoading && (
                                <p className="mt-[6px] text-[11px] text-[#22C55E]">Coupon Found!</p>
                            )}
                            {!searchLoading && !hasError && !searchResult && promocode && (
                                <span className="h-[23px]" />
                            )}
                        </div>
                    </div>
                    
                    {/* Search Result */}
                    {searchResult && (
                        <div className="mt-[16px]">
                            <p className="font-medium text-[22px] text-[#222222] mb-[16px]">Found Coupon</p>
                            <div className="min-w-[400px] h-[140px] relative rounded-[16px] flex items-center promo-shadow bg-white border border-[#D9D9D9] overflow-hidden">
                                <div className={`${searchResult.isApplicable ? "promo-gradient" : "bg-[#EDEDED]"} w-[140px] h-[40px] absolute -left-[52px] flex items-center justify-center -rotate-90`}>
                                    <p className={`${searchResult.isApplicable ? "text-[#373737]" : "text-[#3A3A3A]"} font-bold`}>{searchResult.offerTag}</p>
                                </div>
                                <div className="flex flex-col flex-1 pl-[60px] py-[24px] pr-[30px]">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold text-[#222222]">{searchResult.promocode}</p>
                                        <p onClick={() => {
                                            if (searchResult.isApplicable) applyPromocode(searchResult.promocode, searchResult.couponData);
                                        }} className={`font-medium text-[14px] ${searchResult.isApplicable ? "text-[#0011A7] cursor-pointer" : "text-[#969696] cursor-not-allowed"}`}>Apply</p>
                                    </div>
                                    {searchResult.isApplicable && <p className="mt-[4px] text-[#222222] text-[13px]">You will save {searchResult.discountAmount} with this coupon.</p>}
                                    <p className={`mt-[3px] font-bold ${searchResult.isApplicable ? "text-[#C39914]" : "text-[#3A3A3A]"} text-[13px]`}>{searchResult.descripton}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-[16px] overflow-hidden">
                        <p className="font-medium text-[22px] text-[#222222]">Available Coupons</p>
                        {loading ? (
                            <div className="mt-[24px] flex items-center justify-center">
                                <p className="text-[#3A3A3A]">Loading coupons...</p>
                            </div>
                        ) : (
                            <div className="horizontalscroll pb-[10px] flex items-center mt-[24px] max-w-full overflow-x-auto gap-x-[20px]">
                                {promocodeList.length ? promocodeList.filter(item => 
                                    // Hide the coupon if it's currently shown in search result
                                    !searchResult || item.id !== searchResult.id
                                ).map((item, idx) => {
                            return (
                                <div key={"promo-" + idx} className="min-w-[400px] h-[140px] relative rounded-[16px] flex items-center promo-shadow bg-white border border-[#D9D9D9] overflow-hidden">
                                    <div className={`${item.isApplicable ? "promo-gradient" : "bg-[#EDEDED]"} w-[140px] h-[40px] absolute -left-[52px] flex items-center justify-center -rotate-90`}>
                                        <p className={`${item.isApplicable ? "text-[#373737]" : "text-[#3A3A3A]"} font-bold`}>{item.offerTag}</p>
                                    </div>
                                    <div className="flex flex-col flex-1 pl-[60px] py-[24px] pr-[30px]">
                                        <div className="flex justify-between items-start">
                                            <p className="font-bold text-[#222222]">{item.promocode}</p>
                                            <p onClick={() => {
                                                if (item.isApplicable) applyPromocode(item.promocode, item.couponData);
                                            }} className={`font-medium text-[14px] ${item.isApplicable ? "text-[#0011A7] cursor-pointer" : "text-[#969696] cursor-not-allowed"}`}>Apply</p>
                                        </div>
                                        {item.isApplicable && <p className="mt-[4px] text-[#222222] text-[13px]">You will save {item.discountAmount} with this coupon.</p>}
                                        <p className={`mt-[3px] font-bold ${item.isApplicable ? "text-[#C39914]" : "text-[#3A3A3A]"} text-[13px]`}>{item.descripton}</p>
                                    </div>
                                </div>
                            )}) : 
                            <div className="mt-[24px] flex flex-col items-center justify-center mx-auto">
                                <p className="font-medium text-[#222222]">No Coupons Available</p>
                                <p className="mt-[4px] text-[13px] text-[#3A3A3A]">You don't have any coupons to apply right now. If you have a code, you can enter it manually and verify.</p>
                            </div>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default PromocodePage;