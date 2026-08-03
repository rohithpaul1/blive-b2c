import { createContext, useState, useEffect, useContext } from "react";
import { getAPI, putAPI } from "../caller/axiosUrls";

const UserContext = createContext();

const UserProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unseenNotificationsCount, setUnseenNotificationsCount] = useState(0);
  
  // Check if user is authenticated - more flexible check
  const isAuthenticated = token && userData && (userData.id || userData.phoneNumber);

  // Fetch notifications count
  const fetchNotificationsCount = async () => {
    if (!isAuthenticated || !userData?.id) {
      setUnseenNotificationsCount(0);
      return;
    }

    try {
      console.log('🔍 Fetching notifications count for user:', userData.id);
      const response = await getAPI(`/vehicle-plan/notifications?userId=${userData.id}`);
      
      if (response.status === 'success' && response.data) {
        const unseenCount = response.data.unseenCount || 0;
        setUnseenNotificationsCount(unseenCount);
        console.log('🔍 Updated unseen notifications count:', unseenCount);
      }
    } catch (error) {
      console.error('Error fetching notifications count:', error);
      setUnseenNotificationsCount(0);
    }
  };

  // Mark all notifications as seen
  const markAllNotificationsAsSeen = async () => {
    if (!isAuthenticated || !userData?.id) {
      console.log('🔍 Cannot mark notifications as seen - not authenticated or no user ID');
      return;
    }

    try {
      console.log('🔍 Marking all notifications as seen for user:', userData.id);
      console.log('🔍 Calling API: PUT /vehicle-plan/notifications/mark-all-seen?userId=' + userData.id);
      
      const response = await putAPI(`/vehicle-plan/notifications/mark-all-seen?userId=${userData.id}`);
      
      console.log('🔍 Mark all seen API response:', response);
      
      if (response.status === 'success') {
        // Immediately set count to 0
        setUnseenNotificationsCount(0);
        console.log('🔍 All notifications marked as seen, count reset to 0');
      } else {
        console.log('🔍 Mark all seen API failed:', response.message);
      }
    } catch (error) {
      console.error('Error marking notifications as seen:', error);
    }
  };
  
  // console.log('🔍 DEBUG: Authentication status:', { isAuthenticated, loading }); // Uncomment for debugging

  // Temporary bypass for testing - REMOVE THIS IN PRODUCTION
  const tempSimulateLogin = () => {
    const mockToken = "temp-token-" + Date.now();
    const mockUserData = {
      id: "temp-user-id",
      firstName: "Test",
      lastName: "User",
      phoneNumber: "1234567890"
    };
    
    localStorage.setItem('token', mockToken);
    localStorage.setItem('userData', JSON.stringify(mockUserData));
    sessionStorage.setItem('token', mockToken);
    sessionStorage.setItem('userData', JSON.stringify(mockUserData));
    
    setToken(mockToken);
    setUserData(mockUserData);
    
    console.log('🧪 TEMP: Simulated login for testing');
  };

  // Expose tempSimulateLogin globally for testing
  if (typeof window !== 'undefined') {
    window.tempSimulateLogin = tempSimulateLogin;
  }

  // Logout function to clear authentication
  const logout = () => {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userData');
    
    // Clear other session data
    sessionStorage.removeItem('selectedProduct');
    sessionStorage.removeItem('selectedPlanType');
    sessionStorage.removeItem('selectedTabIndex');
    sessionStorage.removeItem('selectedPickupDate');
    sessionStorage.removeItem('selectedDropoffDate');
    
    // Reset state
    setToken(null);
    setUserData(null);
    setUnseenNotificationsCount(0);
    
    console.log('✅ User logged out successfully');
  }; 

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
      const storedUserData = localStorage.getItem("userData") || sessionStorage.getItem("userData");
      
      console.log('🔍 DEBUG: Restoring auth from storage:', { 
        token: storedToken, 
        userData: storedUserData,
        hasToken: !!storedToken,
        hasUserData: !!storedUserData
      });
      
      if (storedToken && storedUserData) {
        const parsedUserData = JSON.parse(storedUserData);
        console.log('🔍 DEBUG: Parsed user data:', parsedUserData);
        
        setToken(storedToken);
        setUserData(parsedUserData);
        
        // Check if authentication will work
        const willBeAuthenticated = storedToken && parsedUserData && (parsedUserData.id || parsedUserData.phoneNumber);
        console.log('🔍 DEBUG: Will be authenticated:', willBeAuthenticated, {
          hasToken: !!storedToken,
          hasUserData: !!parsedUserData,
          hasId: !!parsedUserData?.id,
          hasPhoneNumber: !!parsedUserData?.phoneNumber
        });
      } else {
        console.log('🔍 DEBUG: No stored credentials found');
        setToken(null);
        setUserData(null);
      }
    } catch (error) {
      console.error('❌ Error loading auth from storage:', error);
      setToken(null);
      setUserData(null);
    }
    setLoading(false); 
  }, []);

  // Fetch notifications count when user data is available
  useEffect(() => {
    if (isAuthenticated && userData?.id) {
      fetchNotificationsCount();
    } else {
      setUnseenNotificationsCount(0);
    }
  }, [isAuthenticated, userData?.id]);

  return (
    <UserContext.Provider value={{ token, setToken, userData, setUserData, loading, isAuthenticated, logout, unseenNotificationsCount, setUnseenNotificationsCount, fetchNotificationsCount, markAllNotificationsAsSeen }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use UserContext
const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// eslint-disable-next-line react-refresh/only-export-components
export { UserContext, UserProvider, useUser };