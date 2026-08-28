import { createContext, useCallback, useEffect, useMemo, useState, useContext } from "react";
import { getAPI, patchAPI } from "../caller/axiosUrls";
import { getAccessToken, setSessionTokens, clearSessionTokens } from "../lib/authSession";

const UserContext = createContext();

/**
 * Maps the new REST backend's flat `customer` shape onto the field names
 * the rest of the app already reads (firstName/lastName/phoneNumber/
 * profileUrl — leftover from the old Convex profile shape). This is a shim
 * on purpose: every existing consumer (Profile.jsx, Booking.jsx,
 * ModifyDates.jsx, ProfileDropdown.jsx, ...) keeps working unchanged instead
 * of needing edits scattered across ~8 files for a backend rename.
 */
const shapeCustomer = (customer) => {
  if (!customer) return null;
  const [firstName = "", ...rest] = (customer.name || "").trim().split(/\s+/).filter(Boolean);
  const lastName = rest.join(" ");
  return {
    ...customer, // id, tenantId, phone, name, email, planId, walletBalance, status, ekycStatus, createdAt, updatedAt
    firstName,
    lastName,
    phoneNumber: customer.phone,
    profileUrl: null,
    profileImage: null,
  };
};

const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unseenNotificationsCount, setUnseenNotificationsCount] = useState(0);

  // Session bootstrap: a stored access token means a previous visit logged
  // in — confirm it's still good by fetching the profile it belongs to.
  // A 401 here is handled by the shared interceptor (clears storage,
  // reloads) so there's no separate failure path to write here.
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const customer = await getAPI("/customers/me");
        setUserData(shapeCustomer(customer));
        setIsAuthenticated(true);
      } catch {
        clearSessionTokens();
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const token = isAuthenticated ? getAccessToken() : null;

  // Mirror the customer id/name to localStorage whenever userData changes,
  // regardless of which code path updated it (login, the bootstrap fetch
  // above, refreshUserData, completeDriverProfile, Profile.jsx's own
  // setUserData after an image upload). userData.id/name are already
  // available everywhere in the app via this context (see shapeCustomer's
  // spread of the full /customers/me shape) — this is a small, additional,
  // framework-independent copy for code that needs the customer id without
  // being inside the React tree (e.g. analytics/error reporting hooked up
  // later). Doesn't change how anything already reads it.
  useEffect(() => {
    if (userData?.id) {
      localStorage.setItem("customerId", userData.id);
      if (userData.name) localStorage.setItem("customerName", userData.name);
      else localStorage.removeItem("customerName");
    } else {
      localStorage.removeItem("customerId");
      localStorage.removeItem("customerName");
    }
  }, [userData]);

  // /vehicle-plan/notifications doesn't exist on the new B2C backend (not in
  // its API spec at all) — was always 404ing. Disabled until there's a real
  // notifications endpoint to call; badge just stays at 0 in the meantime.
  const fetchNotificationsCount = useCallback(async () => {
    setUnseenNotificationsCount(0);
    // if (!isAuthenticated || !userData?.id) {
    //   setUnseenNotificationsCount(0);
    //   return;
    // }
    // try {
    //   const response = await getAPI(`/vehicle-plan/notifications?userId=${userData.id}`);
    //   setUnseenNotificationsCount(response.data?.unseenCount || 0);
    // } catch {
    //   setUnseenNotificationsCount(0);
    // }
  }, []);

  const markAllNotificationsAsSeen = useCallback(async () => {
    setUnseenNotificationsCount(0);
    // if (!isAuthenticated || !userData?.id) return;
    // const response = await putAPI(`/vehicle-plan/notifications/mark-all-seen?userId=${userData.id}`);
    // if (response.status === "success") setUnseenNotificationsCount(0);
  }, []);

  useEffect(() => {
    fetchNotificationsCount();
  }, [fetchNotificationsCount]);

  /**
   * Called with the full /auth/verify-otp response right after a successful
   * login — stores the token pair and the customer it returned, synchronously
   * (no separate profile fetch needed, unlike the old Convex flow where the
   * profile only showed up later via a reactive query).
   */
  const loginWithSession = useCallback(({ accessToken, refreshToken, customer }) => {
    setSessionTokens({ accessToken, refreshToken });
    setUserData(shapeCustomer(customer));
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    clearSessionTokens();
    for (const key of [
      "userData",
      "selectedProduct",
      "selectedPlanType",
      "selectedTabIndex",
      "selectedPickupDate",
      "selectedDropoffDate",
    ]) {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    }
    setUserData(null);
    setIsAuthenticated(false);
    setUnseenNotificationsCount(0);
  }, []);

  // Re-fetches GET /customers/me and replaces userData with the live result.
  // loginWithSession/the bootstrap effect above already populate userData
  // once, but nothing else in the app keeps it in sync afterwards — a page
  // like Profile.jsx that wants to be sure it's showing the current wallet
  // balance / eKYC status / name rather than whatever was true at login (or
  // at last app bootstrap) should call this on mount.
  const refreshUserData = useCallback(async () => {
    const customer = await getAPI("/customers/me");
    const profile = shapeCustomer(customer);
    setUserData(profile);
    return profile;
  }, []);

  // Same input shape NewUserPage.jsx already sends ({firstName, lastName}) —
  // only the internal call target changed (PATCH /customers/me instead of a
  // Convex mutation), so that call site needs no changes.
  const completeDriverProfile = useCallback(async (input) => {
    const name = [input.firstName, input.lastName].filter(Boolean).join(" ");
    const customer = await patchAPI("/customers/me", { name });
    const profile = shapeCustomer(customer);
    setUserData(profile);
    return profile;
  }, []);

  const value = useMemo(() => ({
    token,
    userData,
    setUserData,
    loading,
    isAuthenticated,
    loginWithSession,
    logout,
    completeDriverProfile,
    refreshUserData,
    unseenNotificationsCount,
    setUnseenNotificationsCount,
    fetchNotificationsCount,
    markAllNotificationsAsSeen,
  }), [
    token,
    userData,
    loading,
    isAuthenticated,
    loginWithSession,
    logout,
    completeDriverProfile,
    refreshUserData,
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
