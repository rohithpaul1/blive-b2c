import toast from "react-hot-toast";
import { useState } from "react";
import { API_BASE_URL } from "../config/env";
import { renewalCadenceLabel, startingPeriodLabel } from "../utils/subscription";
import { Clock, Download, MapPin, Navigation, RotateCcw } from "lucide-react";
import { franchiseHome } from "../config/franchiseHome";

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

            if (dropoffDateTime <= pickupDateTime) return 0;

            const diffMs = dropoffDateTime.getTime() - pickupDateTime.getTime();

            // Convert ms → days (always round up for rentals)
            const calculatedDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            
            // Ensure minimum 1 day for any rental
            return Math.max(1, calculatedDays);
        } catch (err) {
            console.error("countDays error:", err);
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

    // Status line for the stage chip and the info row.
    const statusLine = (() => {
        if (tab === "Upcoming") {
            if (!item.pickup?.date) return "Pickup date to be confirmed";
            const pickupDay = new Date(`${item.pickup.date}T00:00:00`);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diffDays = Math.round((pickupDay - today) / 86400000);
            if (diffDays < 0) return "Pickup date has passed";
            if (diffDays === 0) return `Pickup today, ${item.pickup.time}`;
            if (diffDays === 1) return `Pickup tomorrow, ${item.pickup.time}`;
            return `Pickup in ${diffDays} days`;
        }
        if (tab === "Ongoing") return `Return by ${formattedDate(item.dropoff?.date)}, ${item.dropoff?.time || ""}`;
        if (tab === "Past") return `Returned ${formattedDate(item.dropoff?.date)}`;
        return `Cancelled ${formattedDate(item.cancelled?.date || item.pickup?.date)}`;
    })();
    const chip = { Upcoming: "Upcoming", Ongoing: "On the road", Past: "Completed", Cancelled: "Cancelled" }[tab] || tab;
    const chipTone =
        tab === "Ongoing" ? "bg-[#1f8a4c] text-white"
        : tab === "Upcoming" ? "bg-[#c44536] text-white"
        : "bg-white/[0.18] text-white";

    // The franchise's own model gets its cut-out on the stage; anything else shows its photo.
    const ownModel = String(item.vehicleName || "").toLowerCase().includes(String(franchiseHome.model.brand || "").toLowerCase());
    const art = ownModel ? franchiseHome.model.cutout : item.brandLogo || item.imgUrl;
    const isCutout = /\.png($|\?)/i.test(String(art || ""));

    // Trip box dates: "Mon, 2 Nov", with the year only when it isn't this year.
    const tripDate = (date) => {
        if (!date) return "To be confirmed";
        const d = new Date(`${String(date).slice(0, 10)}T00:00:00`);
        const part = (o) => d.toLocaleDateString("en-GB", o);
        const year = d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : "";
        return `${part({ weekday: "short" })} ${part({ day: "numeric" })} ${part({ month: "short" })}${year}`;
    };
    const days = countDays(item.pickup || {}, item.dropoff || {});
    const span = isSubscription
        ? `${commitmentDuration}-${startingPeriod.replace(/^\d+\s*/, "").replace(/s$/, "")} plan`
        : `${days} ${days === 1 ? "day" : "days"}`;
    const planText = item.planType ? (isSubscription ? `${renewalCadenceLabel(item.planType)} subscription` : `${item.planType} rental`) : "";
    const byline = [item.manufacturer, planText].filter(Boolean).join(" · ");
    const place = item.isHomeDelivery ? item.dropoffLocation : item.hub?.name || item.dropoffLocation;
    const amount = Number(isSubscription ? item.subscription?.recurringCharge : item.price || 0);
    const amountLabel = isSubscription ? `per ${String(item.planType || "").replace(/ly$/, "") || "cycle"}` : tab === "Cancelled" ? "Refund on its way" : "Paid";
    const canDirect = (tab === "Upcoming" || tab === "Ongoing") && item?.hub?.latitude && item?.hub?.longitude;

    return (
        <div
            key={item.id}
            onClick={handleCardClick}
            className="grid w-full max-w-[1040px] cursor-pointer overflow-hidden rounded-[20px] border border-[#e3e0e8] bg-white transition-shadow hover:shadow-[0_10px_28px_rgba(16,24,40,0.10)] md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]"
        >
            <div className={`sixt-stage relative flex min-h-[210px] items-end justify-center px-[20px] pb-[14px] pt-[48px] ${tab === "Past" || tab === "Cancelled" ? "grayscale-[0.6]" : ""}`}>
                <span className={`absolute left-[16px] top-[16px] rounded-full px-[12px] py-[5px] text-[13px] font-semibold ${chipTone}`}>{chip}</span>
                {isCutout ? (
                    <div className="relative flex h-[170px] w-full items-end justify-center md:h-[190px]">
                        <span aria-hidden="true" className="absolute bottom-[4%] left-1/2 h-[9%] w-[72%] -translate-x-1/2 rounded-[50%] bg-black/55 blur-[12px]" />
                        <img src={art} alt="" className="relative h-full w-full object-contain object-bottom" />
                    </div>
                ) : (
                    <img src={art} alt="" className="h-[180px] w-full object-cover [mask-image:radial-gradient(ellipse_62%_58%_at_50%_52%,#000_45%,transparent_100%)]" />
                )}
            </div>

            <div className="flex min-w-0 flex-col gap-[18px] px-[20px] py-[20px] sm:px-[28px] sm:py-[24px]">
                <div>
                    <p className="font-display m-0 text-[30px] leading-none text-[#0f0d16]">{item.vehicleName}</p>
                    {byline && <p className="m-0 mt-[8px] text-[15px] capitalize text-[#5a5562]">{byline}</p>}
                    <div className="mt-[12px] flex flex-wrap gap-x-[20px] gap-y-[8px] text-[14px] text-[#3d3846]">
                        <span className="inline-flex items-center gap-[6px] font-semibold text-[#1c1a22]">
                            <Clock className="size-[16px]" aria-hidden="true" />
                            {statusLine}
                        </span>
                        {place && (
                            <span className="inline-flex items-center gap-[6px]">
                                <MapPin className="size-[16px]" aria-hidden="true" />
                                {item.isHomeDelivery ? place : `${tab === "Past" || tab === "Ongoing" ? "Picked up at" : "Pick up at"} ${place}`}
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 items-center gap-x-[10px] gap-y-[10px] rounded-[14px] sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] bg-[#f4f3f6] px-[16px] py-[14px]">
                    <div className="min-w-0">
                        <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6a6573]">{isSubscription ? "Starts" : "Pick up"}</p>
                        <p className="m-0 mt-[4px] whitespace-nowrap text-[16px] font-bold tabular-nums text-[#1c1a22] sm:text-[17px]">{tripDate(item.pickup?.date)}</p>
                        <p className="m-0 whitespace-nowrap text-[14px] tabular-nums text-[#5a5562]">{item.pickup?.time || ""}</p>
                    </div>
                    <span className="order-first col-span-2 justify-self-start rounded-full border border-[#dcd9e0] bg-white px-[12px] py-[4px] text-[13px] font-semibold text-[#3d3846] sm:order-none sm:col-span-1 sm:justify-self-center">{span}</span>
                    <div className="min-w-0 text-right">
                        <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6a6573]">{isSubscription ? "Planned until" : "Return"}</p>
                        <p className="m-0 mt-[4px] whitespace-nowrap text-[16px] font-bold tabular-nums text-[#1c1a22] sm:text-[17px]">{tripDate(item.dropoff?.date)}</p>
                        <p className="m-0 whitespace-nowrap text-[14px] tabular-nums text-[#5a5562]">{item.dropoff?.time || ""}</p>
                    </div>
                </div>

                <div className="mt-auto flex flex-wrap items-end justify-between gap-[14px]">
                    <p className="m-0">
                        <span className="text-[28px] font-extrabold tabular-nums text-[#1c1a22]">₹{amount.toLocaleString("en-IN")}</span>
                        <span className="ml-[8px] text-[14px] text-[#5a5562]">{amountLabel}</span>
                        {isSubscription && item.subscription?.nextBillingAt && (
                            <span className="block text-[13px] text-[#6a6573]">
                                Next bill {new Date(item.subscription.nextBillingAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </span>
                        )}
                    </p>
                    <div className="flex flex-wrap gap-[10px]">
                        {canDirect && (
                            <button
                                type="button"
                                onClick={handleGetDirections}
                                className="inline-flex min-h-[44px] items-center gap-[8px] rounded-[10px] border-2 border-[#1c1a22] px-[16px] text-[14px] font-bold text-[#1c1a22] transition-colors hover:bg-[#1c1a22] hover:text-white"
                            >
                                <Navigation className="size-[16px]" aria-hidden="true" />
                                Directions to hub
                            </button>
                        )}
                        {tab === "Past" && (
                            <button
                                type="button"
                                onClick={handleViewReceipt}
                                disabled={isDownloadingInvoice}
                                className="inline-flex min-h-[44px] items-center gap-[8px] rounded-[10px] border-2 border-[#1c1a22] px-[16px] text-[14px] font-bold text-[#1c1a22] transition-colors hover:bg-[#1c1a22] hover:text-white disabled:cursor-wait disabled:opacity-60"
                            >
                                <Download className="size-[16px]" aria-hidden="true" />
                                {isDownloadingInvoice ? "Preparing invoice…" : "Invoice"}
                            </button>
                        )}
                        {(tab === "Past" || tab === "Cancelled") && (
                            <a
                                href="/search"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex min-h-[44px] items-center gap-[8px] rounded-[10px] bg-[#c44536] px-[16px] text-[14px] font-bold text-white transition-colors hover:bg-[#a8392b]"
                            >
                                <RotateCcw className="size-[16px]" aria-hidden="true" />
                                Ride again
                            </a>
                        )}
                        <span className="hidden min-h-[44px] items-center px-[4px] text-[14px] font-bold text-[#1c1a22] underline underline-offset-4 sm:inline-flex">View details</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BookingCard;
