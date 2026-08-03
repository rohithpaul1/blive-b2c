const FullPageLoader = () => {
    return (
        <div className="fixed top-0 left-0 z-50 w-full h-dvh bg-white flex flex-col items-center justify-center gap-y-4">
            <div
                className="w-20 h-20 rounded-full border-[6px] border-[#EDEDED] border-t-[#1B29A9] animate-spin"
                role="status"
                aria-label="Loading"
            />
            <p className='font-bold text-[24px] text-[#212121]'>Loading...</p>
        </div>
    )
}

export default FullPageLoader;
