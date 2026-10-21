import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { ProductContext } from "../contexts/ProductContext";
import { LoginPageContext } from "../contexts/LoginPageContext";
import { UserContext } from "../contexts/UserContext";
import { SearchBarContext } from "../contexts/SearchBarContext";
import { postAPI } from "../caller/axiosUrls";
import { toast } from "react-hot-toast";
import {
  RENTAL_MODES,
  planUnit,
  renewalCadenceLabel,
  startingPeriodLabel,
} from "../utils/subscription";

const Cards = ({
  cards,
  isCatalog,
  selectedPlanType,
  variant = "customer",
  getSelectedQuantity,
  onSelect,
  onIncrease,
  onDecrease,
  onRemove,
  getDetailsPath,
}) => {
  const navigate = useNavigate();

  console.log("Cards component received props:", {
    selectedPlanType,
    isCatalog,
  });

  const { setSelectedProduct } = useContext(ProductContext);
  const { setShowLoginPage } = useContext(LoginPageContext);
  const { token } = useContext(UserContext);
  const {
    selectedPickup,
    selectedDropoff,
    rentalMode,
    subscriptionDuration,
    currentPlanType,
  } = useContext(SearchBarContext);
  const isBusiness = variant === "business";
  const isSubscription = !isBusiness && rentalMode === RENTAL_MODES.subscription;

  const rentalDays = Math.max(
    1,
    Math.ceil(
      (new Date(selectedDropoff?.date || Date.now()).getTime() -
        new Date(selectedPickup?.date || Date.now()).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(Math.max(0, Math.round(Number(value) || 0)));

  const formatShortDate = (value) =>
    new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });

  const getPricing = (card) => {
    const unitDays =
      selectedPlanType === "monthly"
        ? 30
        : selectedPlanType === "weekly"
        ? 7
        : 1;
    const dailyRate = (Number(card.price) || 0) / unitDays;

    if (isBusiness) {
      return {
        dailyRate: Number(card.price) || 0,
        total: Number(card.price) || 0,
        unit: "day",
      };
    }
    if (isSubscription) {
      return {
        cycleRate: Number(card.price) || 0,
        total: (Number(card.price) || 0) * subscriptionDuration,
        unit: planUnit(selectedPlanType || currentPlanType),
      };
    }
    return { dailyRate, total: dailyRate * rentalDays, unit: "day" };
  };

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
        usageModel: isSubscription ? "payg" : "one_off",
        durationUnits: isSubscription ? subscriptionDuration : undefined,
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
            rentalMode,
            usageModel: isSubscription ? "payg" : "one_off",
            subscriptionDuration: isSubscription ? subscriptionDuration : undefined,
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
        (isBusiness ? cards : cards.filter((c) => c.isAvailable)).map((card, i) => {
          const pricing = getPricing(card);
          const dailyIncludedKm = Number(card.perDayKmLimit) || Number(card.range) || 0;
          const selectedQuantity = isBusiness
            ? Number(getSelectedQuantity?.(card) || 0)
            : 0;

          const rate = isSubscription ? pricing.cycleRate : pricing.dailyRate;
          const specLine = [
            card.range ? `${card.range} km range` : null,
            card.topSpeed ? `${card.topSpeed} km/h top speed` : null,
            !card.range && Number(card.chargeTime) > 0 ? `${card.chargeTime} hr charge` : null,
          ]
            .filter(Boolean)
            .join(" · ");
          // At most two grey lines per card: specs (when known), then the km allowance.
          // Per-km and onboarding fees are shown at checkout with the deposit and GST.
          const allowanceLine =
            dailyIncludedKm > 0
              ? `${dailyIncludedKm} km/day included`
              : "Usage allowance shown at checkout";
          // Personal rentals: the whole card opens the booking flow (Airbnb-style).
          // Business cards keep their own fleet controls, so the card itself isn't a button.
          const tappable = !isBusiness && card.isAvailable;
          const actionLabel = isSubscription ? "Choose subscription" : "Rent";

          const body = (
            <>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[16px] bg-[#f1f0f3]">
                {card.isAvailable && card.availableCount <= 2 ? (
                  <span className="absolute left-[12px] top-[12px] z-20 rounded-full bg-white px-[10px] py-[5px] text-[12px] font-bold text-[#c43333] shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
                    Only {card.availableCount} left
                  </span>
                ) : null}
                <img
                  className={`${
                    !card.isAvailable ? "opacity-55 grayscale" : ""
                  } h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]`}
                  src={card.imgUrl}
                  alt=""
                  loading="lazy"
                  onError={(e) => {
                    const img = e.target;
                    const step = img.dataset.fbStep || "0";
                    if (step === "0") {
                      img.dataset.fbStep = "1";
                      img.src = "/images/Scooter.png";
                    } else if (step === "1") {
                      img.dataset.fbStep = "2";
                      img.src = "/images/placeholder.jpeg";
                    }
                  }}
                />
              </div>

              <div className="mt-[12px] flex flex-col gap-[2px] text-left">
                <h2 className={`truncate text-[16px] font-bold leading-[1.3] md:text-[17px] ${card.isAvailable ? "text-[#222222]" : "text-[#8a8a8a]"}`}>
                  {card.vehicleName}
                </h2>
                {specLine && <p className="text-[14px] leading-[1.45] text-[#6a6a6a]">{specLine}</p>}
                <p className="text-[14px] leading-[1.45] text-[#6a6a6a]">{allowanceLine}</p>
                {isSubscription && card.isAvailable && (
                  <p className="text-[14px] leading-[1.45] text-[#6a6a6a]">
                    Planned until {formatShortDate(selectedDropoff?.date)} · Renews {renewalCadenceLabel(selectedPlanType || currentPlanType)}
                  </p>
                )}
                <p className={`mt-[4px] text-[15px] leading-[1.4] ${card.isAvailable ? "text-[#222222]" : "text-[#8a8a8a]"}`}>
                  {!card.isAvailable && !isBusiness ? (
                    "Unavailable for your dates"
                  ) : (
                    !isBusiness && !isSubscription && rentalDays > 1 ? (
                      <>
                        <span className="font-bold">₹{formatCurrency(pricing.total)}</span> for {rentalDays} days
                        <span className="text-[#6a6a6a]"> · ₹{formatCurrency(rate)}/day</span>
                      </>
                    ) : (
                    <>
                      <span className="font-bold">₹{formatCurrency(rate)}</span> {pricing.unit}
                      {isBusiness ? (
                        <span className="text-[#6a6a6a]"> · Indicative business rate</span>
                      ) : isSubscription ? (
                        <span className="text-[#6a6a6a]"> · {startingPeriodLabel(selectedPlanType || currentPlanType, subscriptionDuration)} planned</span>
                      ) : null}
                    </>
                    )
                  )}
                </p>
              </div>
            </>
          );

          return (
            <article key={"card-menu-" + i} className="group flex flex-col">
              {tappable ? (
                <button
                  type="button"
                  onClick={() => handleRentNow(card)}
                  aria-label={`${actionLabel} ${card.vehicleName}, ₹${formatCurrency(rate)} per ${pricing.unit}`}
                  className="block w-full cursor-pointer rounded-[16px] text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#351a75]"
                >
                  {body}
                </button>
              ) : (
                <div aria-disabled={!card.isAvailable && !isBusiness ? true : undefined}>{body}</div>
              )}

              {isBusiness && (
                <>
                  {getDetailsPath?.(card) && (
                    <button
                      type="button"
                      onClick={() => navigate(getDetailsPath(card))}
                      className="mt-[6px] self-start text-[14px] font-bold text-[#222222] underline underline-offset-[3px]"
                    >
                      View model details
                    </button>
                  )}
                  {selectedQuantity > 0 ? (
                    <div className="mt-[12px] flex h-[44px] items-center gap-[10px]">
                      <div className="flex h-full flex-1 items-center justify-between rounded-[12px] border border-[#351a75] px-[6px] text-[#351a75]">
                        <button
                          type="button"
                          onClick={() => onDecrease?.(card)}
                          className="flex size-[36px] items-center justify-center rounded-full text-[22px] leading-none hover:bg-[#f2eef6]"
                          aria-label={`Decrease ${card.vehicleName} quantity`}
                        >
                          −
                        </button>
                        <span className="text-[15px] font-bold">{selectedQuantity} vehicles</span>
                        <button
                          type="button"
                          onClick={() => onIncrease?.(card)}
                          className="flex size-[36px] items-center justify-center rounded-full text-[20px] leading-none hover:bg-[#f2eef6]"
                          aria-label={`Increase ${card.vehicleName} quantity`}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove?.(card)}
                        className="flex h-full items-center justify-center rounded-[12px] border border-[#dedede] px-[15px] text-[14px] font-bold text-[#555555] hover:bg-[#f7f7f7]"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelect?.(card)}
                      className="mt-[12px] flex h-[44px] w-full items-center justify-center rounded-[12px] bg-[#351a75] px-[24px] text-[15px] font-bold text-white transition-colors hover:bg-[#2c155f]"
                    >
                      Add to fleet
                    </button>
                  )}
                </>
              )}
            </article>
          );
        })}

      {/* Personal rentals: sold-out models go in a short list after the bookable ones */}
      {!isBusiness && cards?.some((c) => !c.isAvailable) && (
        <section className="col-span-full border-t border-[#ebebeb] pt-[20px]" aria-label="Not available for your dates">
          <h2 className="text-[16px] font-bold text-[#222222]">Not available for your dates</h2>
          <ul className="mt-[12px] grid grid-cols-1 gap-[14px] sm:grid-cols-2 xl:grid-cols-3">
            {cards
              .filter((c) => !c.isAvailable)
              .map((card) => {
                const pricing = getPricing(card);
                const rate = isSubscription ? pricing.cycleRate : pricing.dailyRate;
                const spec = card.range ? `${card.range} km range · ` : "";
                return (
                  <li key={"unavailable-" + (card.id || card.vehicleName)} className="flex items-center gap-[12px] opacity-80">
                    <img
                      className="h-[66px] w-[88px] shrink-0 rounded-[12px] bg-[#f1f0f3] object-cover grayscale"
                      src={card.imgUrl}
                      alt=""
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/images/Scooter.png";
                      }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-bold text-[#222222]">{card.vehicleName}</p>
                      <p className="text-[13px] text-[#6a6a6a]">
                        {spec}₹{formatCurrency(rate)}/{pricing.unit}
                      </p>
                    </div>
                  </li>
                );
              })}
          </ul>
        </section>
      )}
    </>
  );
};

export default Cards;
