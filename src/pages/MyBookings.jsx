import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../sections/Navbar";
import Loader from "../components/Loader";
import BookingCard from "../components/BookingCard";
import { getAPI } from "../caller/axiosUrls";
import { useUser } from "../contexts/UserContext";
import Login from "../components/Login";
import toast from "react-hot-toast";


const MyBookings = () => {
    const [tab, setTab] = useState('Upcoming');
    const [bookings, setBookings] = useState({
        upcomingBooking: [],
        activeBooking: [],
        completedBooking: [],
        cancelledBooking: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { userData, isAuthenticated, fetchNotificationsCount } = useUser();
    const location = useLocation();
    const navigate = useNavigate();

    // Transform API data to component format
    const transformBookingData = (booking) => {
        const pickupDate = new Date(booking.pickUpDate);
        const dropoffDate = new Date(booking.dropOffDate);
        
        return {
            id: booking.id,
            vehicleName: booking.vehicleModel.modelName,
            manufacturer: booking.vehicleModel.manufacturer,
            brandLogo: booking.vehicleModel.brand?.logo || "/images/Scooter.png",
            imgUrl: "/images/Scooter (3).png", // Default image
            dropoffLocation: booking.isHomeDelivery ? 
                (booking.dropOffAddress || "Home Delivery") : 
                (booking.hub?.name || "Default Hub"),
            pickup: { 
                date: pickupDate.toISOString().split('T')[0], 
                time: pickupDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            },
            dropoff: { 
                date: dropoffDate.toISOString().split('T')[0], 
                time: dropoffDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            },
            cancelled: {
                date: booking.updatedAt ? new Date(booking.updatedAt).toISOString().split('T')[0] : pickupDate.toISOString().split('T')[0],
                time: booking.updatedAt ? new Date(booking.updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : pickupDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            },
            price: parseFloat(booking.lastPaymentAmount),
            orderStatus: booking.orderStatus,
            planType: booking.planType,
            vehicleModel: booking.vehicleModel,
            plan: booking.plan,
            rentalMode: booking.rentalMode || "fixed",
            subscription: booking.subscription || null,
            hub: booking.hub,
            isHomeDelivery: booking.isHomeDelivery,
            promoCodeId: booking.promoCodeId,
            createdAt: booking.createdAt,
            validTill: booking.validTill
        };
    };

    // Fetch booking history
    const fetchBookingHistory = async () => {
        // Don't attempt to fetch if not authenticated
        if (!isAuthenticated) {
            console.log('🔍 Not authenticated, skipping API call');
            setLoading(false);
            setError(null);
            return;
        }

        // Don't fetch if no user data
        if (!userData?.id) {
            console.log('🔍 No user ID found, skipping API call');
            setLoading(false);
            setError(null);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            console.log('🔍 Fetching booking history for user:', userData.id);
            const response = await getAPI(`/vehicle-plan/booking-history?userId=${userData.id}`);
            
            if (response.status === 'success') {
                console.log("Booking history fetched:", response.data);
                
                const transformedBookings = {
                    upcomingBooking: response.data.upcomingBooking?.map(transformBookingData) || [],
                    activeBooking: response.data.activeBooking?.map(transformBookingData) || [],
                    completedBooking: response.data.completedBooking?.map(transformBookingData) || [],
                    cancelledBooking: response.data.cancelledBooking?.map(transformBookingData) || []
                };
                
                setBookings(transformedBookings);
                console.log("Transformed bookings:", transformedBookings);
            } else {
                setError(response.message || 'Failed to fetch booking history');
            }
        } catch (error) {
            console.error('Error fetching booking history:', error);
            // Check if it's an authentication error
            if (error.statusCode === 401 || error.isAuthError) {
                console.log('🔍 Authentication error detected, letting app handle login redirect');
                setError(null); // Don't show error, auth is handled globally
                setLoading(false);
                return; // Don't set other errors
            } else {
                setError('Failed to load booking history. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log('🔍 MyBookings useEffect triggered:', { isAuthenticated, userData: !!userData, loading });
        
        // Only try to fetch if authenticated and not loading
        if (isAuthenticated && userData) {
            fetchBookingHistory();
        } else {
            // Clear any previous data when not authenticated
            setBookings({
                upcomingBooking: [],
                activeBooking: [],
                completedBooking: [],
                cancelledBooking: []
            });
            setError(null);
            setLoading(false);
        }
    }, [isAuthenticated, userData]);

    // Fetch notifications count when MyBookings page loads
    useEffect(() => {
        if (isAuthenticated) {
            fetchNotificationsCount();
        }
    }, [isAuthenticated, fetchNotificationsCount]);

    // Handle success message from payment completion
    useEffect(() => {
        if (location.state?.showSuccessMessage) {
            toast.success("Booking confirmed! Your vehicle is ready for pickup.");
            // Clear the state to prevent showing the message again on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);


    // Handle navigation to booking details
    const handleBookingCardClick = (booking) => {
        navigate(`/booking/${booking.id}`);
    };

    // Get current tab data
    const getCurrentTabData = () => {
        switch (tab) {
            case 'Ongoing':
                return bookings.activeBooking;
            case 'Upcoming':
                return bookings.upcomingBooking;
            case 'Past':
                return bookings.completedBooking;
            case 'Cancelled':
                return bookings.cancelledBooking;
            default:
                return [];
        }
    };

    const currentData = getCurrentTabData();

    // console.log('🔍 MyBookings DEBUG:', { isAuthenticated, loading }); // Uncomment for debugging

    // Show loading screen while checking authentication
    if (loading) {
        return (
            <div className="w-full overflow-x-hidden">
                <Navbar onSearchPage={false} expanded={true} />
                <div className="mt-[124px] flex items-center justify-center w-full h-96">
                    <div className="text-center">
                        <Loader />
                        <p className="mt-4 text-gray-600">Loading...</p>
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

    return (
        <div className="w-full overflow-x-hidden">
            <Navbar onSearchPage={false} expanded={true} />
            <div className="mt-[124px] flex items-center w-full border-y border-[#EDEDED] py-[24px] px-[40px] gap-x-[16px]">
                <img src="/images/Ticket.svg" alt="Ticket Image" />
                <p className="font-bold text-[28px] text-[#222222]">My Bookings</p>
            </div>
            <div className="pt-[20px] flex flex-col">
                <div className="flex items-center gap-x-[35px] header-shadow px-[15%]">
                    <button onClick={() => setTab("Ongoing")} className={`cursor-pointer font-medium py-[8px] text-[18px] border-b-[2px] transition-all duration-500 ${tab === "Ongoing" ? "border-[#3844B4] text-[#1B29A9]" : "text-[#717171] border-transparent"}`}>Ongoing</button>
                    <button onClick={() => setTab("Upcoming")} className={`cursor-pointer font-medium py-[8px] text-[18px] border-b-[2px] transition-all duration-500 ${tab === "Upcoming" ? "border-[#3844B4] text-[#1B29A9]" : "text-[#717171] border-transparent"}`}>Upcoming</button>
                    <button onClick={() => setTab("Past")} className={`cursor-pointer font-medium py-[8px] text-[18px] border-b-[2px] transition-all duration-500 ${tab === "Past" ? "border-[#3844B4] text-[#1B29A9]" : "text-[#717171] border-transparent"}`}>Past</button>
                    <button onClick={() => setTab("Cancelled")} className={`cursor-pointer font-medium py-[8px] text-[18px] border-b-[2px] transition-all duration-500 ${tab === "Cancelled" ? "border-[#3844B4] text-[#1B29A9]" : "text-[#717171] border-transparent"}`}>Cancelled</button>
                </div>
                <div className="flex flex-col py-[50px] items-center justify-center gap-y-[24px]">
                    {loading ? (
                        <Loader />
                    ) : error ? (
                        <div className="mt-[100px] flex-1 h-full w-full flex flex-col items-center justify-center">
                            <p className="font-bold text-[22px] text-[#3A3A3A]">Error loading bookings</p>
                            <p className="mt-[8px] font-medium text-[14px] text-[#969696]">{error}</p>
                            <button 
                                onClick={fetchBookingHistory}
                                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Retry
                            </button>
                        </div>
                    ) : currentData.length === 0 ? (
                        <div className="mt-[100px] flex-1 h-full w-full flex flex-col items-center justify-center">
                            {tab === "Ongoing" && 
                            <>
                                <p className="font-bold text-[22px] text-[#3A3A3A]">No rides in progress right now.</p>
                                <p className="mt-[8px] font-medium text-[14px] text-[#969696]">Start a booking and hit the road!</p>
                            </>}
                            {tab === "Upcoming" && 
                            <>
                                <p className="font-bold text-[22px] text-[#3A3A3A]">No upcoming bookings yet</p>
                                <p className="mt-[8px] font-medium text-[14px] text-[#969696]">Plan ahead and reserve your ride early.</p>
                            </>}
                            {tab === "Past" && 
                            <>
                                <p className="font-bold text-[22px] text-[#3A3A3A]">No past rides to show</p>
                                <p className="mt-[8px] font-medium text-[14px] text-[#969696]">Your completed trips will appear here.</p>
                            </>}
                            {tab === "Cancelled" && 
                            <>
                                <p className="font-bold text-[22px] text-[#3A3A3A]">No cancelled bookings</p>
                                <p className="mt-[8px] font-medium text-[14px] text-[#969696]">If you cancel a ride, it will appear here.</p>
                            </>}
                        </div>
                    ) : (
                        currentData.map((item, index) => (
                            <BookingCard 
                                key={item.id || index}
                                item={item} 
                                tab={tab}
                                onClick={handleBookingCardClick}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

export default MyBookings;
