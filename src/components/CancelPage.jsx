import { useState, useContext } from "react";
import CancellationBar from "./CancellationBar";
import { postAPI } from "../caller/axiosUrls";
import toast from "react-hot-toast";
import { UserContext } from "../contexts/UserContext";

const CancelPage = ({ data, setOpenCancelPage, onBookingCancelled }) => {
  const [step] = useState(0);
  const [selectedReason, setSelectedReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { fetchNotificationsCount } = useContext(UserContext);

  // Calculate if cancellation is within 48 hours of pickup
  const calculateCancellationPolicy = () => {
    const pickupDate = new Date(data.pickup?.date);
    const currentDate = new Date();
    const hoursDifference = (pickupDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60);
    
    return {
      isWithin48Hours: hoursDifference <= 48,
      hoursDifference: Math.abs(Math.round(hoursDifference)), // Always show positive hours
      isFullRefund: hoursDifference > 48
    };
  };

  const processCancellation = async () => {
    try {
      setLoading(true);
      
      // Get the subscription ID for the API call
      const subscriptionId = data.originalData?.pureRentalSubscriptionId || 
                           data.originalData?.subscriptionId || 
                           data.originalData?.id ||
                           data.id;
      
      // Calculate cancellation policy
      const cancellationPolicy = calculateCancellationPolicy();
      
      // Map selected reason to proper format
      const reasonMapping = {
        "noEV": "I don't want an EV anymore", 
        "emergency": "I have an emergency",
        "other": "Other"
      };
      
      const cancelPayload = {
        cancelationDate: new Date().toISOString(),
        cancelationReason: reasonMapping[selectedReason] || selectedReason,
        isFullRefund: cancellationPolicy.isFullRefund
      };
      
      console.log('🔍 Cancelling booking:', {
        subscriptionId,
        cancelPayload,
        cancellationPolicy,
        hoursDifference: cancellationPolicy.hoursDifference
      });
      
      const response = await postAPI(`/vehicle-plan/cancel-booking/${subscriptionId}`, cancelPayload);
      
      console.log('🔍 Cancel booking API response:', response);
      
      if (response.status === 'success') {
        // Show success message
        toast.success("🎉 Booking cancelled successfully!", {
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
        
        // Call callback to refresh booking data
        if (onBookingCancelled) {
          console.log('🔍 Refreshing booking data after cancellation...');
          onBookingCancelled();
        }
        
        // Fetch updated notifications count after cancellation
        console.log('🔍 Fetching updated notifications after cancellation...');
        fetchNotificationsCount();
        
        // Close modal after delay
        setTimeout(() => {
          setOpenCancelPage(false);
        }, 1500);
      } else {
        toast.error(response.message || "Failed to cancel booking. Please try again.");
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(error.message || "Failed to cancel booking. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative w-[664px] max-h-[600px] rounded-[16px] login-shadow bg-white overflow-hidden flex flex-col">
      {/* Header */}
      <div className="py-[24px] flex items-center header-shadow px-[32px]">
        <div className="flex flex-1 items-center gap-x-[20px]">
          <div className="flex flex-col">
            <p className="font-bold text-[24px] text-[#212121]">Cancel Booking</p>
          </div>
        </div>
        <img
          onClick={() => {
            setOpenCancelPage(false);
          }}
          className="w-[24px] aspect-square cursor-pointer"
          src="/images/Close.png"
          alt="Close Icon"
        />
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col py-[16px] px-[32px]">
        {(() => {
          const policy = calculateCancellationPolicy();
          return (
            <div className={`rounded-[8px] py-[12px] px-[16px] font-medium text-[14px] ${
              policy.isFullRefund 
                ? "bg-[#E7F5E7] text-[#2D5A2D]" 
                : "bg-[#FFE7E7] text-[#5A2D2D]"
            }`}>
              {policy.isFullRefund ? (
                <div>
                  ✅ <strong>Full Refund Available</strong><br/>
                  <span className="text-[12px]">Cancellation is {policy.hoursDifference} hours before pickup</span>
                </div>
              ) : (
                <div>
                  ⚠️ <strong>No Refund</strong><br/>
                  <span className="text-[12px]">Cancellation is {policy.hoursDifference} hours before pickup (within 48 hours)</span>
                </div>
              )}
            </div>
          );
        })()}

        {(!step) && (
          <>
            <div className="mt-[24px]">
              <div className="flex items-center gap-x-[12px] rounded-[16px] border border-[#EDEDED] py-[12px] px-[16px] bg-[#EDEDED]">
                <img
                  className="w-[64px] h-[64px] rounded-[8px] object-cover"
                  src={data.imgUrl}
                  alt="Scooter Book Image"
                />
                <div className="flex flex-col">
                  <p className="font-bold text-[18px] text-[#484848]">
                    {data.vehicleName}
                  </p>
                  <p className="text-[#3A3A3A] text-[11px]">
                    Rate Plan : {data.ratePlan}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-[10px] py-[30px]">
              <CancellationBar
                bookingDate={data.bookingDate.date}
                pickupDate={data.pickup.date}
              />
            </div>

            <span className="mt-[30px] mb-[24px] h-[1px] w-full bg-[#EDEDED] rounded-[8px]" />

            <p className="font-bold text-[18px] text-[#222222]">
              Why do you want to cancel this booking?
            </p>

            <div className="mt-[12px] mb-[20px] flex flex-col gap-y-[12px]">
              {/* My Plans Changed */}

          

              {/* I don't want an EV */}
              <div className="flex gap-x-[10px] items-center">
                <input
                  id="rad-2"
                  name="cancelReason"
                  type="radio"
                  className="accent-[#1B29A9]"
                  checked={selectedReason === "noEV"}
                  onChange={() => setSelectedReason("noEV")}
                />
                <label
                  htmlFor="rad-2"
                  className="font-medium text-[14px] text-[#222222]"
                >
                  I don’t want an EV anymore
                </label>
              </div>

              {/* Emergency */}
              <div className="flex gap-x-[10px] items-center">
                <input
                  id="rad-3"
                  name="cancelReason"
                  type="radio"
                  className="accent-[#1B29A9]"
                  checked={selectedReason === "emergency"}
                  onChange={() => setSelectedReason("emergency")}
                />
                <label
                  htmlFor="rad-3"
                  className="font-medium text-[14px] text-[#222222]"
                >
                  I have an emergency
                </label>
              </div>

              {/* Other */}
              <div className="flex gap-x-[10px] items-center">
                <input
                  id="rad-4"
                  name="cancelReason"
                  type="radio"
                  className="accent-[#1B29A9]"
                  checked={selectedReason === "other"}
                  onChange={() => setSelectedReason("other")}
                />
                <label
                  htmlFor="rad-4"
                  className="font-medium text-[14px] text-[#222222]"
                >
                  Other
                </label>
              </div>
            </div>
          </>
        )}

      </div>

      <div className="h-[100px] flex items-center input-shadow-upper px-[32px] gap-x-[16px]">
        <button
            onClick={() => {
                if (selectedReason) processCancellation();
            }}
            disabled={loading}
            className={`w-full h-[48px] font-bold text-[#FDFDFD] rounded-[24px] py-[13px] px-[24px] ${
                selectedReason && !loading
                ? "bg-[#000000] cursor-pointer hover:bg-[#333333]"
                : "bg-[#CBCBCB] cursor-not-allowed"
            }`}
        >
          {loading ? "Cancelling..." : "Confirm Cancellation"}
        </button>
      </div>
    </div>
  );
};

export default CancelPage;