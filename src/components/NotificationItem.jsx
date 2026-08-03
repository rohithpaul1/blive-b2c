const NotificationItem = ({ title, message, timeAgo, read }) => {
  return (
    <div className={`${!read ? "bg-[#E7E9FF]" : ""} h-[98px] rounded-[16px] w-full flex justify-between items-start p-[24px] mb-[8px]`}>
      <div className="flex flex-col">
        <p className="font-bold text-[16px] text-[#212121]">{title}</p>
        <p className="text-[14px] text-[#3A3A3A]">{message}</p>
      </div>
      <span className="text-[14px] text-[#7C7C7C] whitespace-nowrap">{timeAgo}</span>
    </div>
  );
};

export default NotificationItem;