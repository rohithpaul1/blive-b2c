const NotificationItem = ({ title, message, timeAgo, read }) => {
  return (
    <div className={`${!read ? "bg-[#EEF0FF]" : "bg-white border border-[#ebebeb]"} mb-[8px] flex w-full flex-col gap-[4px] rounded-[16px] p-[16px] md:p-[24px]`}>
      <div className="flex items-baseline justify-between gap-[12px]">
        <p className="text-[16px] font-bold text-[#212121]">{title}</p>
        <span className="shrink-0 whitespace-nowrap text-[13px] text-[#6a6a6a]">{timeAgo}</span>
      </div>
      <p className="text-[15px] leading-[1.45] text-[#3A3A3A]">{message}</p>
    </div>
  );
};

export default NotificationItem;
