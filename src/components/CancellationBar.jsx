import { format, differenceInHours, subHours, isToday } from "date-fns";

const CancellationBar = ({ bookingDate, pickupDate }) => {
  // Convert props to Date objects at noon to avoid timezone issues
  const booking = new Date(bookingDate);
  const pickup = new Date(pickupDate);
  
  // If pickup date doesn't have a time, set it to noon to avoid timezone shifts
  if (typeof pickupDate === 'string' && !pickupDate.includes('T')) {
    pickup.setHours(12, 0, 0, 0);
  }

  // Free cancellation deadline = 48 hours before pickup
  const freeCancellationDeadline = subHours(pickup, 48);

  // If booking is within 48 hours of pickup, no refund at all
  const hoursDiff = differenceInHours(pickup, booking);
  const showFreeCancellation = hoursDiff > 48;

  // Format helper to show actual time
  const formatDateWithTime = (date) => {
    return format(date, "dd MMM h:mm a");
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center w-full h-[40px] rounded-[25px]">
        {showFreeCancellation && (
          <div className="relative flex-1 h-full bg-[#484848] flex items-center justify-center rounded-l-[25px]">
            <p className="font-bold text-[14px] text-[#FDFDFD]">
              Free Cancellation, Full Refund
            </p>
            <span className="absolute left-0 -bottom-[26px] text-[12px] text-[#222222]">
              {isToday(booking)
                ? "Now"
                : formatDateWithTime(booking)}
            </span>
            <span className="absolute -right-[55px] -bottom-[26px] w-[110px] text-[12px] text-[#222222]">
              {formatDateWithTime(freeCancellationDeadline)}
            </span>
          </div>
        )}
        <div
          className={`relative ${
            showFreeCancellation ? "w-1/3 rounded-r-[25px]" : "w-full rounded-[25px]"
          } h-full bg-[#EDEDED] flex items-center justify-center`}
        >
          <p className="font-bold text-[14px] text-[#3A3A3A]">
            Non-Refundable
          </p>
          {showFreeCancellation && <span className="absolute right-0 -bottom-[44px] text-[12px] text-[#222222] text-end">
            {formatDateWithTime(pickup)}
            <br />
            <span className="text-[#969696]">Vehicle Pickup</span>
          </span>}
        </div>
      </div>
    </div>
  );
};

export default CancellationBar;