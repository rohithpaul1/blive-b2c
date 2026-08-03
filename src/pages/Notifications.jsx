import { useState, useEffect, useContext } from 'react';
import Navbar from '../sections/Navbar';
import NotificationItem from '../components/NotificationItem';
import { getAPI } from '../caller/axiosUrls';
import { UserContext } from '../contexts/UserContext';
import { LoginPageContext } from '../contexts/LoginPageContext';
import Login from '../components/Login';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';

const NotificationsList = ({ notifications }) => {
  return (
    <div className="flex flex-col w-full">
      {notifications.map((n, i) => (
        <NotificationItem
          key={i}
          title={n.title}
          message={n.message}
          timeAgo={n.timeAgo}
          read={n.read}
        />
      ))}
    </div>
  );
};

const Notifications = () => {
    const { userData, isAuthenticated, loading, setUnseenNotificationsCount, markAllNotificationsAsSeen } = useContext(UserContext);
    const [notifications, setNotifications] = useState([]);
    const [unseenCount, setUnseenCount] = useState(0);
    const [loadingNotifications, setLoadingNotifications] = useState(true);
    const [error, setError] = useState(null);

    // Format date to time ago
    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now - date;
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

        if (diffInDays > 0) {
            return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
        } else if (diffInHours > 0) {
            return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        } else if (diffInMinutes > 0) {
            return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    };

    // Fetch notifications from API
    const fetchNotifications = async () => {
        if (!isAuthenticated || !userData?.id) {
            setLoadingNotifications(false);
            return;
        }

        try {
            setLoadingNotifications(true);
            setError(null);
            
            console.log('🔍 Fetching notifications for user:', userData.id);
            
            const response = await getAPI(`/vehicle-plan/notifications?userId=${userData.id}`);
            
            console.log('🔍 Notifications API response:', response);
            
            if (response.status === 'success' && response.data) {
                const notificationsData = response.data.notifications || [];
                const unseenCountData = response.data.unseenCount || 0;
                
                // Transform API data to component format
                const transformedNotifications = notificationsData.map(notification => ({
                    id: notification.id,
                    title: getNotificationTitle(notification.category, notification.type),
                    message: notification.message,
                    timeAgo: formatTimeAgo(notification.createdAt),
                    read: notification.status === 'seen',
                    status: notification.status,
                    category: notification.category,
                    type: notification.type,
                    createdAt: notification.createdAt
                }));
                
                setNotifications(transformedNotifications);
                setUnseenCount(unseenCountData);
                
                // Update global unseen count in context
                setUnseenNotificationsCount(unseenCountData);
                
                console.log('🔍 Transformed notifications:', transformedNotifications);
                console.log('🔍 Unseen count:', unseenCountData);
            } else {
                setError(response.message || 'Failed to fetch notifications');
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setError(error.message || 'Failed to fetch notifications');
            toast.error('Failed to load notifications');
        } finally {
            setLoadingNotifications(false);
        }
    };

    // Get notification title based on category and type
    const getNotificationTitle = (category, type) => {
        if (category === 'other') {
            switch (type) {
                case 2:
                    return 'Booking Update';
                default:
                    return 'Notification';
            }
        }
        return 'Notification';
    };

    useEffect(() => {
        fetchNotifications();
    }, [isAuthenticated, userData?.id]);

    // Mark all notifications as seen when Notifications page loads
    useEffect(() => {
        if (isAuthenticated && userData?.id) {
            markAllNotificationsAsSeen();
        }
    }, [isAuthenticated, userData?.id, markAllNotificationsAsSeen]);

    // Show loading if user data is still loading
    if (loading) {
        return <Loader />;
    }

    // Show login if not authenticated
    if (!isAuthenticated || !userData) {
        return <Login />;
    }
    
    return (
        <>
            <div className="w-full h-dvh overflow-x-hidden flex flex-col items-center">
                <Navbar onSearchPage={false} expanded={true} />
                <div className="mt-[124px] flex items-center w-full border-y border-[#EDEDED] py-[24px] px-[40px] gap-x-[16px]">
                    <p className="font-bold text-[28px] text-[#222222]">Notifications</p>
                    {unseenCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {unseenCount}
                        </span>
                    )}
                </div>
                <div className="flex-1 w-[80%] py-[32px] grow flex" >
                    {loadingNotifications ? (
                        <div className="flex items-center justify-center w-full">
                            <Loader />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center w-full">
                            <p className="text-red-500 text-lg font-medium mb-4">{error}</p>
                            <button 
                                onClick={fetchNotifications}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            >
                                Retry
                            </button>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex items-center justify-center w-full">
                            <p className="text-gray-500 text-lg">No notifications yet</p>
                        </div>
                    ) : (
                        <NotificationsList notifications={notifications} />
                    )}
                </div>
            </div>
        </>
    )
}

export default Notifications;