import useEnvironmentalStats from '../hooks/useEnvironmentalStats';

const HeroKPICard = () => {
    const { formattedStats, loading, error } = useEnvironmentalStats();

    return (
        <div className="absolute top-1/3 -translate-y-1/3 right-[40px] w-[340px] backdrop-blur-sm rounded-[28px] border border-[#ffffff60] p-[20px] gap-[8px] z-20 bg-[#00000054]">
            <div className="flex flex-col gap-[12px]">
                <div className="flex py-[4px] gap-x-[12px]">
                    <img src="/images/lsicon_leaf-filled.png" alt="CO2 Saved till now icon" />
                    <span className="text-white">CO2 Saved till now :</span>
                    <span className="text-[#74FF97]">
                        {loading ? (
                            <span className="animate-pulse">Loading...</span>
                        ) : (
                            formattedStats.co2Saved
                        )}
                    </span>
                </div>
                <div className="flex py-[4px] gap-x-[12px]">
                    <img src="/images/streamline-sharp_gas-station-fuel-petroleum-remix.png" alt="Petrol Saved till now icon" />
                    <span className="text-white">Petrol Saved till now :</span>
                    <span className="text-[#74FF97]">
                        {loading ? (
                            <span className="animate-pulse">Loading...</span>
                        ) : (
                            formattedStats.petrolSaved
                        )}
                    </span>
                </div>
                <div className="flex py-[4px] gap-x-[12px]">
                    <img src="/images/mdi_users.png" alt="Active Users icon" />
                    <span className="text-white">Active Users :</span>
                    <span className="text-[#74FF97]">
                        {loading ? (
                            <span className="animate-pulse">Loading...</span>
                        ) : (
                            formattedStats.activeUsers
                        )}
                    </span>
                </div>
                {error && (
                    <div className="text-yellow-400 text-xs mt-1">
                        ⚠️ Using cached data
                    </div>
                )}
            </div>
        </div>
    )
}

export default HeroKPICard;