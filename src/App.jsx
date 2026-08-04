import './App.css'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import SearchPage from './pages/SearchPage';
import { useContext, useEffect } from 'react';
import { UserContext } from './contexts/UserContext';
import { LoginPageProvider } from './contexts/LoginPageContext';
import FullPageLoader from './components/FullPageLoader';
import Booking from './pages/Booking';
import MyBookings from './pages/MyBookings';
import BookingDetails from './pages/BookingDetails';
import Profile from './pages/Profile';
import HelpCenter from './pages/HelpCenter';
import Notifications from './pages/Notifications';
import Wallet from './pages/Wallet';
import Business from './pages/Business';
import BusinessVehicle from './pages/BusinessVehicle';
import BusinessPortalAccess from './pages/BusinessPortalAccess';
import BusinessPortal from './pages/BusinessPortal';

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
      </Router>
    </LoginPageProvider>
  )
}

export default App
