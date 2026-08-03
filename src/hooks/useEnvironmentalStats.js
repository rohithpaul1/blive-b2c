import { useState, useEffect } from 'react';
import { getAPI } from '../caller/axiosUrls';

export const useEnvironmentalStats = () => {
    const [stats, setStats] = useState({
        activeUsers: 0,
        co2SavedKg: "0",
        petrolSavedLiters: "0"
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchEnvironmentalStats = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await getAPI('/vehicle-plan/environmental-stats');
            
            if (response.status === 'success' && response.data) {
                setStats({
                    activeUsers: response.data.activeUsers || 0,
                    co2SavedKg: response.data.co2SavedKg || "0",
                    petrolSavedLiters: response.data.petrolSavedLiters || "0"
                });
            } else {
                throw new Error('Failed to fetch environmental stats');
            }
        } catch (err) {
            console.error('Error fetching environmental stats:', err);
            setError(err.message || 'Failed to load environmental stats');
            
            // Keep existing values or use fallback values on error
            setStats(prevStats => ({
                activeUsers: prevStats.activeUsers || 25673,
                co2SavedKg: prevStats.co2SavedKg || "83753.29",
                petrolSavedLiters: prevStats.petrolSavedLiters || "32620.04"
            }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEnvironmentalStats();
    }, []);

    // Function to format numbers with commas
    const formatNumber = (num) => {
        if (typeof num === 'string') {
            // Handle decimal numbers in string format
            const numValue = parseFloat(num);
            if (!isNaN(numValue)) {
                return numValue.toLocaleString('en-IN', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2
                });
            }
            return num;
        }
        
        if (typeof num === 'number') {
            return num.toLocaleString('en-IN');
        }
        
        return num;
    };

    // Function to format CO2 saved (convert to appropriate unit if needed)
    const formatCO2 = (kgValue) => {
        const kg = parseFloat(kgValue);
        if (isNaN(kg)) return kgValue;
        
        // If value is very large, convert to tonnes
        if (kg >= 1000) {
            const tonnes = kg / 1000;
            if (tonnes >= 1000) {
                return `${formatNumber(tonnes)} T`;
            }
            return `${formatNumber(kg)} Kgs`;
        }
        
        return `${formatNumber(kg)} Kgs`;
    };

    // Function to format petrol saved
    const formatPetrol = (literValue) => {
        const liters = parseFloat(literValue);
        if (isNaN(liters)) return literValue;
        
        return `${formatNumber(liters)} L`;
    };

    return {
        stats,
        loading,
        error,
        refetch: fetchEnvironmentalStats,
        formatNumber,
        formatCO2,
        formatPetrol,
        formattedStats: {
            activeUsers: formatNumber(stats.activeUsers),
            co2Saved: formatCO2(stats.co2SavedKg),
            petrolSaved: formatPetrol(stats.petrolSavedLiters)
        }
    };
};

export default useEnvironmentalStats;
