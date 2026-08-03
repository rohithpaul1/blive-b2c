import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { ProductContext } from "../contexts/ProductContext";
import { LoginPageContext } from "../contexts/LoginPageContext";
import { UserContext } from "../contexts/UserContext";
import { SearchBarContext } from "../contexts/SearchBarContext";
import { postAPI } from "../caller/axiosUrls";
import { toast } from "react-hot-toast";

const Cards = ({ cards, isCatalog, selectedPlanType }) => {
  const navigate = useNavigate();

  console.log("Cards component received props:", {
    selectedPlanType,
    isCatalog,
  });

  const { setSelectedProduct } = useContext(ProductContext);
  const { setShowLoginPage } = useContext(LoginPageContext);
  const { token } = useContext(UserContext);
  const { selectedPickup, selectedDropoff } = useContext(SearchBarContext);

  // Helper function to format date and time for API
  const formatDateTimeForAPI = (date, time) => {
    if (!date) return null;

    // Parse time string (e.g., "10 AM", "2 PM")
    const parseTime = (timeStr) => {
      const [time, modifier] = timeStr.split(" ");
      let [hours, minutes] = time.split(":");
      if (!minutes) minutes = "00";

      hours = parseInt(hours, 10);
      if (modifier.toUpperCase() === "PM" && hours < 12) {
        hours += 12;
      }
      if (modifier.toUpperCase() === "AM" && hours === 12) {
        hours = 0;
      }

      return `${hours.toString().padStart(2, "0")}:${minutes}`;
    };

    // Treat the selected clock as local time, then send the corresponding
    // instant. Appending `Z` to the wall-clock value shifts Indian selections
    // by +5:30 when they are displayed again after checkout.
    const dateObj = new Date(date);
    const timeStr = parseTime(time || "10 AM");
    const [hours, minutes] = timeStr.split(":").map(Number);
    dateObj.setHours(hours, minutes, 0, 0);
    return dateObj.toISOString();
  };

  // Function to call dynamic calculation API
  const callDynamicCalculationAPI = async (card) => {
    try {
      // Format dates for API
      const pickupDate = formatDateTimeForAPI(
        selectedPickup?.date,
        selectedPickup?.time
      );
      const dropoffDate = formatDateTimeForAPI(
        selectedDropoff?.date,
        selectedDropoff?.time
      );

      if (!pickupDate || !dropoffDate) {
        toast.error("Please select pickup and dropoff dates");
        return null;
      }

      // Determine rate plan based on selectedPlanType prop or card data
      let ratePlan = selectedPlanType || "daily";

      console.log("=== CARDS RATE PLAN DEBUG ===");
      console.log("selectedPlanType prop:", selectedPlanType);
      console.log("card.planName:", card.planName);
      console.log("ratePlan determined:", ratePlan);
      console.log("=== END CARDS DEBUG ===");

      // If selectedPlanType is not available, fallback to card data
      if (!selectedPlanType && card.planName) {
        if (card.planName.toLowerCase().includes("weekly")) {
          ratePlan = "weekly";
        } else if (card.planName.toLowerCase().includes("monthly")) {
          ratePlan = "monthly";
        }
      }

      const requestData = {
        vehicleModelId: card.id,
        pickupDate: pickupDate,
        dropoffDate: dropoffDate,
        planId: card.planId,
        ratePlan: ratePlan,
        isHomeDelivery: true,
      };

      // Note: promoCodeId will be added later when user apples a coupon

      console.log("Calling dynamic calculation API with:", requestData);
      console.log("API call details:", {
        selectedPlanType,
        cardPlanName: card.planName,
        finalRatePlan: ratePlan,
        isCatalog,
      });

      const response = await postAPI(
        "/vehicle-plan/dynamic-calculation",
        requestData
      );

      if (response.status === "success") {
        console.log("--------Dynamic calculation response:", response.data);
        return response.data;
      } else {
        throw new Error(response.message || "Failed to calculate pricing");
      }
    } catch (error) {
      console.error("Dynamic calculation error:", error);
      toast.error(
        error.message || "Failed to calculate pricing. Please try again."
      );
      return null;
    }
  };

  const handleRentNow = async (card) => {
    if (!card.isAvailable) return; // Don't proceed if vehicle is not available

    if (isCatalog) {
      // If it's from catalog, store the selected plan type and navigate to search page
      if (selectedPlanType) {
        sessionStorage.setItem("selectedPlanType", selectedPlanType);
        // Find the tab index for the selected plan type
        const planTypes = [
          { name: "Daily", planType: "daily" },
          { name: "Weekly", planType: "weekly" },
          { name: "Monthly", planType: "monthly" },
        ];
        const tabIndex = planTypes.findIndex(
          (plan) => plan.planType === selectedPlanType
        );
        if (tabIndex !== -1) {
          sessionStorage.setItem("selectedTabIndex", tabIndex.toString());
        }
      }
      navigate("/search");
    } else {
      // If it's from search page, proceed with booking
      try {
        // Call dynamic calculation API first
        const calculationData = await callDynamicCalculationAPI(card);

        if (calculationData) {
          // Determine rate plan for the enhanced card
          let ratePlan = selectedPlanType || "daily";

          console.log("=== CARDS ENHANCED CARD DEBUG ===");
          console.log("Before creating enhancedCard - ratePlan:", ratePlan);
          console.log(
            "Before creating enhancedCard - selectedPlanType:",
            selectedPlanType
          );

          // Merge card data with calculation data
          const enhancedCard = {
            ...card,
            calculationData: calculationData,
            selectedPlanType: ratePlan, // Store the selected plan type
          };

          console.log(
            "After creating enhancedCard - selectedPlanType:",
            enhancedCard.selectedPlanType
          );
          console.log(
            "Storing to sessionStorage:",
            JSON.stringify({ selectedPlanType: enhancedCard.selectedPlanType })
          );
          console.log("=== END ENHANCED CARD DEBUG ===");

          setSelectedProduct(enhancedCard);
          sessionStorage.setItem(
            "selectedProduct",
            JSON.stringify(enhancedCard)
          );

          // Check authentication
          if (token) {
            // User is logged in, proceed to booking
            navigate("/booking");
          } else {
            // User is not logged in, show login page
            setShowLoginPage(true);
          }
        } else {
          // If calculation failed, still proceed with basic card data
          setSelectedProduct(card);
          sessionStorage.setItem("selectedProduct", JSON.stringify(card));

          // Check authentication
          if (token) {
            navigate("/booking");
          } else {
            setShowLoginPage(true);
          }
        }
      } catch (error) {
        console.error("Error in handleRentNow:", error);
        // Fallback: proceed with basic card data
        setSelectedProduct(card);
        sessionStorage.setItem("selectedProduct", JSON.stringify(card));

        if (token) {
          navigate("/booking");
        } else {
          setShowLoginPage(true);
        }
      }
    }
  };

  return (
    <>
      {cards &&
        cards.map((card, i) => (
          <div
            key={"card-menu-" + i}
            className="bg-white rounded-[24px] overflow-hidden flex flex-col items-center justify-center border border-[#0000001A]"
          >
            <div className="relative flex-1 w-full h-[200px] bg-[#F5F5F5]">
              {" "}
              {/* Fixed height + neutral bg so mixed photos frame consistently */}
              {!card.isAvailable && (
                <div className="absolute z-20 top-[16px] left-[16px] flex items-center rounded-[6px] py-[6px] px-[8px] gap-x-[6px] bg-white not-available-info">
                  <img
                    className="w-[20px] aspect-square"
                    src="/images/solar_scooter-outline.png"
                    alt="Scooter Outline Icon"
                  />
                  <p className="font-bold text-[12px]">
                    Next available on {card.nextAvailableDate}
                  </p>
                </div>
              )}
              <img
                className={
                  (!card.isAvailable ? "opacity-[50%] " : "") +
                  `w-full h-full object-contain object-center p-[10px]`
                }
                src={card.imgUrl}
                alt="Scooter Image"
                onError={(e) => {
                  // Fall back in fixed steps and then STOP, so a missing image
                  // can never loop (setting src to another 404 re-fires onError).
                  const img = e.target;
                  const step = img.dataset.fbStep || "0";
                  if (step === "0") {
                    img.dataset.fbStep = "1";
                    img.src = `/images/${card.brandName}.png`;
                  } else if (step === "1") {
                    img.dataset.fbStep = "2";
                    img.src = "/images/placeholder.jpeg";
                  }
                  // step "2": give up — no further swaps, loop cannot continue.
                }}
              />
              <div className="absolute inset-0 z-10 image-gradient" />
            </div>
            <div className="flex-1 w-full pt-[12px] pb-[20px] px-[24px]">
              <p className="opacity-[80%] font-medium text-[20px]">
                {card.vehicleName}
              </p>
              <p className="mt-[8px] opacity-[80%] font-[900] text-[32px]">
                ₹{card.price}
                {card.actualPrice && (
                  <span className="text-[22px] font-normal text-[#808080]">
                    {" "}
                    <span className="line-through">₹{399}</span>
                  </span>
                )}
                <span className="font-medium text-[16px] text-[#00000080]">
                  /day
                </span>
              </p>
              <div className="mt-[16px] flex items-center justify-between rounded-[16px] py-[8px] px-[24px] gap-[8px] bg-[#F6F6F6] opacity-[70%]">
                <div className="flex flex-col items-center gap-y-[6px]">
                  <img
                    className="w-[20px] aspect-square"
                    src="/images/speedometer-01.png"
                    alt="Speedometer Icon"
                  />
                  <p className="font-medium text-[14px]">{card.range} km</p>
                </div>
                <div className="flex flex-col items-center gap-y-[6px]">
                  <img
                    className="w-[20px] aspect-square"
                    src="/images/bi_stopwatch.png"
                    alt="Stopwatch Icon"
                  />
                  <p className="font-medium text-[14px]">
                    {card.topSpeed} km/Hr
                  </p>
                </div>
                <div className="flex flex-col items-center gap-y-[6px]">
                  <img
                    className="w-[20px] aspect-square"
                    src="/images/mdi_battery-charging-outline.png"
                    alt="Battery Icon"
                  />
                  <p className="font-medium text-[14px]">
                    {card.chargeTime} Hr
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleRentNow(card)}
                className={
                  (!card.isAvailable ? "opacity-[20%] " : "cursor-pointer ") +
                  "flex w-full font-medium items-center justify-center mt-[24px] rounded-[32px] border border-black py-[12px] px-[24px]"
                }
                disabled={!card.isAvailable}
              >
                {!card.isAvailable ? "Unavailable" : "Rent Now"}
              </button>
            </div>
          </div>
        ))}
    </>
  );
};

export default Cards;
