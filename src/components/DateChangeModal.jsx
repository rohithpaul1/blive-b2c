import { useState, useEffect } from 'react';

const DateChangeModal = ({ isOpen, onClose, onDateChange }) => {
    const [selectedPickupDate, setSelectedPickupDate] = useState(null);
    const [selectedDropoffDate, setSelectedDropoffDate] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [currentDropoffMonth, setCurrentDropoffMonth] = useState(new Date());

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedPickupDate(null);
            setSelectedDropoffDate(null);
            setCurrentMonth(new Date());
            setCurrentDropoffMonth(new Date());
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Calendar helper functions
    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const formatMonthYear = (date) => {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const isDateSelected = (day, monthDate) => {
        if (!selectedPickupDate && !selectedDropoffDate) return false;
        
        const currentDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day, 12, 0, 0, 0);
        
        if (selectedPickupDate && selectedDropoffDate) {
            return currentDate.getTime() === selectedPickupDate.getTime() || 
                   currentDate.getTime() === selectedDropoffDate.getTime();
        }
        
        return (selectedPickupDate && currentDate.getTime() === selectedPickupDate.getTime()) ||
               (selectedDropoffDate && currentDate.getTime() === selectedDropoffDate.getTime());
    };

    const isDateInRange = (day, monthDate) => {
        if (!selectedPickupDate || !selectedDropoffDate) return false;
        
        const currentDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day, 12, 0, 0, 0);
        const start = selectedPickupDate < selectedDropoffDate ? selectedPickupDate : selectedDropoffDate;
        const end = selectedPickupDate < selectedDropoffDate ? selectedDropoffDate : selectedPickupDate;
        
        return currentDate >= start && currentDate <= end;
    };

    const handleDateClick = (day, monthDate) => {
        // Create date at noon to avoid timezone issues
        const clickedDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day, 12, 0, 0, 0);
        
        if (!selectedPickupDate) {
            // First click - set as pickup
            setSelectedPickupDate(clickedDate);
        } else if (!selectedDropoffDate) {
            // Second click - set as dropoff
            // Compare only the date parts, not time
            const clickedTime = clickedDate.getTime();
            const pickupTime = selectedPickupDate.getTime();
            
            if (clickedTime < pickupTime) {
                // If clicked date is before pickup, swap them
                setSelectedDropoffDate(selectedPickupDate);
                setSelectedPickupDate(clickedDate);
            } else {
                // Normal case - set as dropoff
                setSelectedDropoffDate(clickedDate);
            }
        } else {
            // Third click or more - reset with new pickup
            setSelectedPickupDate(clickedDate);
            setSelectedDropoffDate(null);
        }
    };

    const navigateMonth = (direction, isDropoff = false) => {
        const current = isDropoff ? currentDropoffMonth : currentMonth;
        const setter = isDropoff ? setCurrentDropoffMonth : setCurrentMonth;
        
        const newDate = new Date(current);
        newDate.setMonth(current.getMonth() + direction);
        setter(newDate);
    };

    const renderCalendar = (monthDate) => {
        const daysInMonth = getDaysInMonth(monthDate);
        const firstDay = getFirstDayOfMonth(monthDate);
        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const isSelected = isDateSelected(day, monthDate);
            const isInRange = isDateInRange(day, monthDate);
            const isToday = new Date().toDateString() === new Date(monthDate.getFullYear(), monthDate.getMonth(), day).toDateString();
            
            days.push(
                <button
                    key={day}
                    onClick={() => handleDateClick(day, monthDate)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isSelected 
                            ? 'bg-gray-800 text-white' 
                            : isInRange 
                                ? 'bg-gray-100 text-gray-800' 
                                : isToday
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    {day}
                </button>
            );
        }

        return days;
    };

    const handleProceed = () => {
        if (selectedPickupDate && selectedDropoffDate) {
            onDateChange({
                pickupDate: selectedPickupDate.toISOString().split('T')[0],
                dropoffDate: selectedDropoffDate.toISOString().split('T')[0]
            });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-gray-800/50">
            <div className="bg-white rounded-[16px] p-[32px] w-[800px] max-w-[90vw] max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-[32px]">
                    <h2 className="text-[24px] font-bold text-black">Calendar</h2>
                    <button 
                        onClick={onClose}
                        className="w-[40px] h-[40px] flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all duration-200 text-[20px]"
                    >
                        ✕
                    </button>
                </div>

                {/* Select Date Header */}
                <div className="mb-[24px]">
                    <h3 className="text-[18px] font-bold text-black">Select Date</h3>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-2 gap-[24px]">
                    {/* Pickup Calendar */}
                    <div className="bg-white rounded-[16px] border border-gray-200 p-[20px] shadow-sm">
                        <div className="flex items-center justify-between mb-[20px]">
                            <button 
                                onClick={() => navigateMonth(-1, false)}
                                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all duration-200"
                            >
                                ‹
                            </button>
                            <h4 className="text-[16px] font-bold text-black">{formatMonthYear(currentMonth)}</h4>
                            <button 
                                onClick={() => navigateMonth(1, false)}
                                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all duration-200"
                            >
                                ›
                            </button>
                        </div>
                        
                        {/* Weekdays */}
                        <div className="grid grid-cols-7 gap-1 mb-[8px]">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="text-center text-[12px] text-gray-500 font-medium py-2">
                                    {day}
                                </div>
                            ))}
                        </div>
                        
                        {/* Calendar Days */}
                        <div className="grid grid-cols-7 gap-1">
                            {renderCalendar(currentMonth, false)}
                        </div>
                    </div>

                    {/* Dropoff Calendar */}
                    <div className="bg-white rounded-[16px] border border-gray-200 p-[20px] shadow-sm">
                        <div className="flex items-center justify-between mb-[20px]">
                            <button 
                                onClick={() => navigateMonth(-1, true)}
                                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all duration-200"
                            >
                                ‹
                            </button>
                            <h4 className="text-[16px] font-bold text-black">{formatMonthYear(currentDropoffMonth)}</h4>
                            <button 
                                onClick={() => navigateMonth(1, true)}
                                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all duration-200"
                            >
                                ›
                            </button>
                        </div>
                        
                        {/* Weekdays */}
                        <div className="grid grid-cols-7 gap-1 mb-[8px]">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="text-center text-[12px] text-gray-500 font-medium py-2">
                                    {day}
                                </div>
                            ))}
                        </div>
                        
                        {/* Calendar Days */}
                        <div className="grid grid-cols-7 gap-1">
                            {renderCalendar(currentDropoffMonth, true)}
                        </div>
                    </div>
                </div>

                {/* Selected Dates Summary */}
                {(selectedPickupDate || selectedDropoffDate) && (
                    <div className="mt-[24px] p-[16px] bg-gray-50 rounded-[12px]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[12px] text-gray-600 mb-[4px]">Selected Dates</p>
                                <div className="flex items-center gap-[16px]">
                                    {selectedPickupDate && (
                                        <span className="text-[14px] font-medium text-gray-800">
                                            Pickup: {selectedPickupDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    )}
                                    {selectedDropoffDate && (
                                        <span className="text-[14px] font-medium text-gray-800">
                                            Dropoff: {selectedDropoffDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-[16px] mt-[32px]">
                    <button
                        onClick={onClose}
                        className="flex-1 h-[48px] border border-gray-300 rounded-[24px] text-[16px] font-medium text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-all duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleProceed}
                        disabled={!selectedPickupDate || !selectedDropoffDate}
                        className="flex-1 h-[48px] bg-black rounded-[24px] text-[16px] font-semibold text-white hover:bg-gray-800 transition-all duration-200 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                        Proceed with Selection
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DateChangeModal;
