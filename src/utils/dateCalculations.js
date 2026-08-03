// Utility functions for date calculations in rental system

/**
 * Calculates the number of rental days between pickup and dropoff dates
 * Implements basic hygiene: same day rental = 1 day minimum
 * @param {Object} pickup - Pickup date object with date and time properties
 * @param {Object} dropoff - Dropoff date object with date and time properties
 * @returns {number} - Number of rental days (minimum 1)
 */
export const calculateRentalDays = (pickup, dropoff) => {
    try {
        // Check if dates exist
        if (!pickup?.date || !dropoff?.date) {
            return 0;
        }
        
        // Normalize to YYYY-MM-DD
        const pickupDateStr = new Date(pickup.date).toISOString().split("T")[0];
        const dropoffDateStr = new Date(dropoff.date).toISOString().split("T")[0];

        // Convert "10 AM" / "3 PM" → "HH:mm"
        const parseTime = (timeStr) => {
            const [time, modifier] = timeStr.split(" ");
            let [hours, minutes] = time.split(":");
            if (!minutes) minutes = "00"; // default

            hours = parseInt(hours, 10);
            if (modifier.toUpperCase() === "PM" && hours < 12) {
                hours += 12;
            }
            if (modifier.toUpperCase() === "AM" && hours === 12) {
                hours = 0;
            }

            return `${hours.toString().padStart(2, "0")}:${minutes}`;
        };

        const pickupDateTime = new Date(`${pickupDateStr}T${parseTime(pickup?.time || "10 AM")}`);
        const dropoffDateTime = new Date(`${dropoffDateStr}T${parseTime(dropoff?.time || "10 AM")}`);

        if (isNaN(pickupDateTime) || isNaN(dropoffDateTime)) {
            throw new Error("Invalid pickup or dropoff date/time format");
        }

        // BASIC HYGIENE: Check if it's the same date
        if (pickupDateStr === dropoffDateStr) {
            // Same day rental - always count as 1 day minimum
            console.log("Same day rental detected, returning 1 day");
            return 1;
        }

        if (dropoffDateTime <= pickupDateTime) {
            console.warn("Dropoff date/time must be after pickup date/time");
            return 0;
        }

        const diffMs = dropoffDateTime.getTime() - pickupDateTime.getTime();

        // Convert ms → days (always round up for rentals)
        const calculatedDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        
        // Ensure minimum 1 day for any rental
        const finalDays = Math.max(1, calculatedDays);
        
        console.log("Rental days calculation:", {
            pickup: pickupDateStr,
            dropoff: dropoffDateStr,
            diffMs,
            calculatedDays,
            finalDays
        });
        
        return finalDays;
    } catch (err) {
        console.error("calculateRentalDays error:", err);
        return 0;
    }
};

/**
 * Formats date and time for API calls
 * @param {Date} date - Date object
 * @param {string} time - Time string (e.g., "10 AM", "2 PM")
 * @returns {string} - Formatted datetime string for API
 */
export const formatDateTimeForAPI = (date, time) => {
    if (!date) return null;
    
    // Parse time string (e.g., "10 AM", "2 PM")
    const parseTime = (timeStr) => {
        const [time, modifier] = timeStr.split(" ");
        let [hours, minutes] = time.split(":");
        if (!minutes) minutes = "00";

        hours = parseInt(hours, 10);
        if (modifier.toUpperCase() === "PM" && hours < 12) {
            hours += 12;
        }
        if (modifier.toUpperCase() === "AM" && hours === 12) {
            hours = 0;
        }

        return `${hours.toString().padStart(2, "0")}:${minutes}`;
    };

    // Create date object and format as ISO string
    const dateObj = new Date(date);
    const timeStr = parseTime(time || "10 AM");
    
    // Format as ISO string with time
    const isoString = dateObj.toISOString().split('T')[0];
    return `${isoString}T${timeStr}:00.000Z`;
};

/**
 * Validates if dropoff date/time is after pickup date/time
 * @param {Object} pickup - Pickup date object with date and time properties
 * @param {Object} dropoff - Dropoff date object with date and time properties
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateDateRange = (pickup, dropoff) => {
    if (!pickup?.date || !dropoff?.date) {
        return false;
    }
    
    const pickupDateTime = new Date(formatDateTimeForAPI(pickup.date, pickup.time));
    const dropoffDateTime = new Date(formatDateTimeForAPI(dropoff.date, dropoff.time));
    
    // Same day rentals are valid
    const pickupDateStr = new Date(pickup.date).toISOString().split("T")[0];
    const dropoffDateStr = new Date(dropoff.date).toISOString().split("T")[0];
    
    if (pickupDateStr === dropoffDateStr) {
        return true; // Same day is always valid
    }
    
    return dropoffDateTime > pickupDateTime;
};

/**
 * Gets a human-readable description of the rental duration
 * @param {Object} pickup - Pickup date object
 * @param {Object} dropoff - Dropoff date object
 * @returns {string} - Human readable duration
 */
export const getRentalDurationDescription = (pickup, dropoff) => {
    const days = calculateRentalDays(pickup, dropoff);
    
    if (days === 0) return "Invalid dates";
    if (days === 1) return "1 day rental";
    if (days < 7) return `${days} days rental`;
    if (days === 7) return "1 week rental";
    if (days < 30) return `${days} days rental (${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''})`;
    if (days === 30) return "1 month rental";
    return `${days} days rental (${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''})`;
};
