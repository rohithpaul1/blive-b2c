import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { postAPI } from "../caller/axiosUrls";
import { RAZORPAY_KEY_ID, SIMULATE_PAYMENT } from "../config/env";
import { useUser } from "../contexts/UserContext";

const ModifyDates = ({ data, setOpenModifyDates, formattedDate, countDays, onDateChanged }) => {
    const [step, setStep] = useState(0);
    const [selectedTime, setSelectedTime] = useState("9 AM");
    const [, setAmount] = useState("1395");
    const [additionalAmount, setAdditionalAmount] = useState(0);
    const [daysDifference, setDaysDifference] = useState(0);
    const [loading, setLoading] = useState(false);
    const [apiResponse, setApiResponse] = useState(null);
    const [selectedPickupDate, setSelectedPickupDate] = useState(null);
    const [selectedDropoffDate, setSelectedDropoffDate] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [currentDropoffMonth, setCurrentDropoffMonth] = useState(new Date());
    const times = ["9 AM", "10 AM", "11 AM", "12 PM", "2 PM", "3 PM"];
    
    // Get current user data
    const { userData } = useUser();

    // Initialize dates from booking data
    useEffect(() => {
        if (data?.pickup?.date && data?.dropoff?.date) {
            const pickupDate = new Date(data.pickup.date);
            const dropoffDate = new Date(data.dropoff.date);
            
            // Set dates at noon to avoid timezone issues
            pickupDate.setHours(12, 0, 0, 0);
            dropoffDate.setHours(12, 0, 0, 0);
            
            setSelectedPickupDate(pickupDate);
            setSelectedDropoffDate(dropoffDate);
            
            // Set calendar to show dropoff date's month
            setCurrentMonth(dropoffDate);
            setCurrentDropoffMonth(new Date(dropoffDate.getFullYear(), dropoffDate.getMonth() + 1, 1));
            
            // Set initial time from dropoff
            if (data.dropoff.time) {
                setSelectedTime(data.dropoff.time);
            }
        }
    }, [data]);

    // Calendar helper functions
    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const formatMonthYear = (date) => {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const isDateSelected = (day, monthDate) => {
        if (!selectedPickupDate && !selectedDropoffDate) return false;
        
        const currentDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day, 12, 0, 0, 0);
        
        if (selectedPickupDate && selectedDropoffDate) {
            return currentDate.getTime() === selectedPickupDate.getTime() || 
                   currentDate.getTime() === selectedDropoffDate.getTime();
        }
        
        return (selectedPickupDate && currentDate.getTime() === selectedPickupDate.getTime()) ||
               (selectedDropoffDate && currentDate.getTime() === selectedDropoffDate.getTime());
    };

    const isDateInRange = (day, monthDate) => {
        if (!selectedPickupDate || !selectedDropoffDate) return false;
        
        const currentDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day, 12, 0, 0, 0);
        const start = selectedPickupDate < selectedDropoffDate ? selectedPickupDate : selectedDropoffDate;
        const end = selectedPickupDate < selectedDropoffDate ? selectedDropoffDate : selectedPickupDate;
        
        return currentDate >= start && currentDate <= end;
    };

    const handleDateClick = (day, monthDate) => {
        // Create date at noon to avoid timezone issues
        const clickedDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day, 12, 0, 0, 0);
        
        // Store the original dropoff date from booking data
        const originalDropoffDate = data?.dropoff?.date ? new Date(data.dropoff.date) : null;
        if (originalDropoffDate) {
            originalDropoffDate.setHours(12, 0, 0, 0);
        }
        
        // For ModifyDates: pickup is locked, only allow extending dropoff
        if (selectedPickupDate && selectedDropoffDate) {
            // Only allow selecting dates AFTER the CURRENT selected dropoff date
            if (clickedDate > selectedDropoffDate) {
                setSelectedDropoffDate(clickedDate);
            }
        }
    };

    const navigateMonth = (direction, isDropoff = false) => {
        const current = isDropoff ? currentDropoffMonth : currentMonth;
        const setter = isDropoff ? setCurrentDropoffMonth : setCurrentMonth;
        
        const newDate = new Date(current);
        newDate.setMonth(current.getMonth() + direction);
        setter(newDate);
    };

    const renderCalendar = (monthDate) => {
        const daysInMonth = getDaysInMonth(monthDate);
        const firstDay = getFirstDayOfMonth(monthDate);
        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day, 12, 0, 0, 0);
            const isSelected = isDateSelected(day, monthDate);
            const isInRange = isDateInRange(day, monthDate);
            const isToday = new Date().toDateString() === new Date(monthDate.getFullYear(), monthDate.getMonth(), day).toDateString();
            
            // Check if this is the pickup date (should be locked)
            const isPickupDate = selectedPickupDate && currentDate.getTime() === selectedPickupDate.getTime();
            
            // Check if date is before or equal to CURRENT selected dropoff date (should be disabled)
            const isBeforeOrEqualCurrentDropoff = selectedDropoffDate && currentDate <= selectedDropoffDate;
            
            // Date is clickable only if it's after the current dropoff date and not the pickup date
            const isClickable = !isPickupDate && !isBeforeOrEqualCurrentDropoff;
            
            days.push(
                <button
                    key={day}
                    onClick={() => isClickable && handleDateClick(day, monthDate)}
                    disabled={!isClickable}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isPickupDate
                            ? 'bg-green-600 text-white cursor-not-allowed'
                            : isSelected 
                                ? 'bg-gray-800 text-white' 
                                : isInRange 
                                    ? 'bg-gray-100 text-gray-800' 
                                    : isToday
                                        ? 'bg-blue-100 text-blue-600'
                                        : isClickable
                                            ? 'text-gray-600 hover:bg-gray-50 cursor-pointer'
                                            : 'text-gray-400 cursor-not-allowed'
                    }`}
                >
                    {day}
                </button>
            );
        }

        return days;
    };

    // Convert time string to 24-hour format for timestamp
    const convertTo24Hour = (timeStr) => {
        const [time, modifier] = timeStr.split(" ");
        let [hours, minutes] = time.split(":");
        if (!minutes) minutes = "00";
        
        hours = parseInt(hours, 10);
        if (modifier.toUpperCase() === "PM" && hours < 12) {
            hours += 12;
        }
        if (modifier.toUpperCase() === "AM" && hours === 12) {
            hours = 0;
        }
        
        return `${hours.toString().padStart(2, "0")}:${minutes}:00`;
    };

    // Call the change dates API
    const callChangeDatesAPI = async () => {
        if (!selectedDropoffDate || !selectedTime) {
            toast.error("Please select both date and time");
            return;
        }

        try {
            setLoading(true);
            
            // Create timestamp for the new dropoff date
            const timeIn24Hour = convertTo24Hour(selectedTime);
            const newDropOffDate = `${selectedDropoffDate.toISOString().split('T')[0]} ${timeIn24Hour}.000`;
            
            // Get the correct booking ID - should be pureRentalSubscriptionId
            const bookingId = data.originalData?.pureRentalSubscriptionId || 
                             data.originalData?.subscriptionId || 
                             data.originalData?.id ||
                             data.id;
            
            console.log('🔍 Available booking IDs:', {
                regularId: data.id,
                originalDataId: data.originalData?.id,
                subscriptionId: data.originalData?.subscriptionId,
                pureRentalSubscriptionId: data.originalData?.pureRentalSubscriptionId,
                usingId: bookingId
            });

            console.log('🔍 Available vehicle data:', {
                vehicleId: data.originalData?.vehicleId,
                vehicleModel: data.originalData?.vehicleModel,
                vehicleModelId: data.originalData?.vehicleModel?.id,
                fullOriginalData: data.originalData
            });

            console.log('🔍 Available pricing data:', {
                rentalAmount: data.originalData?.rentalAmount,
                lastPaymentAmount: data.originalData?.lastPaymentAmount,
                depositeAmount: data.originalData?.depositeAmount,
                actualDepositAmount: data.originalData?.actualDepositAmount,
                calculatedBasePrice: Math.max(1, data.originalData?.rentalAmount || data.originalData?.lastPaymentAmount || 1),
                calculatedSecurityDeposit: Math.max(1, data.originalData?.depositeAmount || data.originalData?.actualDepositAmount || 1)
            });

            console.log('🔍 Calling change dates API:', {
                bookingId,
                newDropOffDate
            });

            const response = await postAPI(`/vehicle-plan/change-dates/${bookingId}`, {
                newDropOffDate: newDropOffDate
            });

            console.log('🔍 Change dates API response:', response);

            if (response.status === 'success') {
                setApiResponse(response.data);
                setAdditionalAmount(response.data.additionalAmount || 0);
                setDaysDifference(response.data.daysDifference || 0);
                setAmount(response.data.additionalAmount || 0);
                
                // Move to payment step
                setStep(1);
                
                toast.success(response.data.message || "Dates calculated successfully!");
            } else {
                toast.error(response.message || "Failed to calculate new dates");
            }
        } catch (error) {
            console.error('Error calling change dates API:', error);
            toast.error(error.message || "Failed to change dates. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const makePayment = async () => {
        try {
            setLoading(true);
            
            // Get the correct booking ID - should be pureRentalSubscriptionId
            const bookingId = data.originalData?.pureRentalSubscriptionId || 
                             data.originalData?.subscriptionId || 
                             data.originalData?.id ||
                             data.id;
            
            // Construct the handle payment payload for date change
            const paymentPayload = {
                // Required fields from original booking
                userId: userData?.id || data.originalData?.userId,
                vehicleModelId: data.originalData?.vehicleModel?.id || 
                              data.originalData?.vehicleModelId || 
                              data.originalData?.vehicleId || "",
                planId: data.originalData?.planId || "",
                pureRentalSubscriptionId: bookingId,
                
                // Rate plan and dates
                ratePlan: data.originalData?.planType || "daily",
                pickupDate: data.originalData?.pickUpDate?.split('T')[0] || data.pickup?.date,
                pickupTime: data.pickup?.time || "10:00",
                dropoffDate: selectedDropoffDate.toISOString().split('T')[0],
                dropoffTime: selectedTime,
                
                // Pricing information
                duration: daysDifference,
                basePrice: Math.max(1, data.originalData?.rentalAmount || data.originalData?.lastPaymentAmount || 1),
                amount: additionalAmount,
                
                // Location information
                isHomeDelivery: Boolean(data.originalData?.isHomeDelivery || false),
                hubId: data.originalData?.hub?.id || "",
                dropoffLocation: data.originalData?.dropoffLocation || "",
                dropoffAddress: data.originalData?.isHomeDelivery ? 
                    data.originalData?.dropoffLocation || null : 
                    null,
                
                // Date change specific fields
                isDateChange: true,
                bookingId: bookingId,
                dropoffNewDate: `${selectedDropoffDate.toISOString().split('T')[0]} ${convertTo24Hour(selectedTime)}.000`,
                amounToChangeDropOffDate: additionalAmount,
                
                // Optional fields
                taxesAndCharges: 0,
                insuranceCharges: 0,
                securityDeposit: Math.max(1, data.originalData?.depositeAmount || data.originalData?.actualDepositAmount || 1),
                subtotal: additionalAmount,
                bookingNotes: `Date change - extending dropoff to ${selectedDropoffDate.toISOString().split('T')[0]} ${selectedTime}`,
                // GST amount for the additional payment - may need to be calculated based on additionalAmount
                gstPaid: 0 // TODO: Calculate GST based on additionalAmount or retrieve from original booking data
            };

            console.log('🔍 Calling handle payment API for date change:', {
                ...paymentPayload,
                vehicleModelIdCheck: {
                    fromVehicleModel: data.originalData?.vehicleModel?.id,
                    fromVehicleModelId: data.originalData?.vehicleModelId,
                    fromVehicleId: data.originalData?.vehicleId,
                    finalValue: paymentPayload.vehicleModelId
                }
            });

            const response = await postAPI('/vehicle-plan/handle-payment', paymentPayload);

            console.log('🔍 Handle payment API response:', response);

            if (response.status === 'success') {
                console.log('🔍 Handle payment successful, now opening Razorpay...');
                console.log('🔍 Handle payment response data:', response.data);
                
                // Extract order details for Razorpay
                const razorpayOrder = response.data?.razorpayOrder;

                // Simulated payment: skip the real Razorpay modal and simulate success.
                if (SIMULATE_PAYMENT) {
                    await handlePaymentVerification(
                        {
                            razorpay_order_id: razorpayOrder?.id || "order_dummy",
                            razorpay_payment_id: "pay_dummy_" + Date.now(),
                            razorpay_signature: "dummy_signature",
                        },
                        razorpayOrder?.id || "order_dummy"
                    );
                    return;
                }

                if (razorpayOrder) {
                    // Check if Razorpay is loaded
                    if (!window.Razorpay) {
                        throw new Error('Razorpay script not loaded. Please refresh the page.');
                    }
                    
                    // Open Razorpay payment modal
                    const options = {
                      key: razorpayOrder.razorpayKey || RAZORPAY_KEY_ID,
                      amount: razorpayOrder.amount,
                        currency: razorpayOrder.currency,
                        name: 'Blive',
                        description: `Date Change - Additional ₹${additionalAmount}`,
                        order_id: razorpayOrder.id,
                        handler: async function (razorpayResponse) {
                            // Payment successful - now call verify-payment
                            console.log('🔍 Razorpay payment successful:', razorpayResponse);
                            await handlePaymentVerification(razorpayResponse, razorpayOrder.id);
                        },
                        prefill: {
                            name: userData?.firstName + ' ' + userData?.lastName || 'User',
                            email: userData?.email || '',
                            contact: userData?.phoneNumber || ''
                        },
                        theme: {
                            color: '#1B29A9'
                        },
                        modal: {
                            ondismiss: function() {
                                console.log('🔍 Razorpay payment dismissed');
                                setLoading(false);
                                toast.error('Payment cancelled');
                            }
                        }
                    };
                    
                    const razorpay = new window.Razorpay(options);
                    razorpay.open();
                } else {
                    throw new Error('No Razorpay order found in response');
                }
            } else {
                toast.error(response.message || "Payment failed. Please try again.");
            }
        } catch (error) {
            console.error('Error processing payment:', error);
            toast.error(error.message || "Payment failed. Please try again.");
        } finally {
            // Don't set loading false here - wait for payment completion
        }
    };

    // Handle payment verification after Razorpay payment success
    const handlePaymentVerification = async (razorpayResponse, orderId) => {
        try {
            // Build verify payload with actual payment details from Razorpay
            const verifyPayload = {
                userId: userData?.id || data.originalData?.userId || "",
                amount: additionalAmount,
                razorpayOrderId: orderId,
                razorpayPaymentId: razorpayResponse.razorpay_payment_id,
                razorpaySignature: razorpayResponse.razorpay_signature,
                isDateChange: true
            };

            console.log('🔍 Verify payment with actual Razorpay data:', verifyPayload);

            const verifyPaymentResponse = await postAPI('/vehicle-plan/verify-payment', verifyPayload);

            console.log('🔍 Verify payment API response:', verifyPaymentResponse);

            if (verifyPaymentResponse.status === 'success') {
                // Show success popup
                toast.success("🎉 Your drop-off time has been changed successfully!", {
                    duration: 4000,
                    style: {
                        background: '#10B981',
                        color: '#fff',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        padding: '16px 24px',
                        borderRadius: '12px'
                    }
                });
                
                // Call the callback to refresh booking data
                if (onDateChanged && apiResponse) {
                    console.log('🔍 Refreshing booking data after successful payment...');
                    onDateChanged(apiResponse.booking);
                }
                
                // Close the modal after a short delay to show the success message
                setTimeout(() => {
                    setOpenModifyDates(false);
                }, 1500);
            } else {
                toast.error(verifyPaymentResponse.message || "Payment verification failed.");
            }
        } catch (verifyError) {
            console.error('Error verifying payment:', verifyError);
            toast.error(verifyError.message || "Payment verification failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="relative w-[664px] max-h-[700px] rounded-[16px] login-shadow bg-white overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="py-[24px] flex items-center header-shadow px-[32px]">
                <div className="flex flex-1 items-center gap-x-[20px]">
                <div className="flex flex-col">
                    <p className="font-bold text-[24px] text-[#212121]">Modify dates</p>
                </div>
                </div>
                <img
                onClick={() => {
                    setOpenModifyDates(false);
                }}
                className="w-[24px] aspect-square cursor-pointer"
                src="/images/Close.png"
                alt="Close Icon"
                />
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col py-[16px] px-[32px]">
                <p className="font-bold text-[18px] text-[#222222]">Current Dates</p>
                <div className="mt-[16px] bg-[#F7F7F7] py-[16px] px-[24px] rounded-[16px] w-full">
                    <div className='gap-x-[15px] flex items-center'>
                        <div className='flex flex-col'>
                            <p className='text-[11px] text-[#3A3A3A]'>Pick up</p>
                            <p className='font-bold text-[14px] text-[#222222]'>{formattedDate(data?.pickup?.date)} <span className='text-[#646464] text-[12px]'>{data?.pickup?.time || "10 AM"}</span></p>
                        </div>
                        <div className='flex-1 flex items-center gap-x-[10px]'>
                            <span className='h-[1px] flex-1 rounded-[8px] bg-[#D9D9D9]' />
                            <p className='text-[11px] text-[#222222]'>{countDays(data.pickup, data.dropoff)} Days</p>
                            <span className='h-[1px] flex-1 rounded-[8px] bg-[#D9D9D9]' />
                        </div>
                        <div className='flex flex-col'>
                            <p className='text-[11px] text-[#3A3A3A] text-right'>Dropoff</p>
                            <p className='font-bold text-[14px] text-[#222222]'>{formattedDate(step === 1 ? (selectedDropoffDate?.toISOString().split('T')[0] || data?.dropoff?.date) : data?.dropoff?.date)} <span className='text-[#646464] text-[12px]'>{(step === 1 || selectedDropoffDate) ? selectedTime : (data?.dropoff?.time || "10 AM")}</span></p>
                        </div>
                    </div>
                </div>
                {!step && 
                <div className="py-[16px]">
                    <p className="font-bold mt-[24px] text-[18px] text-[#222222]">Select Dates</p>
                    
                    {/* Calendar UI */}
                    <div className="mt-[16px] relative z-10">
                        <div className="grid grid-cols-2 gap-[16px]">
                            {/* Pickup Calendar */}
                            <div className="bg-white rounded-[12px] border border-gray-200 p-[16px] shadow-sm relative z-20">
                                <div className="flex items-center justify-between mb-[16px]">
                                    <button 
                                        onClick={() => navigateMonth(-1, false)}
                                        className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all duration-200"
                                    >
                                        ‹
                                    </button>
                                    <h4 className="text-[14px] font-bold text-black">{formatMonthYear(currentMonth)}</h4>
                                    <button 
                                        onClick={() => navigateMonth(1, false)}
                                        className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all duration-200"
                                    >
                                        ›
                                    </button>
                                </div>
                                
                                {/* Weekdays */}
                                <div className="grid grid-cols-7 gap-1 mb-[6px]">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                        <div key={day} className="text-center text-[10px] text-gray-500 font-medium py-1">
                                            {day}
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Calendar Days */}
                                <div className="grid grid-cols-7 gap-1">
                                    {renderCalendar(currentMonth, false)}
                                </div>
                            </div>

                            {/* Dropoff Calendar */}
                            <div className="bg-white rounded-[12px] border border-gray-200 p-[16px] shadow-sm relative z-20">
                                <div className="flex items-center justify-between mb-[16px]">
                                    <button 
                                        onClick={() => navigateMonth(-1, true)}
                                        className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all duration-200"
                                    >
                                        ‹
                                    </button>
                                    <h4 className="text-[14px] font-bold text-black">{formatMonthYear(currentDropoffMonth)}</h4>
                                    <button 
                                        onClick={() => navigateMonth(1, true)}
                                        className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all duration-200"
                                    >
                                        ›
                                    </button>
                                </div>
                                
                                {/* Weekdays */}
                                <div className="grid grid-cols-7 gap-1 mb-[6px]">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                        <div key={day} className="text-center text-[10px] text-gray-500 font-medium py-1">
                                            {day}
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Calendar Days */}
                                <div className="grid grid-cols-7 gap-1">
                                    {renderCalendar(currentDropoffMonth, true)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Selected Dates Summary */}
                    {(selectedPickupDate || selectedDropoffDate) && (
                        <div className="mt-[16px] p-[12px] bg-gray-50 rounded-[8px]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] text-gray-600 mb-[2px]">Selected Dates</p>
                                    <div className="flex items-center gap-[12px]">
                                        {selectedPickupDate && (
                                            <span className="text-[12px] font-medium text-gray-800">
                                                Pickup: {selectedPickupDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        )}
                                        {selectedDropoffDate && (
                                            <span className="text-[12px] font-medium text-gray-800">
                                                Dropoff: {selectedDropoffDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col flex-1 mt-[24px] relative z-30">
                        <p className="text-[12px] text-[#717171]">Dropoff Time</p>
                        <div className="mt-[4px] gap-x-[12px] flex items-center">
                            <div className="relative flex-1 z-40">
                                <select
                                    value={selectedTime}
                                    onChange={(e) => setSelectedTime(e.target.value)}
                                    className="rounded-[8px] w-full border border-[#EDEDED] outline-none p-[16px] pr-[40px] bg-[#F7F7F7] text-[14px] text-[#222222] appearance-none relative z-50"
                                >
                                    {times.map((time, idx) => (
                                        <option key={idx} value={time}>{time}</option>
                                    ))}
                                </select>
                                <img
                                    src="/images/Chevron-Down.png"
                                    alt="Chevron"
                                    className="pointer-events-none absolute right-[12px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] z-60"
                                />
                            </div>
                        </div>
                    </div>
                </div>}
                {step === 1 && <div className="mt-[24px] mb-[40px] flex flex-col">
                    <p className="font-bold text-[18px] text-[#222222]">Payment Summary</p>
                    {apiResponse && (
                        <div className="mt-[12px] p-[16px] bg-[#F0F9FF] border border-[#BAE6FD] rounded-[8px]">
                            <p className="text-[14px] text-[#0369A1] font-medium">{apiResponse.message}</p>
                        </div>
                    )}
                    <p className="mt-[16px] font-bold text-[14px] text-[#222222]">Price Details</p>
                    <div className="mt-[10px] flex items-center justify-between">
                        <p className="text-[14px] font-medium text-[#3A3A3A]">Extension ({daysDifference} day{daysDifference !== 1 ? 's' : ''})</p>
                        <p className="font-bold text-[14px] text-[#3A3A3A]">₹{additionalAmount}</p>
                    </div>
                    <div className="mt-[8px] flex items-center justify-between border-t border-[#EDEDED] pt-[8px]">
                        <p className="text-[14px] font-bold text-[#222222]">Additional Amount</p>
                        <p className="font-bold text-[16px] text-[#222222]">₹{additionalAmount}</p>
                    </div>
                </div>}
            </div>

            <div className="h-[100px] flex items-center input-shadow-upper px-[32px] gap-x-[16px]">
                <button
                    onClick={() => { 
                        if (!step) callChangeDatesAPI();
                        else makePayment();
                    }}
                    disabled={loading || (!selectedDropoffDate || !selectedTime)}
                    className={`w-full h-[48px] font-bold text-[#FDFDFD] rounded-[24px] py-[13px] px-[24px] ${
                        (selectedDropoffDate && selectedTime && !loading)
                        ? "bg-[#000000] cursor-pointer hover:bg-[#333333]"
                        : "bg-[#CBCBCB] cursor-not-allowed"
                    }`}
                >
                {loading ? "Processing..." : (step ? `Pay ₹${additionalAmount}` : "Calculate New Amount")}
                </button>
            </div>
        </div>
    )
}

export default ModifyDates;