import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { CalendarDays, WalletCards } from "lucide-react";
import Navbar from "../sections/Navbar";
import Loader from "../components/Loader";
import BookingCard from "../components/BookingCard";
import { getAPI } from "../caller/axiosUrls";
import { getHubs } from "../lib/hubs";
import { getVehicleModelsByHubIds } from "../lib/vehicleModels";
import { useUser } from "../contexts/UserContext";
import Login from "../components/Login";
import toast from "react-hot-toast";

const CHARGED_BY_TO_PLAN_TYPE = {
    PER_DAY: "daily",
    PER_WEEK: "weekly",
    PER_MONTH: "monthly",
};

// Tab name -> bookings bucket, in the priority order used to pick a default
// tab once /bookings/mine has actually loaded (see fetchBookingHistory).
const TAB_BUCKETS = [
    ["Ongoing", "activeBooking"],
    ["Upcoming", "upcomingBooking"],
    ["Past", "completedBooking"],
    ["Cancelled", "cancelledBooking"],
];


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
    const wallet = useQuery("b2c/wallet:summary", isAuthenticated ? {} : "skip");
    const selectedActiveRental = useRef(false);

    useEffect(() => {
        if (wallet?.showInHeader && !selectedActiveRental.current) {
            setTab("Ongoing");
            selectedActiveRental.current = true;
        }
    }, [wallet?.showInHeader]);

    // Transform one /bookings/mine item to the shape BookingCard.jsx expects.
    // This endpoint returns raw vehicleModelId/hubId only — no embedded
    // vehicle or hub objects at all — so real names/images/coordinates come
    // from cross-referencing those ids against /catalogue/vehicle-models
    // and the shared hub list (both resolved once in fetchBookingHistory
    // below, passed in here rather than re-fetched per booking).
    const transformBookingData = (booking, { vehicleModelsById, hubsById }) => {
        const pickupDate = new Date(booking.pickupDateTime);
        const dropoffDate = new Date(booking.dropoffDateTime);
        const vehicleModel = vehicleModelsById.get(booking.vehicleModelId);
        const hub = hubsById.get(booking.hubId);
        const isSubscription = booking.rentalTerm === "SUBSCRIPTION";
        const pricing = booking.pricingSnapshot || {};

        return {
            id: booking.id,
            vehicleName: vehicleModel?.name || booking.bookingNumber,
            manufacturer: vehicleModel?.vehicleType || "",
            brandLogo: vehicleModel?.modelImages?.[0] || null,
            imgUrl: vehicleModel?.modelImages?.[0] || "/images/Scooter (3).png",
            dropoffLocation: booking.wantsDoorstepDelivery
                ? "Home Delivery"
                : (hub?.name || booking.pickupLocation || "Default Hub"),
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
            price: pricing.totalAmount ?? booking.bookingAmount ?? 0,
            orderStatus: booking.status,
            planType: CHARGED_BY_TO_PLAN_TYPE[booking.chargedBy] || "daily",
            rentalMode: isSubscription ? "subscription" : "fixed",
            // No recurring-billing echo on this endpoint (next charge date,
            // renewal amount) — subscription bookings show the same total
            // as fixed ones until BE adds that.
            subscription: isSubscription
                ? { recurringCharge: pricing.totalAmount ?? booking.bookingAmount ?? 0, nextBillingAt: null, commitmentDuration: 1 }
                : null,
            hub: hub
                ? { name: hub.name, latitude: hub.warehouseLocation?.lat ?? null, longitude: hub.warehouseLocation?.lng ?? null }
                : null,
            isHomeDelivery: booking.wantsDoorstepDelivery,
            createdAt: booking.createdAt,
        };
    };

    // Which tab (Ongoing/Upcoming/Past/Cancelled) a booking belongs in.
    // The API doesn't group these server-side any more — derived
    // client-side from status + dates. Only CANCELLED and CONFIRMED have
    // been observed so far; worth confirming the full status enum with BE
    // if other values (e.g. a distinct COMPLETED) turn out to exist.
    const bucketForBooking = (booking) => {
        if (booking.status === "CANCELLED") return "cancelledBooking";
        const now = Date.now();
        const pickup = new Date(booking.pickupDateTime).getTime();
        const dropoff = new Date(booking.dropoffDateTime).getTime();
        if (now < pickup) return "upcomingBooking";
        if (now <= dropoff) return "activeBooking";
        return "completedBooking";
    };

    // Fetch booking history. `isCancelled` lets the triggering effect (see
    // below) disown a stale in-flight call — React's dev-only StrictMode
    // double-invokes this effect on mount, which without this guard fired
    // two overlapping /bookings/mine requests and let whichever one settled
    // last clobber the other's state.
    const fetchBookingHistory = async (isCancelled = () => false) => {
        // Don't attempt to fetch if not authenticated
        if (!isAuthenticated || !userData?.id) {
            console.log('🔍 Not authenticated, skipping API call');
            setLoading(false);
            setError(null);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const rawBookings = await getAPI(`/bookings/mine?customerId=${userData.id}`);
            const list = Array.isArray(rawBookings) ? rawBookings : [];

            const [hubs, vehicleModelsById] = await Promise.all([
                getHubs(),
                getVehicleModelsByHubIds(list.map((b) => b.hubId)),
            ]);
            if (isCancelled()) return;
            const hubsById = new Map(hubs.map((hub) => [hub.id, hub]));

            const transformedBookings = {
                upcomingBooking: [],
                activeBooking: [],
                completedBooking: [],
                cancelledBooking: [],
            };
            list.forEach((booking) => {
                const bucket = bucketForBooking(booking);
                transformedBookings[bucket].push(transformBookingData(booking, { vehicleModelsById, hubsById }));
            });

            if (isCancelled()) return;
            setBookings(transformedBookings);
            console.log("Transformed bookings:", transformedBookings);

            // Land the user on whichever tab actually has something to show
            // instead of always defaulting to "Upcoming" — a booking whose
            // pickup has already passed (today's date, say) lands in
            // activeBooking/"Ongoing", and with nothing upcoming the page
            // would otherwise show "No upcoming bookings yet" even though
            // the fetch above just found a real, current booking. Only runs
            // once (guarded by the same ref the wallet-driven switch below
            // uses) so it never fights a tab the user already clicked.
            if (!selectedActiveRental.current) {
                const firstNonEmptyTab = TAB_BUCKETS.find(
                    ([, bucket]) => transformedBookings[bucket].length > 0
                );
                if (firstNonEmptyTab) setTab(firstNonEmptyTab[0]);
                selectedActiveRental.current = true;
            }
        } catch (error) {
            if (isCancelled()) return;
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
            if (!isCancelled()) setLoading(false);
        }
    };

    useEffect(() => {
        console.log('🔍 MyBookings useEffect triggered:', { isAuthenticated, userData: !!userData, loading });
        let cancelled = false;

        // Only try to fetch if authenticated and not loading
        if (isAuthenticated && userData) {
            fetchBookingHistory(() => cancelled);
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

        return () => { cancelled = true; };
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
            <div className="mt-[124px] flex w-full items-center gap-x-[12px] border-y border-[#EDEDED] px-4 py-[20px] sm:px-8 lg:px-[clamp(40px,7vw,112px)]">
                <img src="/images/Ticket.svg" alt="Ticket Image" />
                <p className="text-[24px] font-bold text-[#222222] sm:text-[28px]">My Bookings</p>
            </div>
            <div className="flex flex-col pt-[20px]">
                {wallet?.showInHeader && wallet.activeSubscription && (
                    <div className="mx-auto mb-5 grid w-[calc(100%_-_2rem)] max-w-[1040px] gap-4 rounded-[20px] border border-[#e5deef] bg-[#faf8ff] p-5 sm:w-[calc(100%_-_3rem)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-6">
                        <div className="flex min-w-0 items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#ece4fb] text-[#4c288f]">
                                <WalletCards size={22} aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-[#6d6278]">Available for your next renewal</p>
                                <p className="mt-1 text-[26px] font-bold tracking-[-0.03em] text-[#2d174f]">
                                    ₹{Number(wallet.availableBalance || 0).toLocaleString("en-IN")}
                                </p>
                                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-[#6d6278]">
                                    <CalendarDays size={15} aria-hidden="true" />
                                    ₹{Number(wallet.activeSubscription.recurringCharge || 0).toLocaleString("en-IN")} due {new Date(wallet.activeSubscription.nextChargeAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate("/wallet")}
                            className="min-h-11 rounded-full bg-[#351a75] px-6 text-sm font-bold text-white transition-colors hover:bg-[#2c155f]"
                        >
                            Add money
                        </button>
                    </div>
                )}
                <div className="header-shadow overflow-x-auto px-4 sm:px-6">
                    <div className="mx-auto flex min-w-max max-w-[1040px] items-center gap-x-[28px] sm:gap-x-[35px]">
                    <button onClick={() => setTab("Ongoing")} className={`min-h-11 cursor-pointer border-b-[2px] py-[8px] text-[16px] font-medium transition-all duration-300 sm:text-[18px] ${tab === "Ongoing" ? "border-[#5d35b5] text-[#4a2595]" : "text-[#717171] border-transparent"}`}>Ongoing</button>
                    <button onClick={() => setTab("Upcoming")} className={`min-h-11 cursor-pointer border-b-[2px] py-[8px] text-[16px] font-medium transition-all duration-300 sm:text-[18px] ${tab === "Upcoming" ? "border-[#5d35b5] text-[#4a2595]" : "text-[#717171] border-transparent"}`}>Upcoming</button>
                    <button onClick={() => setTab("Past")} className={`min-h-11 cursor-pointer border-b-[2px] py-[8px] text-[16px] font-medium transition-all duration-300 sm:text-[18px] ${tab === "Past" ? "border-[#5d35b5] text-[#4a2595]" : "text-[#717171] border-transparent"}`}>Past</button>
                    <button onClick={() => setTab("Cancelled")} className={`min-h-11 cursor-pointer border-b-[2px] py-[8px] text-[16px] font-medium transition-all duration-300 sm:text-[18px] ${tab === "Cancelled" ? "border-[#5d35b5] text-[#4a2595]" : "text-[#717171] border-transparent"}`}>Cancelled</button>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center gap-y-[24px] px-4 py-[36px] sm:px-6 sm:py-[50px]">
                    {loading ? (
                        <Loader />
                    ) : error ? (
                        <div className="mt-[100px] flex-1 h-full w-full flex flex-col items-center justify-center">
                            <p className="font-bold text-[22px] text-[#3A3A3A]">Error loading bookings</p>
                            <p className="mt-[8px] font-medium text-[14px] text-[#969696]">{error}</p>
                            <button 
                                onClick={() => fetchBookingHistory()}
                                className="mt-4 min-h-11 rounded-full bg-[#351a75] px-6 py-2 font-semibold text-white hover:bg-[#2c155f]"
                            >
                                Retry
                            </button>
                        </div>
                    ) : currentData.length === 0 ? (
                        <div className="flex min-h-[280px] w-full flex-1 flex-col items-center justify-center px-4 text-center">
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
