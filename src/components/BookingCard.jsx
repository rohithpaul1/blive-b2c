import toast from "react-hot-toast";
import { useState } from "react";
import { API_BASE_URL } from "../config/env";
import { renewalCadenceLabel, startingPeriodLabel } from "../utils/subscription";

const BookingCard = ({ item, tab, onClick }) => {
    const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
    const isSubscription = item.rentalMode === "subscription";
    const commitmentDuration = Number(item.subscription?.commitmentDuration || 1);
    const startingPeriod = startingPeriodLabel(item.planType, commitmentDuration);
    // Function to handle Get Directions
    const handleGetDirections = (e) => {
        e.stopPropagation(); // Prevent card click
        
        if (!item?.hub?.latitude || !item?.hub?.longitude) {
            toast.error("Hub location coordinates not available");
            return;
        }

        const latitude = item.hub.latitude;
        const longitude = item.hub.longitude;
        const hubName = item.hub.name || "Hub Location";
        
        // Open Google Maps with directions to the hub
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
        window.open(mapsUrl, '_blank');
        
        toast.success(`Opening directions to ${hubName}`);
    };

    // Function to handle View Receipt
    const handleViewReceipt = async (e) => {
        e.stopPropagation(); // Prevent card click
        
        if (!item) {
            toast.error("Booking data not available");
            return;
        }

        try {
            // Get subscription ID from the booking data
            const subscriptionId = item.id;

            if (!subscriptionId) {
                toast.error("Subscription ID not found");
                return;
            }

            setIsDownloadingInvoice(true);
            toast.loading("Generating invoice...", { id: 'invoice-toast' });

            // Make a direct fetch request to handle PDF response
            const response = await fetch(`${API_BASE_URL}/vehicle-plan/generate-invoice/${subscriptionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({})
            });

            if (response.ok) {
                // Get the PDF blob directly from the response
                const pdfBlob = await response.blob();
                
                // Create download link
                const url = window.URL.createObjectURL(pdfBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `receipt-${subscriptionId}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);

                toast.success("Receipt downloaded successfully!", { id: 'invoice-toast' });
            } else {
                const errorText = await response.text();
                console.error("Error response:", errorText);
                toast.error("Failed to generate receipt", { id: 'invoice-toast' });
            }
        } catch (error) {
            console.error("Error generating receipt:", error);
            toast.error(error.message || "Failed to generate receipt", { id: 'invoice-toast' });
        } finally {
            setIsDownloadingInvoice(false);
        }
    };

    const countDays = (pickup, dropoff) => {
        try {
            // Check if dates exist
            if (!pickup?.date || !dropoff?.date) {
                return 0;
            }
            
            // Normalize to YYYY-MM-DD
            const pickupDateStr = new Date(pickup.date).toISOString().split("T")[0];
            const dropoffDateStr = new Date(dropoff.date).toISOString().split("T")[0];

            // Convert "10 AM" / "3 PM" → "HH:mm"
            const parseTime = (timeStr) => {
                const [time, modifier] = timeStr.split(" ");
                let [hours, minutes] = time.split(":");
                if (!minutes) minutes = "00"; // default

                hours = parseInt(hours, 10);
                if (modifier.toUpperCase() === "PM" && hours < 12) {
                    hours += 12;
                }
                if (modifier.toUpperCase() === "AM" && hours === 12) {
                    hours = 0;
                }

                return `${hours.toString().padStart(2, "0")}:${minutes}`;
            };

            const pickupDateTime = new Date(`${pickupDateStr}T${parseTime(pickup?.time || "10 AM")}`);
            const dropoffDateTime = new Date(`${dropoffDateStr}T${parseTime(dropoff?.time || "10 AM")}`);

            if (isNaN(pickupDateTime) || isNaN(dropoffDateTime)) {
                throw new Error("Invalid pickup or dropoff date/time format");
            }

            // Check if it's the same date
            if (pickupDateStr === dropoffDateStr) {
                // Same day rental - always count as 1 day minimum
                return 1;
            }

            if (dropoffDateTime <= pickupDateTime) {
                toast.error("Dropoff date/time must be after pickup date/time");
                return 0;
            }

            const diffMs = dropoffDateTime.getTime() - pickupDateTime.getTime();

            // Convert ms → days (always round up for rentals)
            const calculatedDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            
            // Ensure minimum 1 day for any rental
            return Math.max(1, calculatedDays);
        } catch (err) {
            console.error("countDays error:", err);
            toast.error("Could not calculate rental days");
            return 0;
        }
    };

    const formattedDate = (date) => {
        if (!date) return "No date selected";
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",  // "Aug"
            day: "numeric",  // "23"
            year: "numeric", // "2025"
        })
    };

    const handleCardClick = (e) => {
        // Don't trigger card navigation if clicking on buttons
        if (e.target.closest('button')) {
            return;
        }
        
        if (onClick) {
            onClick(item);
        }
    };

    return (
        <div 
            key={item.id} 
            onClick={handleCardClick}
            className="flex w-full max-w-[1040px] cursor-pointer flex-col overflow-hidden rounded-[20px] border border-[#eceaec] bg-white shadow-[0_6px_20px_rgba(16,24,40,0.08)] transition-shadow hover:shadow-lg md:min-h-[260px] md:flex-row"
        >
            <div className="relative h-[210px] w-full overflow-hidden md:h-auto md:min-h-[260px] md:w-[35%]">
                <img src={item.brandLogo || item.imgUrl} alt="Vehicle Image" className="w-full h-full scale-110 object-cover" />
            </div>
            <div className="flex w-full flex-col px-[16px] py-[22px] sm:px-[24px] md:py-[28px]">
                <div className="flex items-center justify-between px-[8px] sm:px-[16px]">
                    <div className="flex flex-col">
                        <p className="font-bold text-[22px] text-[#222222]">{item.vehicleName}</p>
                        {item.manufacturer && (
                            <p className="text-[14px] text-[#717171] mt-[2px]">{item.manufacturer}</p>
                        )}
                        {item.planType && (
                            <p className="text-[12px] text-[#1B29A9] mt-[2px] font-medium capitalize">
                                {isSubscription ? `${item.planType} subscription` : `${item.planType} plan`}
                            </p>
                        )}
                    </div>
                    <img src="/images/MenuDot.png" alt="Menu Dot" className="w-[24px] h-[24px]" />
                </div>
                <div className="mt-[8px] flex items-center gap-x-[24px] px-[8px] sm:px-[16px]">
                    {tab === "Past" && <div className="flex items-center gap-x-[8px]">
                        <img className="w-[24px] h-[24px]" src="/images/Dropoff.png" alt="Dropoff Icon" />
                        <p className="font-medium text-[12px] text-[#222222]">Dropped off at {item.dropoffLocation || "Location"}</p>
                    </div>}
                    {tab === "Cancelled" && <div className="flex items-center gap-x-[8px]">
                        <img className="w-[24px] h-[24px]" src="/images/Refund.png" alt="Refund Icon" />
                        <p className="font-medium text-[12px] text-[#222222]">Refund initiated</p>
                    </div>}
                    {tab === "Upcoming" && <div className="flex items-center gap-x-[8px]">
                        <img className="w-[24px] h-[24px]" src="/images/Watch.png" alt="Time Icon" />
                        <p className="font-medium text-[12px] text-[#222222]">
                            {(() => {
                                if (!item.pickup?.date) return "Pickup date not available";
                                
                                const pickupDate = new Date(item.pickup.date);
                                const today = new Date();
                                const diffTime = pickupDate.getTime() - today.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                
                                if (diffDays < 0) return "Pickup date has passed";
                                if (diffDays === 0) return "Pickup today";
                                if (diffDays === 1) return "Pickup tomorrow";
                                return `Pickup in ${diffDays} days`;
                            })()}
                        </p>
                    </div>}
                    {(tab === "Past" || tab === "Cancelled") && <div className="flex items-center gap-x-[8px]">
                        <img className="w-[24px] h-[24px]" src="/images/Watch.png" alt="Time Icon" />
                        <p className="font-medium text-[12px] text-[#222222]">
                            {tab === "Past" ? 
                                ("Completed " + formattedDate(item.dropoff?.date || item.pickup?.date) + " - " + (item.dropoff?.time || item.pickup?.time || "N/A")) : 
                                ("Cancelled on " + formattedDate(item.cancelled?.date || item.pickup?.date) + " - " + (item.cancelled?.time || item.pickup?.time || "N/A"))
                            }
                        </p>
                    </div>}
                </div>
                <span className="w-full mt-[16px] flex-1 h-[1px] border-b border-dashed border-[#D9D9D9]"/>
                <div className="mt-[16px] flex flex-col gap-[16px] px-[8px] sm:px-[16px] md:min-h-[56px] md:flex-row md:items-center md:justify-between">
                    <div className='grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-[8px] sm:gap-x-[15px]'>
                        <div className='flex flex-col'>
                            <p className='text-[16px] font-bold text-[#222222] sm:text-[18px]'>{formattedDate(item.pickup?.date || '')} <span className='block text-[13px] text-[#222222B2] sm:inline sm:text-[14px]'>{item.pickup?.time || 'N/A'}</span></p>
                        </div>
                        <div className='flex items-center gap-x-[10px]'>
                            <span className='hidden h-[1px] w-8 rounded-[8px] bg-[#D9D9D9] sm:block' />
                            <p className='max-w-[84px] text-center text-[11px] text-[#222222]'>
                                {isSubscription ? `${startingPeriod} planned` : `${countDays(item.pickup || {}, item.dropoff || {})} Days`}
                            </p>
                            <span className='hidden h-[1px] w-8 rounded-[8px] bg-[#D9D9D9] sm:block' />
                        </div>
                        <div className='flex min-w-0 flex-col items-end text-right'>
                            <p className='text-[16px] font-bold text-[#222222] sm:text-[18px]'>{formattedDate(item.dropoff?.date || '')} <span className='block text-[13px] text-[#222222B2] sm:inline sm:text-[14px]'>{item.dropoff?.time || 'N/A'}</span></p>
                            {isSubscription && <p className="text-[11px] text-[#717171]">Planned until</p>}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-[24px] text-[#222222]">₹{Number(isSubscription ? item.subscription?.recurringCharge : item.price || 0).toLocaleString("en-IN")}</p>
                        {isSubscription && (
                            <p className="text-[11px] text-[#717171]">
                                Renews {renewalCadenceLabel(item.planType)}
                                {item.subscription?.nextBillingAt ? ` · next ${new Date(item.subscription.nextBillingAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}
                            </p>
                        )}
                    </div>
                </div>
                <div className="mt-[16px] flex flex-wrap items-center gap-[12px] px-[8px] sm:px-[16px]">
                    {tab === "Ongoing" && <button 
                        onClick={handleGetDirections}
                        className="cursor-pointer h-[40px] border py-[6px] px-[16px] border-[#D9D9D9] rounded-[24px] flex items-center gap-x-[8px] hover:bg-gray-50 transition-colors"
                    >
                        <img className="w-[20px] h-[20px]" src="/images/Directions.png" alt="Directions Image" />
                        <p className="font-medium text-[12px] text-[#3A3A3A]">Get Directions to Dropoff</p>
                    </button>}
                    

                    {(tab === "Past") && <button 
                        onClick={handleViewReceipt}
                        disabled={isDownloadingInvoice}
                        className={`h-[40px] border py-[6px] px-[16px] border-[#D9D9D9] rounded-[24px] flex items-center gap-x-[8px] transition-colors ${
                            isDownloadingInvoice 
                                ? 'cursor-not-allowed bg-gray-100' 
                                : 'cursor-pointer hover:bg-gray-50'
                        }`}
                    >
                        {isDownloadingInvoice ? (
                            <>
                                <div className="w-[20px] h-[20px] border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                <p className="font-medium text-[12px] text-[#3A3A3A]">Generating...</p>
                            </>
                        ) : (
                            <>
                                <img className="w-[20px] h-[20px]" src="/images/Invoice.png" alt="Invoice Image" />
                                <p className="font-medium text-[12px] text-[#3A3A3A]">Download Invoice</p>
                            </>
                        )}
                    </button>}
                </div>
            </div>
        </div>
    )
}

export default BookingCard;
