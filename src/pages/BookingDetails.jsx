import { useParams } from "react-router-dom";
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

const BookingDetails = () => {
    const [openMenu, setOpenMenu] = useState(false);
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
            hubPhone: apiData.hub?.contactNumber || '+91 7569546222',
            hubEmail: apiData.hub?.contactEmail || 'support@hub.com',
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
                    <p className="mt-[8px] font-medium text-[14px] text-[#969696]">{error}</p>
                    <button 
                        onClick={fetchBookingDetails}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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
            <div className="mt-[124px] flex items-center w-full border-y border-[#EDEDED] py-[24px] px-[40px] gap-x-[16px]">
                <p className="font-bold text-[28px] text-[#222222]">Booking details</p>
            </div>
            <div className="w-[80%] p-[32px] flex flex-col" >
                <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                        <p className="font-medium text-[14px] text-[#222222]">Booking Confirmation ID: {data.bookingId}</p>
                        <p className="font-bold text-[28px] text-[#222222]">{data.vehicleName}</p>
                    </div>
                    <div className="flex items-center gap-x-[14px]">
                        {data.status === "Ongoing" && <div className="flex items-center gap-x-[10px] rounded-[8px] py-[6px] px-[12px] bg-[#E3F9E9]">
                            <img className="w-[20px] h-[20px]" src="/images/Ongoing.png" alt="Ongoing Image" />
                            <p className="font-bold text-[#1C7E4A]">Ongoing</p>
                        </div>}
                        {data.status === "Upcoming" && <div className="flex items-center gap-x-[10px] rounded-[8px] py-[6px] px-[12px] bg-[#EDEDED]">
                            <p className="font-bold text-[#3A3A3A]">Upcoming</p>
                        </div>}
                        {data.status === "Past" && <div className="flex items-center gap-x-[10px] rounded-[8px] py-[6px] px-[12px] bg-[#EDEDED]">
                            <p className="font-bold text-[#3A3A3A]">Past</p>
                        </div>}
                        {data.status === "Cancelled" && <div className="flex items-center gap-x-[10px] rounded-[8px] py-[6px] px-[12px] bg-[#F3D8D8]">
                            <p className="font-bold text-[#370000]">Cancelled</p>
                        </div>}
                        <div className="relative">
                            <img id="menu" onClick={() => setOpenMenu(!openMenu)} className="p-[6px] cursor-pointer" src="/images/MenuDot.png" alt="Menu Dot Image" />
                            <div ref={menuDropdown} className={`absolute duration-500 transition-all right-0 z-30 w-[325px] overflow-hidden mt-[20px] ${openMenu ? "py-[16px] max-h-[1000px]" : "py-0 max-h-0"} flex flex-col bg-white rounded-[16px] calender-shadow`}>
                                <button onClick={() => {
                                    handleViewReceipt();
                                    setOpenMenu(false);
                                }} className="font-medium cursor-pointer text-[#222222] py-[16px] px-[32px] hover:bg-gray-200 text-left">View Receipt</button>
                                {data.status === "Upcoming" && <>
                                    <button onClick={() => setOpenModifyDates(true)} className="font-medium cursor-pointer text-[#222222] py-[16px] px-[32px] hover:bg-gray-200 text-left">Modify Booking Dates</button>
                                    {/* <button className="font-medium cursor-pointer text-[#222222] py-[16px] px-[32px] hover:bg-gray-200 text-left">Modify Add-ons</button> */}
                                    <button onClick={() => setOpenCancelPage(true)} className="font-medium cursor-pointer text-[#FE7171] py-[16px] px-[32px] hover:bg-gray-200 text-left">Cancel Booking</button>
                                </>}
                                {data.status !== "Upcoming" && <button onClick={() => setOpenModifyDates(true)} className="font-medium cursor-pointer text-[#222222] py-[16px] px-[32px] hover:bg-gray-200 text-left">Extend Rental</button>}
                            </div> 
                        </div>
                    </div>
                </div>
                <div className="mt-[24px]">
                    <div className="relative w-full h-[300px] overflow-hidden rounded-[16px]">
                        <div className="absolute w-full h-full bg-[#3D3D3D52] z-20" />
                        <img src={data.hubImage} alt="Hub Image" className="w-full h-full object-cover" />
                    </div>
                    <div className="mt-[8px] flex items-center gap-x-[18px]">
                        <div className="flex gap-x-[4px] items-center">
                            <img className="w-[24px] h-[24px]" src="/images/Location.png" alt="Location Image" />
                            <p className="font-medium text-[14px] text-[#3A3A3A]">
                                {data.delivery ? 'Hub Location: ' : ''}{data.hubLocation}
                            </p>
                        </div>
                        {!data.delivery && <button onClick={handleGetDirections} className="font-medium text-[14px] text-[#1B29A9] cursor-pointer">Get Directions</button>}
                    </div>
                </div>

         

                {/* Document Upload Section - Only for Upcoming Bookings */}
                {data.status === "Upcoming" && (
                    <div className="mt-[32px]" data-document-section>
                        <div className="flex items-center gap-x-[10px]">
                            <p className="font-medium text-[18px] text-[#222222]">
                                Customer Documents
                            </p>
                            <span className="h-[1px] flex-1 bg-[#D9D9D9] rounded-[8px]" />
                        </div>
                        
                        <div className="mt-[16px]">
                            <p className="text-[12px] text-[#717171]">Email</p>
                            <input
                                value={email}
                                disabled={true}
                                type="email"
                                className="mt-[4px] w-full rounded-[8px] outline-none border p-[16px] h-[48px] bg-gray-100 border-[#EDEDED] text-[14px] text-[#666666] cursor-not-allowed"
                                placeholder="Email will be updated after document upload"
                            />
                        </div>
                        
                        <div className="mt-[16px]">
                            <p className="text-[12px] text-[#717171]">
                                Upload Aadhaar
                            </p>
                            <div className="flex mt-[16px] gap-x-[24px]">
                                <UploadCard
                                    label="Upload Aadhaar"
                                    sublabel="(Front)"
                                    valueKey="aadhaar-front-bottom"
                                    onUploadComplete={handleUploadComplete}
                                    uploadedDocument={userDocuments.find(
                                        (doc) => doc.type === "aadhaar-front-bottom"
                                    )}
                                />
                                <UploadCard
                                    label="Upload Aadhaar"
                                    sublabel="(Back)"
                                    valueKey="aadhaar-back"
                                    onUploadComplete={handleUploadComplete}
                                    uploadedDocument={userDocuments.find(
                                        (doc) => doc.type === "aadhaar-back"
                                    )}
                                />
                            </div>
                        </div>
                        <div className="mt-[16px]">
                            <p className="text-[12px] text-[#717171]">
                                Upload Driving License
                            </p>
                            <div className="flex mt-[16px] gap-x-[24px]">
                                <UploadCard
                                    label="Upload Driving"
                                    sublabel="License"
                                    valueKey="driving-licence"
                                    onUploadComplete={handleUploadComplete}
                                    uploadedDocument={userDocuments.find(
                                        (doc) => doc.type === "driving-licence"
                                    )}
                                />
                            </div>
                        </div>
                        <div className="mt-[16px]">
                            <p className="text-[12px] text-[#717171]">
                                Upload Local Address Proof
                            </p>
                            <div className="flex mt-[16px] gap-x-[24px]">
                                <UploadCard
                                    label="Upload Local"
                                    sublabel="Address Proof"
                                    valueKey="local-address-proof"
                                    onUploadComplete={handleUploadComplete}
                                    uploadedDocument={userDocuments.find(
                                        (doc) => doc.type === "local-address-proof"
                                    )}
                                />
                            </div>
                        </div>

                        <div className="mt-[24px] flex justify-center">
                            <button
                                onClick={uploadDocuments}
                                disabled={isUploadingDocuments}
                                className={`h-[48px] font-medium text-[#FDFDFD] rounded-[24px] py-[13px] px-[24px] ${
                                    isUploadingDocuments
                                        ? "bg-[#CBCBCB] text-[#666666] cursor-not-allowed"
                                        : "bg-[#000000] cursor-pointer hover:bg-[#333333] transition-colors"
                                }`}
                            >
                                {isUploadingDocuments ? "Updating..." : "Update Documents"}
                            </button>
                        </div>
                    </div>
                )}
                <div className="mt-[36px]">
                    <p className="font-bold text-[24px] text-[#222222]">Rental Duration</p>
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
                                <p className='font-bold text-[14px] text-[#222222]'>{formattedDate(data?.dropoff?.date)} <span className='text-[#646464] text-[12px]'>{data?.dropoff?.time || "10 AM"}</span></p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-[16px] flex items-center gap-x-[16px]">
                    {data.status === "Ongoing" && <button onClick={() => setOpenModifyDates(true)} className="cursor-pointer h-[40px] border py-[6px] px-[16px] border-[#D9D9D9] rounded-[24px] flex items-center gap-x-[8px]">
                        <img className="w-[20px] h-[20px]" src="/images/Extend.png" alt="Extend Image" />
                        <p className="font-medium text-[12px] text-[#3A3A3A]">Extend Rental</p>
                    </button>}
                    {data.status === "Upcoming" && <button onClick={() => setOpenModifyDates(true)} className="cursor-pointer h-[40px] border py-[6px] px-[16px] border-[#D9D9D9] rounded-[24px] flex items-center gap-x-[8px]">
                        <img className="w-[20px] h-[20px]" src="/images/Extend.png" alt="Extend Image" />
                        <p className="font-medium text-[12px] text-[#3A3A3A]">Change Dates</p>
                    </button>}
                    {data.status === "Upcoming" && <button onClick={() => setOpenCancelPage(true)} className="cursor-pointer h-[40px] border py-[6px] px-[16px] border-[#D9D9D9] rounded-[24px] flex items-center gap-x-[8px]">
                        <img className="w-[20px] h-[20px]" src="/images/DeleteBlack.png" alt="Delete Image" />
                        <p className="font-medium text-[12px] text-[#3A3A3A]">Cancel Booking</p>
                    </button>}
                </div>
                <div className="mt-[32px]">
                    <p className="font-bold text-[24px] text-[#222222]">Vehicle Details</p>
                    <div className="mt-[16px]">
                        <div className="card-shadow flex items-center gap-x-[12px] rounded-[16px] border border-[#EDEDED] py-[12px] px-[16px] bg-white">
                            <img className="w-[64px] h-[64px] rounded-[8px] object-cover" src={data.imgUrl} alt="Scooter Book Image" />
                            <div className="flex flex-col">
                                <p className="font-bold text-[18px] text-[#484848]">{data.vehicleName}</p>
                                <p className="text-[#3A3A3A] text-[11px]">Rate Plan : {data.ratePlan}</p>
                            </div>
                        </div>
                    </div>
                    {data.delivery && <div className="mt-[20px]">
                        <p className="font-bold text-[15px] text-[#222222]">You’ve chosen doorstep delivery. Your vehicle will be safely delivered to your provided address.</p>
                        <p className="text-[14px] text-[#222222]">{data.deliveryAddress}</p>
                    </div>}
                </div>
                <div className="mt-[32px]">
                    <div className="flex items-center justify-between">
                        <p className="font-bold text-[24px] text-[#222222]">Payment Information</p>
                        <button 
                            onClick={handleViewReceipt} 
                            disabled={isDownloadingReceipt}
                            className={`font-bold text-[14px] flex items-center gap-x-[8px] transition-colors ${
                                isDownloadingReceipt 
                                    ? 'text-gray-400 cursor-not-allowed' 
                                    : 'text-[#1B29A9] cursor-pointer hover:text-[#3844B4]'
                            }`}
                        >
                            {isDownloadingReceipt ? (
                                <>
                                    <div className="w-[16px] h-[16px] border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                                    <span>Generating...</span>
                                </>
                            ) : (
                                'View Receipt'
                            )}
                        </button>   
                    </div>
                    <p className="mt-[18px] font-medium text-[#222222]">Total Amount</p>
                    <div className="mt-[2px] flex items-center gap-x-[16px]">
                        <p className="font-bold text-[18px] text-[#222222]">₹{data.amountPaid}</p>
                        <div className="flex items-center gap-x-[8px]">
                            <p className="font-medium text-[12px] text-[#222222]">Payment Status</p>
                            {data.paymentStatus === "Completed" && <span className="bg-[#DFFAEB] py-[4px] px-[16px] h-[26px] font-medium text-[12px] text-[#222222] rounded-[12px]">Completed</span>}
                        </div>
                    </div> 
                    {data.refundDate && <div className="flex flex-col mt-[8px]">
                        <p className="text-[14px] text-[#222222]">Refund Processed on {(formattedDate(data.refundDate.date))}</p>
                        <p className="text-[#969696] text-[14px] italic">Refunds (if applicable) will reflect in 5–7 business days.</p>
                    </div>}
                    {data.savedAmount && <div className="mt-[16px] bg-[#FFF2CB] py-[8px] px-[16px] rounded-[12px] h-[38px] flex items-center gap-x-[8px]">
                        <img src="/images/Saved.png" alt="Saved Image" className="w-[20px] h-[20px]" />
                        <p className="font-medium text-[14px] text-[#222222]">You have saved ₹{data.savedAmount} with this booking</p>
                    </div>}
                    <div className="mt-[32px]">
                        <p className="font-medium text-[#222222]">Payment Method</p>
                        <div className="mt-[8px] bg-[#F7F7F7] p-[16px] gap-x-[16px] rounded-[16px] flex items-center">
                            <img className="w-[40px] h-[40px]" src={data.paymentMethodImg} alt="Google Pay Image" />
                            <div className="flex flex-col">
                                <p className="font-bold text-[#222222]">{data.paymentMethodName}</p>
                                <p className="text-[#969696] text-[12px]">{data.paymentMethodDetails}</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-[32px]">
                        <WhatToExpect showDropoff={true} />
                    </div>
                    <div className="mt-[32px]">
                        <p className="font-bold text-[24px] text-[#222222]">Cancellation Policy</p>
                        {data.status === "Ongoing" && <p className="mt-[16px] text-[#222222] text-[14px]">Cancellations are not available once your booking is ongoing</p>}
                        {data.status === "Upcoming" && <>
                            <p className="mt-[16px] text-[#222222] text-[14px]">This hub has free cancellation with full refund available on all EVs until 48 hours prior, after which the cancellation becomes non- refundable. Learn more about <span className="font-bold underline underline-offset-4 cursor-pointer">Cancellations & Refunds</span></p>
                            <div className="mt-[10px] py-[30px]">
                                <CancellationBar bookingDate={data.bookingDate.date} pickupDate={data.pickup.date} />
                            </div>
                        </>}
                        {data.status === "Past" && <p className="mt-[16px] text-[#222222] text-[14px]">This booking was completed successfully, so cancellation/refund does not apply.</p>}
                        {data.status === "Cancelled" && <p className="mt-[16px] text-[#222222] text-[14px]">This booking was cancelled after the free cancellation period. Refund eligibility shown above.</p>}
                    </div>
                    <div className="mt-[32px]">
                        <p className="font-bold text-[24px] text-[#222222]">Contact Hub for Support</p>
                        <p className="mt-[16px] text-[#222222] text-[14px]">You can contact the hub directly for any queries or emergencies</p>
                        <div className="mt-[12px] flex flex-col gap-y-[8px]">
                            <div className="grid grid-cols-[150px_1fr] items-center">
                                <div className="flex items-center gap-x-[4px]">
                                <img className="w-[24px] h-[24px]" src="/images/Phone.png" alt="Phone" />
                                <p className="text-[14px] text-[#3A3A3A] font-medium">Hub Phone</p>
                                </div>
                                <p className="font-bold text-[14px] text-[#3A3A3A]">{data.hubPhone}</p>
                            </div>

                            <div className="grid grid-cols-[150px_1fr] items-center">
                                <div className="flex items-center gap-x-[4px]">
                                <img className="w-[24px] h-[24px]" src="/images/Email.png" alt="Email" />
                                <p className="text-[14px] text-[#3A3A3A] font-medium">Hub Email</p>
                                </div>
                                <p className="font-bold text-[14px] text-[#3A3A3A]">{data.hubEmail}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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
                            className="px-[32px] py-[12px] bg-[#000000] text-[#FFFFFF] font-medium text-[14px] rounded-[24px] hover:bg-[#333333] transition-colors"
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