import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../sections/Navbar";
import WhatToExpect from "../components/WhatToExpect";
import { useState, useEffect, useRef } from "react";
import CancellationBar from '../components/CancellationBar';
import CancelPage from '../components/CancelPage';
import ModifyDates from '../components/ModifyDates';
import UploadCard from '../components/UploadCard';
import { getAPI, postAPIMedia } from "../caller/axiosUrls";
import { API_BASE_URL } from "../config/env";
import Loader from "../components/Loader";
import toast from "react-hot-toast";
import { useUser } from "../contexts/UserContext";
import Login from "../components/Login";
import { renewalCadenceLabel } from "../utils/subscription";
import { CalendarClock, Check, ChevronLeft, Clock, Download, Mail, MapPin, Navigation, Phone, Wallet, X } from "lucide-react";
import { franchiseHome } from "../config/franchiseHome";

const BookingDetails = () => {
    const [, setOpenMenu] = useState(false);
    const [openCancelPage, setOpenCancelPage] = useState(false);
    const [openModifyDates, setOpenModifyDates] = useState(false);
    const [bookingData, setBookingData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);
    const [, setUploadedLinks] = useState({});
    const [uploadedFiles, setUploadedFiles] = useState({});
    const [userDocuments, setUserDocuments] = useState([]);
    const [, setDocumentsLoading] = useState(false);
    const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [email, setEmail] = useState("");

    const menuDropdown = useRef(null);
    const { bid } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, userData } = useUser();

    // Function to handle Get Directions
    const handleGetDirections = () => {
        if (!bookingData?.hub?.latitude || !bookingData?.hub?.longitude) {
            toast.error("Hub location coordinates not available");
            return;
        }

        const latitude = bookingData.hub.latitude;
        const longitude = bookingData.hub.longitude;
        const hubName = bookingData.hub.name || "Hub Location";
        
        console.log("🔍 Getting directions to hub:", { latitude, longitude, hubName });
        
        // Open Google Maps with directions to the hub
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
        window.open(mapsUrl, '_blank');
        
        toast.success(`Opening directions to ${hubName}`);
    };

    // Function to handle View Receipt
    const handleViewReceipt = async () => {
        console.log("🔍 View Receipt clicked!");
        console.log("🔍 bookingData:", bookingData);
        
        if (!bookingData) {
            console.log("🔍 No booking data available");
            toast.error("Booking data not available");
            return;
        }

        try {
            setIsDownloadingReceipt(true);
            toast.loading("Generating receipt...", { id: 'receipt-toast' });
            // Get subscription ID from the booking data
            const subscriptionId = bookingData.pureRentalSubscriptionId || 
                                 bookingData.subscriptionId || 
                                 bookingData.id;

            console.log("🔍 Available subscription IDs:", {
                pureRentalSubscriptionId: bookingData.pureRentalSubscriptionId,
                subscriptionId: bookingData.subscriptionId,
                id: bookingData.id,
                finalSubscriptionId: subscriptionId
            });

            if (!subscriptionId) {
                console.log("🔍 No subscription ID found");
                toast.error("Subscription ID not found");
                return;
            }

            console.log("🔍 Generating invoice for subscription ID:", subscriptionId);
            console.log("🔍 API URL:", `/vehicle-plan/generate-invoice/${subscriptionId}`);

            // Make a direct fetch request to handle PDF response
            const response = await fetch(`${API_BASE_URL}/vehicle-plan/generate-invoice/${subscriptionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}` // Add auth header if needed
                },
                body: JSON.stringify({})
            });

            console.log("🔍 Response status:", response.status);
            console.log("🔍 Response headers:", response.headers);

            if (response.ok) {
                console.log("🔍 PDF response received, creating download...");
                
                // Get the PDF blob directly from the response
                const pdfBlob = await response.blob();
                console.log("🔍 PDF blob size:", pdfBlob.size);
                
                // Create download link
                const url = window.URL.createObjectURL(pdfBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `receipt-${subscriptionId}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);

                toast.success("Receipt downloaded successfully!", { id: 'receipt-toast' });
            } else {
                console.log("🔍 API returned error status:", response.status);
                const errorText = await response.text();
                console.log("🔍 Error response:", errorText);
                toast.error("Failed to generate receipt", { id: 'receipt-toast' });
            }
        } catch (error) {
            console.error("🔍 Error generating receipt:", error);
            toast.error(error.message || "Failed to generate receipt", { id: 'receipt-toast' });
        } finally {
            setIsDownloadingReceipt(false);
        }
    };

    // Handle document upload completion
    const handleUploadComplete = (key, link, file = null) => {
        setUploadedLinks((prev) => ({ ...prev, [key]: link }));
        if (file) {
            setUploadedFiles((prev) => ({ ...prev, [key]: file }));
        }
    };

    // Fetch user documents
    const fetchUserDocuments = async () => {
        if (!userData?.id) return;

        try {
            setDocumentsLoading(true);
            const response = await getAPI(
                `/e-kyc/get-documents?userId=${userData.id}`
            );

            if (response.status === "success" && response.data) {
                if (response.data.documents) {
                    setUserDocuments(response.data.documents);
                }
                // Update email from API response if available
                if (response.data.email) {
                    setEmail(response.data.email);
                }
            }
        } catch (error) {
            console.error("Error fetching documents:", error);
            // Don't show error toast as this is background operation
        } finally {
            setDocumentsLoading(false);
        }
    };


    // Upload documents to API
    const uploadDocuments = async () => {
        if (!userData?.id) {
            toast.error("User ID not found. Please login again.");
            return;
        }

        const files = Object.values(uploadedFiles);
        const documentTypes = Object.keys(uploadedFiles);

        // Allow updating even without documents
        try {
            setIsUploadingDocuments(true);

            const formData = new FormData();

            // Add files only if they exist
            if (files.length > 0) {
                files.forEach((file) => {
                    formData.append("files", file);
                });

                // Add document types as array (with [] notation)
                documentTypes.forEach((type) => {
                    formData.append("documentTypes[]", type);
                });
            }

            // Add other required fields
            formData.append("aadhaarNumber", bookingData?.aadhaarNumber || "");
            formData.append("email", email || "");
            formData.append("fullName", bookingData?.fullName || "");

            const response = await postAPIMedia(
                `/e-kyc/upload-documents?userId=${userData.id}`,
                formData
            );

            toast.success("Documents updated successfully!");
            console.log("Upload response:", response);

            // Refresh documents data
            await fetchUserDocuments();

            // Show success modal
            setShowSuccessModal(true);
        } catch (error) {
            console.error("Upload error:", error);
            toast.error(
                error.message || "Failed to upload documents. Please try again."
            );
        } finally {
            setIsUploadingDocuments(false);
        }
    };

    // Fetch booking details from API
    const fetchBookingDetails = async () => {
        if (!bid) {
            setError('No booking ID provided');
            setLoading(false);
            return;
        }

        if (!isAuthenticated) {
            console.log('🔍 Not authenticated, skipping booking details API call');
            setLoading(false);
            setError(null);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            console.log('🔍 Fetching booking details for ID:', bid);
            const response = await getAPI(`/vehicle-plan/booking/${bid}`);
            
            if (response.status === 'success') {
                setBookingData(response.data);
            } else {
                setError(response.message || 'Failed to fetch booking details');
            }
        } catch (err) {
            console.error('Error fetching booking details:', err);
            
            // Check if it's an authentication error
            if (err.statusCode === 401 || err.isAuthError) {
                console.log('🔍 Authentication error detected, letting app handle login redirect');
                setError(null); // Don't show error, auth is handled globally
                setLoading(false);
                return; // Don't set other errors
            } else {
                setError(err.message || 'Failed to load booking details');
                toast.error('Failed to load booking details');
            }
        } finally {
            setLoading(false);
        }
    };

    // Transform API data to component format
    const transformBookingData = (apiData) => {
        if (!apiData) return null;
        
        const pickupDate = new Date(apiData.pickUpDate);
        const dropoffDate = new Date(apiData.dropOffDate);
        
        // Map order status to display status
        const getDisplayStatus = (orderStatus) => {
            switch (orderStatus) {
                case 'upcoming-booking':
                    return 'Upcoming';
                case 'ongoing-booking':
                    return 'Ongoing';
                case 'completed-booking':
                    return 'Past';
                case 'cancelled-booking':
                    return 'Cancelled';
                default:
                    return 'Unknown';
            }
        };

        // Map plan type to display name
        const getPlanDisplayName = (planType) => {
            switch (planType) {
                case 'daily':
                    return 'Daily';
                case 'weekly':
                    return 'Weekly';
                case 'monthly':
                    return 'Monthly';
                default:
                    return planType || 'Daily';
            }
        };

        return {
            refundable: true, // You might want to add this to your API response
            vehicleName: apiData.vehicleModel?.modelName || 'Vehicle',
            bookingId: apiData.bookingId || 'no-booking-id',
            manufacturer: apiData.vehicleModel?.manufacturer || '',
            status: getDisplayStatus(apiData.orderStatus),
            delivery: apiData.isHomeDelivery || false,
            deliveryAddress: apiData.dropOffAddress || "Delivery address not provided",
            hubLocation: apiData.hub?.address || apiData.dropoffLocation || 'Hub Location',
            hubName: apiData.hub?.name || 'Default Hub',
            hubImage: apiData.hub?.image || '/images/Hub.jpg', // Use actual hub image from API
            hubPhone: apiData.hub?.contactNumber || franchiseHome.supportPhone,
            hubEmail: apiData.hub?.contactEmail || franchiseHome.businessEmail,
            hubLatitude: apiData.hub?.latitude || null,
            hubLongitude: apiData.hub?.longitude || null,
            bookingDate: { 
                date: new Date(apiData.createdAt).toISOString().split('T')[0], 
                time: new Date(apiData.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            },
            pickup: { 
                date: pickupDate.toISOString().split('T')[0], 
                time: pickupDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            },
            dropoff: { 
                date: dropoffDate.toISOString().split('T')[0], 
                time: dropoffDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            },
            imgUrl: "/images/Scooter (3).png", // Default image, you might want to get this from vehicleModel
            ratePlan: getPlanDisplayName(apiData.planType),
            rentalMode: apiData.rentalMode || 'fixed',
            subscription: apiData.subscription || null,
            paymentStatus: apiData.lastPaymentAt ? "Completed" : "Pending",
            amountPaid: apiData.lastPaymentAmount || "0",
            refundAmount: apiData.lastPaymentAmount || "0",
            savedAmount: null, // Calculate if you have discount info
            paymentMethodImg: "/images/google-pay.png", // Default payment method image
            paymentMethodName: "Razorpay", // Always show Razorpay
            paymentMethodDetails: "Online Payment",
            specialRequest: "",
            // Additional API data for reference
            originalData: apiData
        };
    };

    const data = transformBookingData(bookingData);

    const countDays = (pickup, dropoff) => {
        try {
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

            if (dropoffDateTime <= pickupDateTime) {
                toast.error("Dropoff date/time must be after pickup date/time");
                return 0;
            }

            const diffMs = dropoffDateTime.getTime() - pickupDateTime.getTime();

            // Convert ms → days (always round up for rentals)
            return (Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
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

    // Fetch booking details on component mount
    useEffect(() => {
        console.log('🔍 BookingDetails useEffect triggered:', { bid, isAuthenticated, userData: !!userData, loading });
        
        // Only try to fetch if authenticated and have bid
        if (isAuthenticated && userData && bid) {
            fetchBookingDetails();
            fetchUserDocuments();
        } else if (!isAuthenticated) {
            // Clear any previous data when not authenticated
            setBookingData(null);
            setError(null);
            setLoading(false);
        }
    }, [bid, isAuthenticated, userData]);

    // Initialize email from userData
    useEffect(() => {
        if (userData?.email) {
            setEmail(userData.email);
        }
    }, [userData]);


    useEffect(() => {
        function handleClickOutside(event) {
        // IDs to ignore
        const ignoreIds = ["menu"];

        // Check if clicked element has any of those IDs or is inside them
        const clickedInsideIgnored = ignoreIds.some((id) =>
            document.getElementById(id)?.contains(event.target)
        );

        if (
            menuDropdown.current &&
            !menuDropdown.current.contains(event.target) &&
            !clickedInsideIgnored
        ) {
            setOpenMenu(false);
        }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // console.log('🔍 BookingDetails DEBUG:', { isAuthenticated, loading }); // Uncomment for debugging

    const { loading: userLoading } = useUser();

    // Show loading screen while checking authentication
    if (userLoading || loading) {
        return (
            <div className="w-full overflow-x-hidden flex flex-col items-center">
                <Navbar onSearchPage={false} expanded={true} />
                <div className="mt-[124px] flex items-center justify-center w-full h-96">
                    <div className="text-center">
                        <Loader />
                        <p className="mt-4 text-gray-600">
                            {userLoading ? "Checking authentication..." : "Loading booking details..."}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Show login screen if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <Login />
            </div>
        );
    }

    // Show error state
    if (error || !data) {
        return (
            <div className="w-full overflow-x-hidden flex flex-col items-center">
                <Navbar onSearchPage={false} expanded={true} />
                <div className="mt-[124px] flex flex-col items-center justify-center w-full h-96">
                    <p className="font-bold text-[22px] text-[#3A3A3A]">Failed to load booking details</p>
                    <p className="mt-[8px] font-medium text-[14px] text-[#6a6a6a]">{error}</p>
                    <button 
                        onClick={fetchBookingDetails}
                        className="mt-4 min-h-[44px] rounded-[10px] bg-[#c44536] px-5 font-bold text-white hover:bg-[#a8392b]"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-hidden flex flex-col items-center">
            {openCancelPage && 
            <div className="fixed z-50 w-screen h-screen top-0 left-0 bg-black/50 flex items-center justify-center">
                <CancelPage 
                    data={data} 
                    setOpenCancelPage={setOpenCancelPage}
                    onBookingCancelled={fetchBookingDetails}
                />
            </div>}
            {openModifyDates && 
            <div className="fixed z-50 w-screen h-screen top-0 left-0 bg-black/50 flex items-center justify-center">
                <ModifyDates 
                    data={data} 
                    setOpenModifyDates={setOpenModifyDates} 
                    formattedDate={formattedDate} 
                    countDays={countDays}
                    onDateChanged={fetchBookingDetails}
                />
            </div>}
            <Navbar onSearchPage={false} expanded={true} />
            {(() => {
                const isSub = data.rentalMode === 'subscription';
                const tone = {
                    Upcoming: "bg-[#c44536] text-white",
                    Ongoing: "bg-[#1f8a4c] text-white",
                    Past: "bg-white/[0.18] text-white",
                    Cancelled: "bg-white/[0.18] text-white",
                }[data.status] || "bg-white/[0.18] text-white";
                const chip = { Upcoming: "Upcoming", Ongoing: "On the road", Past: "Completed", Cancelled: "Cancelled" }[data.status] || data.status;
                const ownModel = String(data.vehicleName || "").toLowerCase().includes(String(franchiseHome.model.brand || "").toLowerCase());
                const art = ownModel ? franchiseHome.model.cutout : data.imgUrl;
                const tripDate = (date) => {
                    if (!date) return "To be confirmed";
                    const d = new Date(`${String(date).slice(0, 10)}T00:00:00`);
                    const part = (o) => d.toLocaleDateString("en-GB", o);
                    const year = d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : "";
                    return `${part({ weekday: "short" })} ${part({ day: "numeric" })} ${part({ month: "short" })}${year}`;
                };
                const days = countDays(data.pickup, data.dropoff);
                const unit = data.subscription?.commitmentUnit || 'month';
                const span = isSub
                    ? `${data.subscription?.commitmentDuration || 1}-${String(unit).replace(/s$/, "")} plan`
                    : `${days} ${days === 1 ? "day" : "days"}`;
                const amount = Number(isSub ? data.subscription?.walletTopUpAmount : data.amountPaid || 0);
                const outlineBtn = "inline-flex min-h-[44px] items-center gap-[8px] rounded-[10px] border-2 border-[#1c1a22] px-[16px] text-[14px] font-bold text-[#1c1a22] transition-colors hover:bg-[#1c1a22] hover:text-white";
                const sectionTitle = "m-0 text-[20px] font-bold text-[#1c1a22]";
                return (
                    <div className="mx-auto mt-[124px] w-full max-w-[1180px] px-4 pb-[56px] pt-[24px] sm:px-6 lg:px-8">
                        <div className="grid gap-[28px] lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
                            <div className="flex min-w-0 flex-col gap-[28px]">
                                {/* Stage: the scooter, status and booking number */}
                                <div className={`sixt-stage relative overflow-hidden rounded-[20px] px-[22px] pb-[18px] pt-[22px] text-white sm:px-[32px] sm:pt-[28px] ${data.status === "Past" || data.status === "Cancelled" ? "grayscale-[0.5]" : ""}`}>
                                    <div className="flex flex-wrap items-start justify-between gap-[12px]">
                                        <div>
                                            <span className={`inline-block rounded-full px-[12px] py-[5px] text-[13px] font-semibold ${tone}`}>{chip}</span>
                                            <h1 className="font-display m-0 mt-[14px] text-[clamp(34px,5vw,52px)] leading-[0.95]">{data.vehicleName}</h1>
                                            <p className="m-0 mt-[8px] text-[15px] text-white/80">
                                                {[data.manufacturer, isSub ? `${renewalCadenceLabel(data.ratePlan)} subscription` : `${data.ratePlan} rental`].filter(Boolean).join(" · ")}
                                            </p>
                                        </div>
                                        <p className="m-0 text-[13px] text-white/70 sm:text-right">
                                            Booking ID
                                            <span className="block text-[15px] font-semibold tabular-nums text-white">{data.bookingId}</span>
                                        </p>
                                    </div>
                                    <div className="relative mx-auto mt-[6px] flex h-[clamp(190px,26vw,280px)] max-w-[560px] items-end justify-center">
                                        <span aria-hidden="true" className="absolute bottom-[4%] left-1/2 h-[9%] w-[72%] -translate-x-1/2 rounded-[50%] bg-black/55 blur-[14px]" />
                                        <img src={art} alt="" className="relative h-full w-full object-contain object-bottom" />
                                    </div>
                                </div>

                                {/* Trip */}
                                <section className="flex flex-col gap-[14px]">
                                    <h2 className={sectionTitle}>{isSub ? 'Subscription schedule' : 'Your trip'}</h2>
                                    <div className="grid grid-cols-2 items-center gap-x-[10px] gap-y-[10px] rounded-[14px] bg-[#f4f3f6] px-[18px] py-[16px] sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                                        <div className="min-w-0">
                                            <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6a6573]">{isSub ? "Starts" : "Pick up"}</p>
                                            <p className="m-0 mt-[4px] whitespace-nowrap text-[17px] font-bold tabular-nums text-[#1c1a22]">{tripDate(data?.pickup?.date)}</p>
                                            <p className="m-0 whitespace-nowrap text-[14px] tabular-nums text-[#5a5562]">{data?.pickup?.time || "10:00 AM"}</p>
                                        </div>
                                        <span className="order-first col-span-2 justify-self-start rounded-full border border-[#dcd9e0] bg-white px-[12px] py-[4px] text-[13px] font-semibold text-[#3d3846] sm:order-none sm:col-span-1 sm:justify-self-center">{span}</span>
                                        <div className="min-w-0 text-right">
                                            <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6a6573]">{isSub ? "Planned until" : "Return"}</p>
                                            <p className="m-0 mt-[4px] whitespace-nowrap text-[17px] font-bold tabular-nums text-[#1c1a22]">{tripDate(data?.dropoff?.date)}</p>
                                            <p className="m-0 whitespace-nowrap text-[14px] tabular-nums text-[#5a5562]">{data?.dropoff?.time || "10:00 AM"}</p>
                                        </div>
                                    </div>
                                    {isSub && (
                                        <div className="flex items-start gap-[12px] rounded-[12px] border border-[#e3e0e8] px-[16px] py-[14px]">
                                            <CalendarClock className="mt-[2px] size-[18px] shrink-0 text-[#1c1a22]" aria-hidden="true" />
                                            <p className="m-0 flex-1 text-[14px] leading-[1.5] text-[#3d3846]">
                                                <span className="block font-bold text-[#1c1a22]">
                                                    ₹{Number(data.subscription?.recurringCharge || 0).toLocaleString('en-IN')} every {unit}, from your wallet
                                                </span>
                                                Renews automatically until {tripDate(data?.dropoff?.date)}. You can extend it later.
                                            </p>
                                        </div>
                                    )}
                                    {(data.status === "Upcoming" || data.status === "Ongoing") && (
                                        <div className="flex flex-wrap gap-[10px]">
                                            {data.rentalMode !== 'subscription' && (
                                                <button type="button" onClick={() => setOpenModifyDates(true)} className={outlineBtn}>
                                                    <CalendarClock className="size-[16px]" aria-hidden="true" />
                                                    {data.status === "Ongoing" ? "Extend rental" : "Change dates"}
                                                </button>
                                            )}
                                            {data.status === "Upcoming" && (
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenCancelPage(true)}
                                                    className="inline-flex min-h-[44px] items-center gap-[8px] rounded-[10px] px-[12px] text-[14px] font-bold text-[#b42318] underline underline-offset-4 hover:text-[#8f1c13]"
                                                >
                                                    <X className="size-[16px]" aria-hidden="true" />
                                                    Cancel booking
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </section>

                                {/* Where */}
                                <section className="flex flex-col gap-[14px]">
                                    <h2 className={sectionTitle}>{data.delivery ? 'Delivery' : 'Pickup hub'}</h2>
                                    <div className="flex flex-col gap-[14px] rounded-[14px] border border-[#e3e0e8] p-[18px] sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex min-w-0 items-start gap-[12px]">
                                            <span className="flex size-[40px] shrink-0 items-center justify-center rounded-full bg-[#fdf0ec] text-[#c44536]">
                                                <MapPin className="size-[19px]" aria-hidden="true" />
                                            </span>
                                            <p className="m-0 min-w-0 text-[14px] leading-[1.5] text-[#5a5562]">
                                                <span className="block text-[16px] font-bold text-[#1c1a22]">{data.delivery ? 'Doorstep delivery' : data.hubName}</span>
                                                {data.delivery ? data.deliveryAddress : data.hubLocation}
                                            </p>
                                        </div>
                                        {!data.delivery && (
                                            <button type="button" onClick={handleGetDirections} className={`${outlineBtn} shrink-0 self-start sm:self-auto`}>
                                                <Navigation className="size-[16px]" aria-hidden="true" />
                                                Directions
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-x-[22px] gap-y-[8px] text-[14px]">
                                        {data.hubPhone && (
                                            <a href={`tel:${String(data.hubPhone).replace(/[^\d+]/g, "")}`} className="inline-flex min-h-[40px] items-center gap-[8px] font-semibold text-[#1c1a22] hover:text-[#c44536]">
                                                <Phone className="size-[16px]" aria-hidden="true" />
                                                {data.hubPhone}
                                            </a>
                                        )}
                                        {data.hubEmail && (
                                            <a href={`mailto:${data.hubEmail}`} className="inline-flex min-h-[40px] items-center gap-[8px] font-semibold text-[#1c1a22] hover:text-[#c44536]">
                                                <Mail className="size-[16px]" aria-hidden="true" />
                                                {data.hubEmail}
                                            </a>
                                        )}
                                    </div>
                                </section>

                                {/* Documents (upcoming only) */}
                                {data.status === "Upcoming" && (
                                    <section className="flex flex-col gap-[14px]" data-document-section>
                                        <div>
                                            <h2 className={sectionTitle}>Get verified before pickup</h2>
                                            <p className="m-0 mt-[4px] text-[14px] text-[#5a5562]">Upload these from your phone. No paperwork at the hub.</p>
                                        </div>
                                        <div className="grid gap-[18px] rounded-[14px] border border-[#e3e0e8] p-[18px]">
                                            <div>
                                                <p className="m-0 text-[14px] font-semibold text-[#1c1a22]">Aadhaar</p>
                                                <div className="mt-[10px] flex flex-wrap gap-[16px]">
                                                    <UploadCard label="Upload Aadhaar" sublabel="(Front)" valueKey="aadhaar-front-bottom" onUploadComplete={handleUploadComplete} uploadedDocument={userDocuments.find((doc) => doc.type === "aadhaar-front-bottom")} />
                                                    <UploadCard label="Upload Aadhaar" sublabel="(Back)" valueKey="aadhaar-back" onUploadComplete={handleUploadComplete} uploadedDocument={userDocuments.find((doc) => doc.type === "aadhaar-back")} />
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-[24px]">
                                                <div>
                                                    <p className="m-0 text-[14px] font-semibold text-[#1c1a22]">Driving licence</p>
                                                    <div className="mt-[10px]">
                                                        <UploadCard label="Upload Driving" sublabel="License" valueKey="driving-licence" onUploadComplete={handleUploadComplete} uploadedDocument={userDocuments.find((doc) => doc.type === "driving-licence")} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="m-0 text-[14px] font-semibold text-[#1c1a22]">Local address proof</p>
                                                    <div className="mt-[10px]">
                                                        <UploadCard label="Upload Local" sublabel="Address Proof" valueKey="local-address-proof" onUploadComplete={handleUploadComplete} uploadedDocument={userDocuments.find((doc) => doc.type === "local-address-proof")} />
                                                    </div>
                                                </div>
                                            </div>
                                            {email && <p className="m-0 text-[13px] text-[#6a6573]">Updates go to {email}</p>}
                                            <button
                                                type="button"
                                                onClick={uploadDocuments}
                                                disabled={isUploadingDocuments}
                                                className="min-h-[48px] justify-self-start rounded-[10px] bg-[#c44536] px-[24px] text-[15px] font-bold text-white transition-colors hover:bg-[#a8392b] disabled:cursor-not-allowed disabled:bg-[#d9d4d2]"
                                            >
                                                {isUploadingDocuments ? "Saving…" : "Save documents"}
                                            </button>
                                        </div>
                                    </section>
                                )}

                                <WhatToExpect
                                    showDropoff={data.rentalMode !== 'subscription'}
                                    rentalMode={data.rentalMode}
                                    commitmentDuration={data.subscription?.commitmentDuration || 1}
                                    commitmentUnit={data.subscription?.commitmentUnit || 'month'}
                                />

                                <section className="flex flex-col gap-[12px]">
                                    <h2 className={sectionTitle}>Cancellation policy</h2>
                                    {data.status === "Ongoing" && <p className="m-0 text-[14px] text-[#3d3846]">Your ride has started, so it can't be cancelled.</p>}
                                    {data.status === "Upcoming" && <>
                                        <p className="m-0 text-[14px] leading-[1.55] text-[#3d3846]">Cancel for free with a full refund up to 48 hours before pickup. After that, the booking can't be refunded.</p>
                                        <div className="py-[24px]">
                                            <CancellationBar bookingDate={data.bookingDate.date} pickupDate={data.pickup.date} />
                                        </div>
                                    </>}
                                    {data.status === "Past" && <p className="m-0 text-[14px] text-[#3d3846]">This ride is complete, so cancellation and refunds don't apply.</p>}
                                    {data.status === "Cancelled" && <p className="m-0 text-[14px] text-[#3d3846]">This booking was cancelled. Any refund due is shown in the payment summary.</p>}
                                </section>
                            </div>

                            {/* Payment summary */}
                            <aside className="flex flex-col gap-[16px] lg:sticky lg:top-[100px]">
                                <div className="rounded-[16px] bg-[#f4f3f6] p-[20px]">
                                    <h2 className="m-0 text-[17px] font-bold text-[#1c1a22]">Payment</h2>
                                    <p className="m-0 mt-[14px] text-[14px] text-[#5a5562]">{isSub ? 'Paid to your wallet' : data.status === "Cancelled" ? 'Amount paid' : 'Total paid'}</p>
                                    <p className="m-0 mt-[2px] text-[34px] font-extrabold tabular-nums text-[#1c1a22]">₹{amount.toLocaleString('en-IN')}</p>
                                    {data.paymentStatus === "Completed" ? (
                                        <span className="mt-[8px] inline-flex items-center gap-[6px] rounded-full bg-[#e3f4ea] px-[10px] py-[4px] text-[13px] font-semibold text-[#1f6b3f]">
                                            <Check className="size-[14px]" aria-hidden="true" />
                                            {isSub ? 'Wallet funded' : 'Paid'}
                                        </span>
                                    ) : (
                                        <span className="mt-[8px] inline-flex items-center gap-[6px] rounded-full bg-[#fdf0ec] px-[10px] py-[4px] text-[13px] font-semibold text-[#a8392b]">
                                            <Clock className="size-[14px]" aria-hidden="true" />
                                            Payment pending
                                        </span>
                                    )}

                                    {isSub && (
                                        <ul className="m-0 mt-[16px] flex list-none flex-col gap-[10px] border-t border-[#e1dfe5] p-0 pt-[14px] text-[14px] text-[#3d3846]">
                                            <li className="flex justify-between gap-[12px]"><span>Starting wallet balance</span><span className="font-bold tabular-nums">₹{Number(data.subscription?.requiredOpeningBalance || 0).toLocaleString('en-IN')}</span></li>
                                            <li className="flex justify-between gap-[12px]"><span>Security deposit</span><span className="font-bold tabular-nums">₹{Number(data.subscription?.securityDeposit || 0).toLocaleString('en-IN')}</span></li>
                                            <li className="flex justify-between gap-[12px]"><span>Whole plan, estimated</span><span className="font-bold tabular-nums">₹{Number(data.subscription?.minimumCommitmentValue || 0).toLocaleString('en-IN')}</span></li>
                                        </ul>
                                    )}

                                    {data.savedAmount && (
                                        <p className="m-0 mt-[14px] rounded-[10px] bg-[#fff4d6] px-[12px] py-[8px] text-[14px] font-semibold text-[#5c4300]">You saved ₹{data.savedAmount} on this booking</p>
                                    )}
                                    {data.refundDate && (
                                        <p className="m-0 mt-[14px] text-[14px] leading-[1.5] text-[#3d3846]">
                                            Refund processed on {formattedDate(data.refundDate.date)}. It reaches your account in 5 to 7 business days.
                                        </p>
                                    )}

                                    {(data.paymentMethodName || data.paymentMethodImg) && (
                                        <div className="mt-[16px] flex items-center gap-[12px] border-t border-[#e1dfe5] pt-[14px]">
                                            {data.paymentMethodImg && <img className="size-[36px] rounded-[8px] bg-white object-contain p-[4px]" src={data.paymentMethodImg} alt="" />}
                                            <p className="m-0 text-[14px] text-[#5a5562]">
                                                <span className="block font-bold text-[#1c1a22]">{data.paymentMethodName}</span>
                                                {data.paymentMethodDetails}
                                            </p>
                                        </div>
                                    )}

                                    <div className="mt-[18px] flex flex-wrap gap-[10px]">
                                        {isSub ? (
                                            <button type="button" onClick={() => navigate('/wallet')} className={outlineBtn}>
                                                <Wallet className="size-[16px]" aria-hidden="true" />
                                                Manage wallet
                                            </button>
                                        ) : (
                                            <button type="button" onClick={handleViewReceipt} disabled={isDownloadingReceipt} className={`${outlineBtn} disabled:cursor-wait disabled:opacity-60`}>
                                                <Download className="size-[16px]" aria-hidden="true" />
                                                {isDownloadingReceipt ? 'Preparing receipt…' : 'Receipt'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="m-0 px-[4px] text-[13px] leading-[1.5] text-[#6a6573]">
                                    Need help? Call {franchiseHome.supportPhone}, any time.
                                </p>
                            </aside>
                        </div>
                    </div>
                );
            })()}

            {/* Success Modal for Document Upload */}
            {showSuccessModal && (
                <div className="fixed z-50 w-screen h-screen top-0 left-0 bg-black/50 flex items-center justify-center">
                    <div className="relative w-[400px] h-[300px] rounded-[16px] bg-white overflow-hidden flex flex-col items-center justify-center">
                        {/* Success Icon */}
                        <div className="w-[80px] h-[80px] bg-[#10B981] rounded-full flex items-center justify-center mb-[24px]">
                            <svg
                                className="w-[40px] h-[40px] text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>

                        {/* Success Message */}
                        <h2 className="font-bold text-[24px] text-[#222222] mb-[8px]">
                            Documents Updated!
                        </h2>
                        <p className="text-[14px] text-[#3A3A3A] text-center mb-[32px] px-[24px]">
                            Your documents have been successfully updated.
                        </p>

                        {/* Close Button */}
                        <button
                            onClick={() => setShowSuccessModal(false)}
                            className="min-h-[44px] rounded-[10px] bg-[#c44536] px-[32px] text-[14px] font-bold text-white transition-colors hover:bg-[#a8392b]"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default BookingDetails;
