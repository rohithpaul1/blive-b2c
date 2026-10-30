import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ProductContext } from "../contexts/ProductContext";
import { LoginPageContext } from "../contexts/LoginPageContext";
import { UserContext } from "../contexts/UserContext";
import { SearchBarContext } from "../contexts/SearchBarContext";
import { postAPI } from "../caller/axiosUrls";
import { RENTAL_MODES, planUnit } from "../utils/subscription";
import { billableDays } from "../utils/timeSlots";

// Booking hand-off for the personal search page: price a model for the chosen
// plan and dates, store it as the selected product, then go to /booking (or
// open login first). Same request and stored shape as Cards' Rent flow.

const UNIT_DAYS = { daily: 1, weekly: 7, monthly: 30 };

const formatDateTimeForAPI = (date, time) => {
  if (!date) return null;
  const [clock = "10", modifier = "AM"] = String(time || "10 AM").split(" ");
  let [hours, minutes = "00"] = clock.split(":");
  hours = parseInt(hours, 10);
  if (modifier.toUpperCase() === "PM" && hours < 12) hours += 12;
  if (modifier.toUpperCase() === "AM" && hours === 12) hours = 0;
  // Local wall-clock time, sent as the matching instant.
  const value = new Date(date);
  value.setHours(hours, Number(minutes), 0, 0);
  return value.toISOString();
};

export default function useRentNow() {
  const navigate = useNavigate();
  const { setSelectedProduct } = useContext(ProductContext);
  const { setShowLoginPage } = useContext(LoginPageContext);
  const { token } = useContext(UserContext);
  const { selectedPickup, selectedDropoff, rentalMode, subscriptionDuration } = useContext(SearchBarContext);
  const isSubscription = rentalMode === RENTAL_MODES.subscription;

  // Every started 24 hours is a day, counted from the chosen pickup and return times.
  const rentalDays = Math.max(
    1,
    billableDays(selectedPickup?.date, selectedPickup?.time, selectedDropoff?.date, selectedDropoff?.time)
  );

  // price is the plan's own price (per day, week or month).
  const pricingFor = (price, planType) => {
    const amount = Number(price) || 0;
    if (isSubscription) {
      return { perUnit: amount, unit: planUnit(planType), total: amount * subscriptionDuration, days: null, units: Number(subscriptionDuration) || 1 };
    }
    const dailyRate = amount / (UNIT_DAYS[planType] || 1);
    return { perUnit: dailyRate, unit: "day", total: dailyRate * rentalDays, days: rentalDays };
  };

  const proceed = (product) => {
    setSelectedProduct(product);
    sessionStorage.setItem("selectedProduct", JSON.stringify(product));
    if (token) navigate("/booking");
    else setShowLoginPage(true);
  };

  const rentNow = async (card, planType) => {
    if (!card?.isAvailable) return;
    const pickupDate = formatDateTimeForAPI(selectedPickup?.date, selectedPickup?.time);
    const dropoffDate = formatDateTimeForAPI(selectedDropoff?.date, selectedDropoff?.time);
    if (!pickupDate || !dropoffDate) {
      toast.error("Please select pickup and return dates");
      return;
    }
    const base = {
      ...card,
      selectedPlanType: planType,
      rentalMode,
      usageModel: isSubscription ? "payg" : "one_off",
      subscriptionDuration: isSubscription ? subscriptionDuration : undefined,
    };
    try {
      const response = await postAPI("/vehicle-plan/dynamic-calculation", {
        vehicleModelId: card.id,
        pickupDate,
        dropoffDate,
        planId: card.planId,
        ratePlan: planType,
        isHomeDelivery: true,
        usageModel: isSubscription ? "payg" : "one_off",
        durationUnits: isSubscription ? subscriptionDuration : undefined,
      });
      if (response.status !== "success") throw new Error(response.message || "Failed to calculate pricing");
      proceed({ ...base, calculationData: response.data });
    } catch (error) {
      console.error("Dynamic calculation error:", error);
      toast.error(error.message || "Couldn't calculate the price. Continuing with the plan price.");
      proceed(base);
    }
  };

  return { rentNow, pricingFor, rentalDays, isSubscription };
}
