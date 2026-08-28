import './App.css'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { lazy, Suspense, useContext, useEffect } from 'react';
import { UserContext } from './contexts/UserContext';
import { LoginPageProvider } from './contexts/LoginPageContext';
import FullPageLoader from './components/FullPageLoader';

// Route-level code splitting: each page ships as its own chunk instead of
// all ~20 pages bundling into one multi-megabyte JS file every visitor
// downloads on first load. FullPageLoader (already used for the auth-loading
// state below) doubles as the Suspense fallback so there's no new loading UI.
const Home = lazy(() => import('./pages/Home'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const Booking = lazy(() => import('./pages/Booking'));
const MyBookings = lazy(() => import('./pages/MyBookings'));
const BookingDetails = lazy(() => import('./pages/BookingDetails'));
const Profile = lazy(() => import('./pages/Profile'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Wallet = lazy(() => import('./pages/Wallet'));
const Business = lazy(() => import('./pages/Business'));
const BusinessVehicle = lazy(() => import('./pages/BusinessVehicle'));
const BusinessPortalAccess = lazy(() => import('./pages/BusinessPortalAccess'));
const BusinessPortal = lazy(() => import('./pages/BusinessPortal'));

const App = () => {
  const { loading } = useContext(UserContext);

  useEffect(() => {
    if (loading) return;
  }, [loading]);

  return (
    <LoginPageProvider>
      {loading && <FullPageLoader />}
      <Router>
        <Toaster position="bottom-right" reverseOrder={false} />
        <Suspense fallback={<FullPageLoader />}>
          <Routes>
            <Route path="/home" element={<Home />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/booking/:bid" element={<BookingDetails />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/help-center" element={<HelpCenter />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/business" element={<Business />} />
            <Route path="/business/vehicles/:modelId" element={<BusinessVehicle />} />
            <Route path="/business/access" element={<BusinessPortalAccess />} />
            <Route path="/business/portal" element={<BusinessPortal />} />
            <Route path="/" element={<Navigate to="/home" />} />
            <Route path="*" element={<Navigate to="/home" />} />
          </Routes>
        </Suspense>
      </Router>
    </LoginPageProvider>
  )
}

export default App
