const Loader = () => {
    return (
        <div className='w-full h-full mt-2 flex flex-col items-center justify-center gap-y-4'>
            <div
                className="w-16 h-16 rounded-full border-[5px] border-[#EDEDED] border-t-[#1B29A9] animate-spin"
                role="status"
                aria-label="Checking availability"
            />
            <p className='font-bold text-[24px] text-[#212121]'>Checking availability ...</p>
        </div>
    )
}

export default Loader;
