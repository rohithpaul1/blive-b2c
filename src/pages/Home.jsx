import Hero from "../sections/Hero";
import Navbar from "../sections/Navbar";
import CompanyCards from "../sections/CompanyCards";
import HowItWorks from "../sections/HowItWorks";
import Footer from "../sections/Footer";
import Customers from "../sections/Customers";
import WhyBlive from "../sections/WhyBlive";
import Catalogs from "../sections/Catalogs";
import { useEffect, useContext } from "react";
import { ProductContext } from "../contexts/ProductContext";
import { UserContext } from "../contexts/UserContext";

const Home = () => {
    const { setSelectedProduct } = useContext(ProductContext);
    const { fetchNotificationsCount, isAuthenticated } = useContext(UserContext);

    useEffect(() => {
        sessionStorage.removeItem('selectedProduct');
        setSelectedProduct(null);
    }, []);

    // Fetch notifications count when home page loads
    useEffect(() => {
        if (isAuthenticated) {
            fetchNotificationsCount();
        }
    }, [isAuthenticated, fetchNotificationsCount]);

    return (
        <div className="w-full overflow-x-hidden overflow-y-auto">
            <Navbar />
            <Hero />
            <CompanyCards />
            <HowItWorks />
            <Catalogs />
            <WhyBlive />
            <Customers />
            <Footer />
        </div>
    )
}

export default Home;