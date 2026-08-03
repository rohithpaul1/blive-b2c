const Pagination = ({ selectedPage, setSelectedPage, maxPages }) => {
  const getPages = () => {
    const pages = [];
    const maxVisible = 3;

    if (maxPages <= 5) {
      for (let i = 1; i <= maxPages; i++) pages.push(i);
    } else {
      pages.push(1);

      if (selectedPage > maxVisible) pages.push("...");

      let start = Math.max(2, selectedPage - 1);
      let end = Math.min(maxPages - 1, selectedPage + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (selectedPage < maxPages - 2) pages.push("...");

      pages.push(maxPages);
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-x-[8px] mt-[30px]">
      {/* Previous Button */}
      <p
        className={`py-[5px] px-[8px] font-medium text-[14px] cursor-pointer ${
          selectedPage === 1 ? "text-[#969696] cursor-not-allowed" : "text-[#1B29A9]"
        }`}
        onClick={() => selectedPage > 1 && setSelectedPage(selectedPage - 1)}
      >
        Previous
      </p>

      {/* Page Numbers */}
      {getPages().map((page, idx) => (
        <span
          key={idx}
          className={`${
            page === selectedPage ? "border-[#1B29A9] rounded-[6px] font-bold border text-[#1B29A9]" : "text-[#222222]"
          } ${
            page === "..." ? "cursor-default" : "cursor-pointer"
          } flex items-center justify-center w-[32px] aspect-square text-[14px]`}
          onClick={() => page !== "..." && setSelectedPage(page)}
        >
          {page}
        </span>
      ))}

      {/* Next Button */}
      <p
        className={`py-[5px] px-[8px] font-medium text-[14px] cursor-pointer ${
          selectedPage === maxPages
            ? "text-[#969696] cursor-not-allowed"
            : "text-[#1B29A9]"
        }`}
        onClick={() => selectedPage < maxPages && setSelectedPage(selectedPage + 1)}
      >
        Next
      </p>
    </div>
  );
};

export default Pagination;