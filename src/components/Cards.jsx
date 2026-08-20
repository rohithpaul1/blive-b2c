import { useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
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

const OEM_LOGOS = [
  { match: "ather", src: "/images/Ather.png" },
  { match: "tvs", src: "/images/TVS.png" },
  { match: "hero", src: "/images/HeroHonda.png" },
  { match: "bounce", src: "/images/Bounce.png" },
  { match: "ola", src: "/images/Ola.png" },
];

const getOemIdentity = (card) => {
  const label =
    card.brandName ||
    card.manufacturer ||
    card.vehicleName?.split(" ")[0] ||
    "EV";
  const searchableName = [
    card.brandName,
    card.manufacturer,
    card.vehicleName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const logo = OEM_LOGOS.find(({ match }) => searchableName.includes(match));
  const initials = label
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return { label, initials, src: logo?.src };
};

const OemBrandMark = ({ card }) => {
  const [logoFailed, setLogoFailed] = useState(false);
  const { label, initials, src } = getOemIdentity(card);

  return (
    <span
      className="flex h-[28px] w-[56px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-[#ececec] bg-white px-[6px] py-[4px]"
      aria-label={`${label} logo`}
      role="img"
    >
      {src && !logoFailed ? (
        <img
          className="h-full w-full object-contain"
          src={src}
          alt=""
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <span className="text-[10px] font-black tracking-[0.04em] text-[#444]">
          {initials}
        </span>
      )}
    </span>
  );
};

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
        cards.map((card, i) => {
          const pricing = getPricing(card);
          const dailyIncludedKm = Number(card.perDayKmLimit) || Number(card.range) || 0;
          const includedKm = dailyIncludedKm * rentalDays;
          const selectedQuantity = isBusiness
            ? Number(getSelectedQuantity?.(card) || 0)
            : 0;

          return (
            <article
              key={"card-menu-" + i}
              className="group flex min-h-[540px] flex-col overflow-hidden rounded-[24px] border border-[#ebebeb] bg-white shadow-[0_8px_20px_rgba(16,24,40,0.08)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_14px_30px_rgba(16,24,40,0.12)]"
            >
              <div className="relative h-[220px] w-full overflow-hidden bg-[linear-gradient(145deg,#f5f4f8_0%,#ebe9ef_100%)] sm:h-[240px] xl:h-[250px]">
                {!card.isAvailable ? (
                  <div className="absolute z-20 top-[14px] left-[14px] rounded-full border border-[#e8e8e8] bg-white/95 px-[10px] py-[6px] text-[11px] font-bold text-[#5d5d5d] shadow-sm">
                    Next available {card.nextAvailableDate}
                  </div>
                ) : card.availableCount <= 2 ? (
                  <div className="absolute z-20 top-[14px] right-[14px] rounded-full bg-[#fff1f1] px-[10px] py-[6px] text-[11px] font-bold text-[#c43333]">
                    Only {card.availableCount} left
                  </div>
                ) : null}
                <img
                  className={`${
                    !card.isAvailable ? "opacity-50 grayscale" : ""
                  } h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.025]`}
                  src={card.imgUrl}
                  alt={`${card.vehicleName} available for ${isSubscription ? "subscription" : "fixed rental"}`}
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
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[44px] bg-gradient-to-t from-white to-transparent" />
              </div>

              <div className="flex flex-1 flex-col px-[20px] pb-[22px] pt-[4px] sm:pt-[6px]">
                <div className="flex items-center gap-[8px]">
                  <OemBrandMark card={card} />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-[20px] font-bold text-[#262626]">
                      {card.vehicleName}
                    </h2>
                    {isBusiness && getDetailsPath?.(card) && (
                      <button
                        type="button"
                        onClick={() => navigate(getDetailsPath(card))}
                        className="mt-[2px] text-[11px] font-bold text-[#6b5a78] underline-offset-2 hover:underline"
                      >
                        View model details
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-[10px] flex flex-wrap items-end gap-x-[8px] gap-y-[4px]">
                  <p className="text-[24px] font-black leading-none text-[#351a75]">
                    ₹{formatCurrency(isSubscription ? pricing.cycleRate : pricing.dailyRate)}
                    <span className="ml-[2px] text-[13px] font-bold">/{pricing.unit}</span>
                  </p>
                  <p className="text-[13px] text-[#6b6b6b]">
                    {isBusiness
                      ? "Indicative business rate"
                      : isSubscription
                      ? `${startingPeriodLabel(selectedPlanType || currentPlanType, subscriptionDuration)} planned`
                      : `₹${formatCurrency(pricing.total)} total`}
                  </p>
                </div>

                {isSubscription && (
                  <div className="mt-[14px] flex items-center justify-between gap-[12px] rounded-[12px] border border-[#e8e4ed] bg-[#faf9fb] px-[12px] py-[11px] text-[11px]">
                    <span className="font-medium text-[#4e4753]">
                      Planned until {formatShortDate(selectedDropoff?.date)}
                    </span>
                    <span className="font-bold text-[#33734b]">
                      Renews {renewalCadenceLabel(selectedPlanType || currentPlanType)}
                    </span>
                  </div>
                )}

                <div className="mt-[18px] grid grid-cols-3 rounded-[16px] bg-[#f7f7f7] px-[12px] py-[12px] text-[#373737]">
                  <div className="flex flex-col items-center gap-[5px] border-r border-[#e5e5e5]">
                    <img className="size-[18px]" src="/images/speedometer-01.png" alt="" />
                    <span className="text-[11px] font-medium">{card.range} km</span>
                  </div>
                  <div className="flex flex-col items-center gap-[5px] border-r border-[#e5e5e5]">
                    <img className="size-[18px]" src="/images/bi_stopwatch.png" alt="" />
                    <span className="text-[11px] font-medium">{card.topSpeed} km/h</span>
                  </div>
                  <div className="flex flex-col items-center gap-[5px]">
                    <img
                      className="size-[18px]"
                      src="/images/mdi_battery-charging-outline.png"
                      alt=""
                    />
                    <span className="text-[11px] font-medium">{card.chargeTime} hr</span>
                  </div>
                </div>

                <div className="mt-[16px] grid min-h-[36px] grid-cols-2 items-start gap-[16px] text-[12px] leading-[1.35] text-[#626262]">
                  <span className="flex items-start gap-[5px]">
                    <span className="text-[#351a75]">✓</span>
                    {dailyIncludedKm > 0
                      ? isSubscription
                        ? `${dailyIncludedKm} km/day included`
                        : isBusiness
                        ? `${dailyIncludedKm} km/day included`
                        : `${includedKm} km included`
                      : "Usage allowance shown at checkout"}
                  </span>
                  <span className="flex items-start justify-end gap-[5px] text-right">
                    <span className="text-[#351a75]">✓</span>
                    No fuel costs
                  </span>
                </div>

                {(Number(card.perKmCharge) > 0 || Number(card.onboardingFee) > 0) && (
                  <div className="mt-[10px] flex flex-wrap items-center gap-x-[10px] gap-y-[4px] text-[11px] text-[#6b6b6b]">
                    {Number(card.perKmCharge) > 0 && (
                      <span>+₹{card.perKmCharge}/km beyond limit</span>
                    )}
                    {Number(card.perKmCharge) > 0 && Number(card.onboardingFee) > 0 && (
                      <span className="text-[#d4d4d4]">·</span>
                    )}
                    {Number(card.onboardingFee) > 0 && (
                      <span>₹{card.onboardingFee} one-time onboarding fee</span>
                    )}
                  </div>
                )}

                {isBusiness ? (
                  selectedQuantity > 0 ? (
                    <div className="mt-[16px] flex h-[46px] items-center gap-[10px]">
                      <div className="flex h-full flex-1 items-center justify-between rounded-full border border-[#351a75] px-[6px] text-[#351a75]">
                        <button
                          type="button"
                          onClick={() => onDecrease?.(card)}
                          className="flex size-[34px] items-center justify-center rounded-full text-[22px] leading-none hover:bg-[#f2eef6]"
                          aria-label={`Decrease ${card.vehicleName} quantity`}
                        >
                          −
                        </button>
                        <span className="text-[14px] font-black">{selectedQuantity} vehicles</span>
                        <button
                          type="button"
                          onClick={() => onIncrease?.(card)}
                          className="flex size-[34px] items-center justify-center rounded-full text-[20px] leading-none hover:bg-[#f2eef6]"
                          aria-label={`Increase ${card.vehicleName} quantity`}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove?.(card)}
                        className="flex h-full items-center justify-center rounded-full border border-[#dedede] px-[15px] text-[12px] font-bold text-[#6c666e] hover:bg-[#f7f7f7]"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelect?.(card)}
                      className="mt-[16px] flex h-[46px] w-full items-center justify-center rounded-full border border-[#351a75] px-[24px] text-[15px] font-bold text-[#351a75] transition-colors hover:bg-[#351a75] hover:text-white"
                    >
                      Add to fleet
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => handleRentNow(card)}
                    className={`${
                      card.isAvailable
                        ? "cursor-pointer border-[#351a75] text-[#351a75] hover:bg-[#351a75] hover:text-white"
                        : "cursor-not-allowed border-[#dedede] bg-[#f4f4f4] text-[#999]"
                    } mt-[16px] flex h-[46px] w-full items-center justify-center rounded-full border px-[24px] text-[15px] font-bold transition-colors`}
                    disabled={!card.isAvailable}
                  >
                    {card.isAvailable
                      ? isSubscription
                        ? "Choose subscription"
                        : "Rent now"
                      : "Unavailable"}
                  </button>
                )}
              </div>
            </article>
          );
        })}
    </>
  );
};

export default Cards;
