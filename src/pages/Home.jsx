import Navbar from "../sections/Navbar";
import HomeHero from "../sections/home/HomeHero";
import PlanCards, { SubscribeBand } from "../sections/home/PlanCards";
import { ScooterSpotlight, BenefitTiles, HomeSteps } from "../sections/home/ScooterSpotlight";
import PlanPicker from "../sections/home/PlanPicker";
import { RiderQuote, MoreBlive, HomeFaq, HomeFooter } from "../sections/home/HomeClosing";
import { useEffect, useContext } from "react";
import { ProductContext } from "../contexts/ProductContext";
import { UserContext } from "../contexts/UserContext";

// Direction A: plan-first homepage for a one-model, one-hub franchise site.
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
        <div className="home-a w-full overflow-x-hidden overflow-y-auto bg-white text-[#1c1a22]">
            <Navbar />
            <HomeHero />
            <SubscribeBand />
            <PlanCards />
            <ScooterSpotlight />
            <BenefitTiles />
            <HomeSteps />
            <PlanPicker />
            <RiderQuote />
            <MoreBlive />
            <HomeFaq />
            <HomeFooter />
        </div>
    )
}

export default Home;
