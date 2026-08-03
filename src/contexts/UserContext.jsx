import { createContext, useCallback, useEffect, useMemo, useState, useContext } from "react";
import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { getAPI, putAPI } from "../caller/axiosUrls";

const UserContext = createContext();

const UserProvider = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const remoteProfile = useQuery(
    "b2c/auth:currentProfile",
    isAuthenticated ? {} : "skip"
  );
  const completeProfileMutation = useMutation("b2c/auth:completeProfile");
  const [userData, setUserData] = useState(null);
  const [unseenNotificationsCount, setUnseenNotificationsCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) setUserData(null);
    else if (remoteProfile !== undefined) setUserData(remoteProfile);
  }, [isAuthenticated, remoteProfile]);

  const token = isAuthenticated ? "convex-session" : null;
  const loading = authLoading || (isAuthenticated && remoteProfile === undefined);

  const fetchNotificationsCount = useCallback(async () => {
    if (!isAuthenticated || !userData?.id) {
      setUnseenNotificationsCount(0);
      return;
    }
    try {
      const response = await getAPI(`/vehicle-plan/notifications?userId=${userData.id}`);
      setUnseenNotificationsCount(response.data?.unseenCount || 0);
    } catch {
      setUnseenNotificationsCount(0);
    }
  }, [isAuthenticated, userData?.id]);

  const markAllNotificationsAsSeen = useCallback(async () => {
    if (!isAuthenticated || !userData?.id) return;
    const response = await putAPI(`/vehicle-plan/notifications/mark-all-seen?userId=${userData.id}`);
    if (response.status === "success") setUnseenNotificationsCount(0);
  }, [isAuthenticated, userData?.id]);

  useEffect(() => {
    fetchNotificationsCount();
  }, [fetchNotificationsCount]);

  const logout = useCallback(async () => {
    await signOut();
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    for (const key of [
      "token",
      "userData",
      "selectedProduct",
      "selectedPlanType",
      "selectedTabIndex",
      "selectedPickupDate",
      "selectedDropoffDate",
    ]) {
      sessionStorage.removeItem(key);
    }
    setUserData(null);
    setUnseenNotificationsCount(0);
  }, [signOut]);

  const completeDriverProfile = useCallback(async (input) => {
    const profile = await completeProfileMutation(input);
    setUserData(profile);
    return profile;
  }, [completeProfileMutation]);

  const value = useMemo(() => ({
    token,
    userData,
    setUserData,
    loading,
    isAuthenticated,
    logout,
    completeDriverProfile,
    unseenNotificationsCount,
    setUnseenNotificationsCount,
    fetchNotificationsCount,
    markAllNotificationsAsSeen,
  }), [
    token,
    userData,
    loading,
    isAuthenticated,
    logout,
    completeDriverProfile,
    unseenNotificationsCount,
    fetchNotificationsCount,
    markAllNotificationsAsSeen,
  ]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};

// eslint-disable-next-line react-refresh/only-export-components
export { UserContext, UserProvider, useUser };
