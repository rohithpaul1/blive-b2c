import Navbar from "../sections/Navbar";
import Loader from "../components/Loader";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { ProductContext } from "../contexts/ProductContext";
import { SearchBarContext } from "../contexts/SearchBarContext";
import OTPPanel from "../components/OTPPanel";
import ToggleButton from "../components/ToggleButton";
import { isValidAadharNumber } from "../utils/validators";
import toast from "react-hot-toast";
import PromocodePage from "../components/PromocodePage";
import WhatToExpect from "../components/WhatToExpect";
import CancellationBar from "../components/CancellationBar";
import DateChangeModal from "../components/DateChangeModal";
import HubDropdown from "../components/HubDropdown";
import TermsAndConditionsModal from "../components/TermsAndConditionsModal";
import { getAPI, postAPI } from "../caller/axiosUrls";
import { RAZORPAY_KEY_ID, SIMULATE_PAYMENT } from "../config/env";
// Razorpay will be loaded dynamically via script tag

const Booking = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState("+91");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [aadharNumber] = useState("");
  const [addOns, setAddOns] = useState({
    pricePerDay: 19,
    newHelmetPrice: 499,
    rentHelmet: false,
    newHelmet: false,
  });
  const [appliedPromocode, setAppliedPromocode] = useState(null);
  const [taxCharges] = useState(null);
  const [days, setDays] = useState(0);
  const [, setVerifiedAadhar] = useState(true);
  const [isOTPSent, setIsOTPSent] = useState(false);
  const [showPromocodePage, setShowPromocodePage] = useState(false);
  const [requiredDoorstepDelivery, setRequiredDoorstepDelivery] =
    useState(false);
  const [hubLocations, setHubLocations] = useState([]);
  const [hubsLoading, setHubsLoading] = useState(true);
  const [selectedHubId, setSelectedHubId] = useState(null);
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [landmark, setLandmark] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [acceptedTnC, setAcceptedTnC] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  // Feature flags for upsell blocks not yet enabled in production
  const SHOW_EXTEND_UPSELL = false;
  const SHOW_ADDITIONAL_SERVICES = false;
  const [showDateChangeModal, setShowDateChangeModal] = useState(false);

  const { token, loading, userData } = useContext(UserContext);
  const { selectedProduct, setSelectedProduct } = useContext(ProductContext);

  // Debug sessionStorage on component mount
  useEffect(() => {
    const storedProduct = JSON.parse(
      sessionStorage.getItem("selectedProduct") || "null"
    );
    console.log(
      "Booking page - sessionStorage selectedProduct:",
      storedProduct
    );
    console.log(
      "Booking page - selectedProduct from context:",
      selectedProduct
    );
    console.log(
      "Booking page - selectedPlanType from sessionStorage:",
      storedProduct?.selectedPlanType
    );
    console.log(
      "Booking page - selectedPlanType from context:",
      selectedProduct?.selectedPlanType
    );

    // Also check what's in sessionStorage for selectedPlanType
    const storedPlanType = sessionStorage.getItem("selectedPlanType");
    console.log(
      "Booking page - storedPlanType from sessionStorage:",
      storedPlanType
    );
  }, [selectedProduct]);
  const {
    selectedPickup,
    selectedDropoff,
    setSelectedPickup,
    setSelectedDropoff,
  } = useContext(SearchBarContext);

  const navigate = useNavigate();


  const countDays = (pickup, dropoff) => {
    setDays(0);
    try {
      // Normalize to YYYY-MM-DD
      const pickupDateStr = new Date(pickup.date).toISOString().split("T")[0];
      const dropoffDateStr = new Date(dropoff.date).toISOString().split("T")[0];

      // Convert "10 AM" / "3 PM" → "HH:mm"
      const parseTime = (timeStr) => {
        const [time, modifier] = timeStr.split(" ");
        let [hours, minutes] = time.split(":");
        if (!minutes) minutes = "00"; // default

        hours = parseInt(hours, 10);
        if (modifier.toUpperCase() === "PM" && hours < 12) {
          hours += 12;
        }
        if (modifier.toUpperCase() === "AM" && hours === 12) {
          hours = 0;
        }

        return `${hours.toString().padStart(2, "0")}:${minutes}`;
      };

      const pickupDateTime = new Date(
        `${pickupDateStr}T${parseTime(pickup?.time || "10 AM")}`
      );
      const dropoffDateTime = new Date(
        `${dropoffDateStr}T${parseTime(dropoff?.time || "10 AM")}`
      );

      if (isNaN(pickupDateTime) || isNaN(dropoffDateTime)) {
        throw new Error("Invalid pickup or dropoff date/time format");
      }

      // Check if it's the same date
      if (pickupDateStr === dropoffDateStr) {
        // Same day rental - always count as 1 day minimum
        setDays(1);
        return 1;
      }

      if (dropoffDateTime <= pickupDateTime) {
        toast.error("Dropoff date/time must be after pickup date/time");
        return 0;
      }

      const diffMs = dropoffDateTime.getTime() - pickupDateTime.getTime();

      // Convert ms → days (always round up for rentals)
      const calculatedDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // Ensure minimum 1 day for any rental
      const finalDays = Math.max(1, calculatedDays);
      setDays(finalDays);

      return finalDays;
    } catch (err) {
      console.error("countDays error:", err);
      toast.error("Could not calculate rental days");
      return 0;
    }
  };

  const formattedDate = (date) => {
    if (!date) return "No date selected";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short", // "Aug"
      day: "numeric", // "23"
      year: "numeric", // "2025"
    });
  };


  const calculateTotal = () => {
    // If we have dynamic calculation data, use it
    if (selectedProduct?.calculationData?.payment_breakdown) {
      const breakdown = selectedProduct.calculationData.payment_breakdown;
      return breakdown.final_amount.toFixed(2);
    }

    // Fallback to manual calculation
    const basePrice = days * (selectedProduct?.price || 0);
    const addOnsTotal =
      (addOns?.rentHelmet ? addOns?.pricePerDay * days : 0) +
      (addOns?.newHelmet ? addOns?.newHelmetPrice : 0);
    const taxes = taxCharges || 0;
    const discount = appliedPromocode?.discountAmount || 0;
    const total = basePrice + addOnsTotal + taxes - discount;

    return total.toFixed(2); // always 2 decimal places
  };

  // Check if address is required for doorstep delivery
  const isAddressRequired = () => {
    if (!requiredDoorstepDelivery) {
      return false; // No address needed if doorstep delivery is not selected
    }

    // If doorstep delivery is selected, check if address is provided
    return !addressLine1.trim() || !addressLine2.trim();
  };

  // Check if user can proceed to payment
  const canProceedToPayment = () => {
    console.log("Payment validation check:", {
      // verifiedAadhar,
      requiredDoorstepDelivery,
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim(),
      isAddressRequired: isAddressRequired(),
      acceptedTnC,
    });

    // Must have address if doorstep delivery is selected
    if (isAddressRequired()) {
      console.log("❌ Cannot proceed: Address required for doorstep delivery");
      return false;
    }

    // Must have verified Aadhaar
    // if (!verifiedAadhar) {
    //   console.log("❌ Cannot proceed: Aadhaar not verified");
    //   return false;
    // }

    // Must have accepted terms and conditions
    if (!acceptedTnC) {
      console.log("❌ Cannot proceed: Terms and conditions not accepted");
      return false;
    }

    console.log("✅ Can proceed to payment");
    return true;
  };

  // Handle date change from modal
  const handleDateChange = async (newDates) => {
    try {
      setIsLoading(true);

      // Update dates in SearchBarContext (preserve original times)
      const newPickupDate = new Date(newDates.pickupDate);
      const newDropoffDate = new Date(newDates.dropoffDate);

      // Preserve the original times from selectedPickup and selectedDropoff
      const updatedPickup = {
        date: newPickupDate,
        time: selectedPickup?.time || "10 AM", // Keep original time
      };

      const updatedDropoff = {
        date: newDropoffDate,
        time: selectedDropoff?.time || "10 AM", // Keep original time
      };

      // Update context
      setSelectedPickup(updatedPickup);
      setSelectedDropoff(updatedDropoff);

      // Update sessionStorage
      sessionStorage.setItem("selectedPickupDate", newPickupDate.toISOString());
      sessionStorage.setItem(
        "selectedDropoffDate",
        newDropoffDate.toISOString()
      );

      // Recalculate pricing with new dates - pass the updated dates directly
      console.log("Recalculating pricing with new dates:", {
        pickup: updatedPickup,
        dropoff: updatedDropoff,
        isHomeDelivery: requiredDoorstepDelivery,
      });

      // Call the dynamic calculation API with updated dates
      await recalculatePricingWithNewDates(
        requiredDoorstepDelivery,
        updatedPickup,
        updatedDropoff
      );

      toast.success("Dates updated and pricing recalculated!");
    } catch (error) {
      console.error("Error updating dates:", error);
      toast.error("Failed to update dates. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Razorpay payment
  const handlePayment = async () => {
    if (!canProceedToPayment()) {
      toast.error("Please complete all required fields");
      return;
    }

    try {
      setIsLoading(true);

      const paymentData = {
        userId: userData?.id,
        amount: parseFloat(calculateTotal()), // Amount in rupees
        vehicleModelId: selectedProduct?.id,
        planId: selectedProduct?.planId,
        // Send complete instants so the selected local clock survives storage
        // and renders identically in booking history and admin operations.
        pickupDate: formatDateTimeForAPI(
          selectedPickup?.date || new Date(),
          selectedPickup?.time
        ),
        dropoffDate: formatDateTimeForAPI(
          selectedDropoff?.date || new Date(),
          selectedDropoff?.time
        ),
        ratePlan: (() => {
          // Try multiple sources for plan type
          const planTypeFromProduct = selectedProduct?.selectedPlanType || "";
          const planTypeFromStorage =
            sessionStorage.getItem("selectedPlanType") || "";

          // Prioritize sessionStorage if it's a valid plan type
          const validPlanTypes = ["daily", "weekly", "monthly"];
          let planType = "";

          if (validPlanTypes.includes(planTypeFromStorage.toLowerCase())) {
            planType = planTypeFromStorage;
          } else if (
            validPlanTypes.includes(planTypeFromProduct.toLowerCase())
          ) {
            planType = planTypeFromProduct;
          } else {
            planType = "daily"; // fallback
          }

          const planLower = planType.toLowerCase();

          console.log("Rate Plan Debug:", {
            planTypeFromProduct,
            planTypeFromStorage,
            finalPlanType: planType,
            planLower,
            validPlanTypes,
          });

          return planLower;
        })(),
        promoCodeId: appliedPromocode?.couponId || null,
        hubId: selectedHubId ? selectedHubId.toString() : null,
        isHomeDelivery: Boolean(requiredDoorstepDelivery),
        dropoffLocation: requiredDoorstepDelivery
          ? `${addressLine1}, ${addressLine2}`
          : (selectedHubId
              ? hubLocations.find((hub) => hub.id === selectedHubId)?.hubName
              : null) || "Default Hub",
        dropoffAddress: requiredDoorstepDelivery
          ? `${addressLine1.trim()}, ${addressLine2.trim()}${
              landmark.trim() ? `, ${landmark.trim()}` : ""
            }`
          : null,
        specialRequests: specialRequests.trim() || null,
        gstPaid:
          selectedProduct?.calculationData?.payment_breakdown?.gst_amount || 0,
      };

      console.log("Payment data:", paymentData);
      console.log("Selected hub info:", {
        selectedHubId,
        hubLocations,
        selectedHub: hubLocations.find((hub) => hub.id === selectedHubId),
      });

      // Call handle-payment API
      const response = await postAPI(
        "/vehicle-plan/handle-payment",
        paymentData
      );

      if (response.status === "success") {
        // Debug: Check what key we're getting
        // Prefer the key the backend returns; fall back to the build-time env var.
        const razorpayKey = response.data.razorpayKey || RAZORPAY_KEY_ID;

        // Ensure we have a valid key
        if (
          !razorpayKey ||
          razorpayKey === "undefined" ||
          razorpayKey === "null"
        ) {
          throw new Error(
            "Razorpay key not found. Please check environment variables."
          );
        }

        // Initialize Razorpay with the response data
        const options = {
          key: razorpayKey, // Get from environment or API response

          amount: paymentData.amount * 100, // Convert to paise for Razorpay
          currency: "INR",
          name: "Blive EV Rental",
          description: `Payment for ${selectedProduct?.vehicleName} rental`,
          order_id: response.data.orderId,
          handler: async (paymentResponse) => {
            console.log("Payment successful:", paymentResponse);
            console.log("Payment response keys:", Object.keys(paymentResponse));
            console.log(
              "Full payment response:",
              JSON.stringify(paymentResponse, null, 2)
            );

            try {
              // Extract the correct payment data from Razorpay response
              const razorpayOrderId =
                paymentResponse.razorpay_order_id ||
                response.data.razorpayOrder.id;
              const razorpayPaymentId = paymentResponse.razorpay_payment_id;
              const razorpaySignature = paymentResponse.razorpay_signature;

              console.log("Extracted payment data:", {
                razorpayOrderId,
                razorpayPaymentId,
                razorpaySignature,
                fromResponse: response.data.razorpayOrder.id,
                allPaymentResponseKeys: Object.keys(paymentResponse),
                paymentResponseValues: Object.values(paymentResponse),
              });

              // Check if signature is missing and provide fallback
              if (!razorpaySignature) {
                console.warn(
                  "Razorpay signature is missing from payment response"
                );
                console.log(
                  "Available keys in payment response:",
                  Object.keys(paymentResponse)
                );

                // Try alternative key names
                const alternativeSignature =
                  paymentResponse.signature ||
                  paymentResponse.razorpaySignature ||
                  paymentResponse.payment_signature;

                if (alternativeSignature) {
                  console.log(
                    "Found signature with alternative key:",
                    alternativeSignature
                  );
                } else {
                  console.error("No signature found in payment response");
                }
              }

              // Use alternative signature if primary is missing
              const finalSignature =
                razorpaySignature ||
                paymentResponse.signature ||
                paymentResponse.razorpaySignature ||
                paymentResponse.payment_signature ||
                "no_signature_provided";

              // Call verify-payment API
              const verifyData = {
                razorpayOrderId: String(razorpayOrderId),
                razorpayPaymentId: String(razorpayPaymentId),
                razorpaySignature: String(finalSignature),
                userId: String(userData?.id),
                amount: Number(paymentData.amount),
                isHomeDelivery: Boolean(requiredDoorstepDelivery),
              };

              console.log("Verifying payment:", verifyData);
              console.log("Data types:", {
                razorpayOrderId: typeof verifyData.razorpayOrderId,
                razorpayPaymentId: typeof verifyData.razorpayPaymentId,
                razorpaySignature: typeof verifyData.razorpaySignature,
                userId: typeof verifyData.userId,
                amount: typeof verifyData.amount,
                isHomeDelivery: typeof verifyData.isHomeDelivery,
              });

              const verifyResponse = await postAPI(
                "/vehicle-plan/verify-payment",
                verifyData
              );

              if (verifyResponse.status === "success") {
                console.log(
                  "Payment verification successful:",
                  verifyResponse.data
                );
                toast.success(
                  "Payment verified and booking created successfully!"
                );

                // Show loading state before navigation
                setIsLoading(true);

                // Small delay to show loading state, then navigate
                setTimeout(() => {
                  navigate("/my-bookings", {
                    state: {
                      paymentId: paymentResponse.razorpay_payment_id,
                      orderId: paymentResponse.razorpay_order_id,
                      bookingData: paymentData,
                      razorpayOrder: verifyResponse.data.razorpayOrder,
                      paymentSummary: verifyResponse.data.paymentSummary,
                      verificationData: verifyResponse.data,
                      showSuccessMessage: true,
                    },
                  });
                }, 1500); // 1.5 second delay to show loading
              } else {
                throw new Error(
                  verifyResponse.message || "Payment verification failed"
                );
              }
            } catch (error) {
              console.error("Payment verification error:", error);
              toast.error(
                error.message ||
                  "Payment verification failed. Please contact support."
              );
            }
          },
          prefill: {
            name: fullName,
            email,
            contact: `${selectedCountryCode}${phoneNumber}`,
          },
          theme: {
            color: "#000000",
          },
          modal: {
            ondismiss: () => {
              toast.error("Payment cancelled");
            },
          },
        };

        console.log("Razorpay Options:", options);

        // Simulated payment: skip the real Razorpay modal and simulate a
        // successful payment by invoking the same handler the widget calls.
        if (SIMULATE_PAYMENT) {
          await options.handler({
            razorpay_order_id: response.data.orderId,
            razorpay_payment_id: "pay_dummy_" + Date.now(),
            razorpay_signature: "dummy_signature",
          });
          return;
        }

        // Load Razorpay script dynamically if not already loaded
        if (!window.Razorpay) {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => {
            const razorpay = new window.Razorpay(options);
            razorpay.open();
          };
          script.onerror = () => {
            throw new Error("Failed to load Razorpay script");
          };
          document.body.appendChild(script);
        } else {
          const razorpay = new window.Razorpay(options);
          razorpay.open();
        }
      } else {
        throw new Error(response.message || "Failed to initialize payment");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(
        error.message || "Payment initialization failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (isValidAadharNumber(aadharNumber)) {
      setIsOTPSent(true);
    } else {
      toast.error("Please provide a valid aadhaar number!");
      return;
    }
  };

  const onVerifiedOTP = async () => {
    setIsOTPSent(false);
    setVerifiedAadhar(true);
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

    // Treat the selected clock as local time before converting to an instant.
    const dateObj = new Date(date);
    const timeStr = parseTime(time || "10 AM");
    const [hours, minutes] = timeStr.split(":").map(Number);
    dateObj.setHours(hours, minutes, 0, 0);
    return dateObj.toISOString();
  };

  // Function to recalculate pricing with new dates
  const recalculatePricingWithNewDates = async (
    isHomeDelivery,
    newPickup,
    newDropoff
  ) => {
    console.log("recalculatePricingWithNewDates called with:", {
      isHomeDelivery,
      newPickup,
      newDropoff,
      selectedProduct,
    });

    if (!selectedProduct?.id || !selectedProduct?.planId) {
      console.log("Missing product data for recalculation:", {
        hasId: !!selectedProduct?.id,
        hasPlanId: !!selectedProduct?.planId,
        selectedProduct,
      });
      return;
    }

    try {
      // Format dates for API using the new dates passed as parameters
      const pickupDate = formatDateTimeForAPI(newPickup?.date, newPickup?.time);
      const dropoffDate = formatDateTimeForAPI(
        newDropoff?.date,
        newDropoff?.time
      );

      if (!pickupDate || !dropoffDate) {
        toast.error("Please select pickup and dropoff dates");
        return;
      }

      // Determine rate plan with better logic
      let ratePlan = "daily"; // default

      if (selectedProduct?.selectedPlanType) {
        ratePlan = selectedProduct.selectedPlanType;
      } else if (selectedProduct?.planName) {
        // Fallback: determine from plan name
        const planName = selectedProduct.planName.toLowerCase();
        if (planName.includes("weekly")) {
          ratePlan = "weekly";
        } else if (planName.includes("monthly")) {
          ratePlan = "monthly";
        }
      }

      const requestData = {
        vehicleModelId: selectedProduct?.id,
        pickupDate,
        dropoffDate,
        planId: selectedProduct?.planId,
        ratePlan: ratePlan.toLowerCase(),
        isHomeDelivery,
        hubId: selectedHubId ? selectedHubId.toString() : undefined,
      };

      // Include promo code if applied
      if (appliedPromocode?.couponId) {
        requestData.promoCodeId = appliedPromocode.couponId;
      }

      console.log("Recalculating pricing with new dates:", requestData);

      const response = await postAPI(
        "/vehicle-plan/dynamic-calculation",
        requestData
      );

      if (response.status === "success") {
        console.log("Recalculation response:", response.data);

        // Update the selected product with new calculation data
        const updatedProduct = {
          ...selectedProduct,
          calculationData: response.data,
        };

        setSelectedProduct(updatedProduct);
        sessionStorage.setItem(
          "selectedProduct",
          JSON.stringify(updatedProduct)
        );

        console.log("✅ Pricing recalculated successfully with new dates");
      } else {
        console.error("Recalculation failed:", response);
        toast.error("Failed to recalculate pricing. Please try again.");
      }
    } catch (error) {
      console.error("Error recalculating pricing:", error);
      toast.error("Failed to recalculate pricing. Please try again.");
    }
  };

  // Function to recalculate pricing when doorstep delivery is toggled
  const recalculatePricing = async (isHomeDelivery) => {
    console.log("recalculatePricing called with:", {
      isHomeDelivery,
      selectedProduct,
    });

    if (!selectedProduct?.id || !selectedProduct?.planId) {
      console.log("Missing product data for recalculation:", {
        hasId: !!selectedProduct?.id,
        hasPlanId: !!selectedProduct?.planId,
        selectedProduct,
      });
      return;
    }

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
        return;
      }

      // Determine rate plan with better logic
      let ratePlan = "daily"; // default

      if (selectedProduct?.selectedPlanType) {
        ratePlan = selectedProduct.selectedPlanType;
      } else if (selectedProduct?.planName) {
        // Fallback: determine from plan name
        const planName = selectedProduct.planName.toLowerCase();
        if (planName.includes("weekly")) {
          ratePlan = "weekly";
        } else if (planName.includes("monthly")) {
          ratePlan = "monthly";
        }
      }

      console.log("Rate plan determination:", {
        selectedPlanType: selectedProduct?.selectedPlanType,
        planName: selectedProduct?.planName,
        finalRatePlan: ratePlan,
      });

      const requestData = {
        vehicleModelId: selectedProduct.id,
        pickupDate: pickupDate,
        dropoffDate: dropoffDate,
        planId: selectedProduct.planId,
        ratePlan: ratePlan,
        isHomeDelivery: isHomeDelivery,
        hubId: selectedHubId ? selectedHubId.toString() : undefined,
      };

      // Add coupon ID if a coupon is applied
      if (appliedPromocode?.couponId) {
        requestData.promoCodeId = appliedPromocode.couponId;
      }

      console.log("Recalculating pricing with:", requestData);

      const response = await postAPI(
        "/vehicle-plan/dynamic-calculation",
        requestData
      );

      if (response.status === "success") {
        console.log("Recalculation response:", response.data);

        // Update the selected product with new calculation data
        const updatedProduct = {
          ...selectedProduct,
          calculationData: response.data,
        };

        setSelectedProduct(updatedProduct);
        sessionStorage.setItem(
          "selectedProduct",
          JSON.stringify(updatedProduct)
        );

        toast.success(
          `Pricing updated for ${
            isHomeDelivery ? "with" : "without"
          } doorstep delivery`
        );
      } else {
        throw new Error(response.message || "Failed to recalculate pricing");
      }
    } catch (error) {
      console.error("Recalculation error:", error);
      toast.error(
        error.message || "Failed to recalculate pricing. Please try again."
      );
    }
  };



  // Fetch hub locations from API
  const fetchHubLocations = async () => {
    try {
      setHubsLoading(true);
      const response = await getAPI("/vehicle-plan/all-hubs");

      if (response.status === "success") {
        console.log("Hub locations fetched:", response.data);
        console.log(
          "Hub data structure:",
          JSON.stringify(response.data, null, 2)
        );

        const hubs = response.data || [];
        setHubLocations(hubs);

        console.log("Processed hubs:", hubs);

        // Set default hub if available and none selected
        if (hubs.length > 0 && selectedHubId === null) {
          setSelectedHubId(hubs[0].id);
          console.log("Set default hub:", hubs[0]);
        }
      } else {
        console.error("Failed to fetch hub locations:", response.message);
        toast.error("Failed to load hub locations");
      }
    } catch (error) {
      console.error("Error fetching hub locations:", error);
      toast.error("Failed to load hub locations");
    } finally {
      setHubsLoading(false);
    }
  };


  useEffect(() => {
    if (selectedPickup && selectedDropoff)
      countDays(selectedPickup, selectedDropoff);
  }, [selectedPickup, selectedDropoff]);

  useEffect(() => {
    if (userData) {
      setFullName(
        [userData?.firstName, userData?.lastName].filter(Boolean).join(" ")
      );
      setPhoneNumber(userData?.phoneNumber);
      setEmail(userData?.email || "");
    }
  }, [userData]);

  useEffect(() => {
    if (loading) return;
    if (!token || !selectedProduct) navigate("/home");
  }, [token, loading, selectedProduct]);

  // Fetch hub locations on component mount
  useEffect(() => {
    fetchHubLocations();
  }, []);

  // Call dynamic calculation API if calculation data is missing
  useEffect(() => {
    console.log("Booking useEffect triggered:", {
      selectedProduct: !!selectedProduct,
      hasCalculationData: !!selectedProduct?.calculationData,
      selectedPickup: !!selectedPickup,
      selectedDropoff: !!selectedDropoff,
      requiredDoorstepDelivery,
    });

    if (
      selectedProduct &&
      !selectedProduct.calculationData &&
      selectedPickup &&
      selectedDropoff
    ) {
      console.log("Missing calculation data, calling API...");
      recalculatePricing(requiredDoorstepDelivery);
    }
  }, [
    selectedProduct,
    selectedPickup,
    selectedDropoff,
    requiredDoorstepDelivery,
  ]);

  // Recalculate pricing when coupon is applied or removed
  useEffect(() => {
    if (selectedProduct?.calculationData && selectedPickup && selectedDropoff) {
      console.log("Coupon applied/removed, recalculating pricing...");
      recalculatePricing(requiredDoorstepDelivery);
    }
  }, [appliedPromocode]);


  return (
    <>
      {isOTPSent && (
        <div className="fixed z-50 w-screen h-screen top-0 left-0 bg-black/50 flex items-center justify-center">
          <OTPPanel
            isLogin={false}
            resendCb={handleSendOTP}
            onSuccess={onVerifiedOTP}
            setIsOTPSent={setIsOTPSent}
            title={"Aadhar E-Verification"}
          />
        </div>
      )}
      {showPromocodePage && (
        <div className="fixed z-50 w-screen h-screen top-0 left-0 bg-black/50 flex items-center justify-center">
          <PromocodePage
            setShowPromocodePage={setShowPromocodePage}
            setAppliedPromocode={setAppliedPromocode}
          />
        </div>
      )}
      <TermsAndConditionsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
      <div className="w-full overflow-x-hidden">
        <Navbar onSearchPage={false} expanded={true} />
        <div className="px-[clamp(20px,7.5vw,108px)] pb-[100px] pt-[116px]">
          {isLoading || !token ? (
            <Loader />
          ) : (
            <div className="grid items-start gap-[48px] lg:grid-cols-[minmax(0,1fr)_400px] xl:gap-[72px]">
              <div className="min-w-0">
                <p className="font-bold text-[24px] text-[#222222]">
                  Customer Details
                </p>

                <div className="flex flex-col mt-[16px]">
                  <p className="text-[12px] text-[#717171]">Full Name</p>
                  <input
                    disabled={true}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    type="text"
                    className="mt-[4px] cursor-not-allowed flex-1 rounded-[8px] outline-none border p-[16px] h-[48px] bg-black/10 text-gray-500 border-[#EDEDED] text-[14px] "
                    placeholder="Enter Full Name"
                  />
                </div>
                <div className="mt-[16px] flex flex-col">
                  <p className="text-[12px] text-[#717171]">Phone Number</p>
                  <div className="mt-[4px] gap-x-[12px] flex items-center">
                    <div className="relative w-fit">
                      <select
                        disabled={true}
                        value={selectedCountryCode}
                        onChange={(e) => setSelectedCountryCode(e.target.value)}
                        className="rounded-[8px] cursor-not-allowed border border-[#EDEDED] outline-none p-[16px] bg-black/10 text-gray-500 pr-[40px] bg-[#F7F7F7] font-bold text-[14px] text-[#222222] appearance-none"
                      >
                        <option value="+91">
                          IN (+91)
                        </option>
                      </select>
                      <img
                        src="/images/Chevron-Down.png"
                        alt="Chevron"
                        className="pointer-events-none absolute right-[12px] top-1/2 -translate-y-1/2 w-[16px] h-[16px]"
                      />
                    </div>
                    <input
                      disabled={true}
                      value={phoneNumber}
                      maxLength="10"
                      onChange={(e) => {
                        const onlyNums = e.target.value.replace(/\D/g, "");
                        setPhoneNumber(onlyNums);
                      }}
                      placeholder="Enter Phone Number"
                      className="rounded-[8px] cursor-not-allowed bg-black/10 text-gray-500 w-full border border-[#EDEDED] outline-none p-[16px] bg-[#F7F7F7] text-[14px] text-[#222222]"
                      type="text"
                      inputMode="numeric"
                    />
                  </div>
                </div>
                <div className="mt-[16px] flex flex-col">
                  <p className="text-[12px] text-[#717171]">Email</p>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    className="mt-[4px] h-[48px] flex-1 rounded-[8px] border border-[#EDEDED] bg-[#F7F7F7] p-[16px] text-[14px] text-[#222222] outline-none focus:border-[#5B21B6] focus:bg-white"
                    placeholder="Enter Email Address"
                  />
                </div>

                <div className="mt-[24px] flex items-center gap-x-[10px]">
                  <p className="font-medium text-[18px] text-[#222222]">
                    Pickup Options
                  </p>
                  <span className="h-[1px] flex-1 bg-[#D9D9D9] rounded-[8px]" />
                </div>
                <p className="text-[14px] mt-[16px] text-[#222222]">
                  Choose how you’d like to get your vehicle.
                </p>
                <div className="text-[13px] mt-[16px] flex items-center gap-x-[8px] text-[#222222]">
                  <ToggleButton
                    id="doorstepDelivery"
                    defaultChecked={requiredDoorstepDelivery}
                    onChange={(isEnabled) => {
                      setRequiredDoorstepDelivery(isEnabled);
                      // Recalculate pricing with new home delivery setting
                      recalculatePricing(isEnabled);
                    }}
                    disabled={false}
                  />
                  <p>
                    Opt for doorstep delivery & get your EV delivered right to
                    your location at just ₹200
                  </p>
                </div>
                {requiredDoorstepDelivery ? (
                  <div className="mt-[16px] gap-y-[16px] flex flex-col">
                    <div className="flex flex-col">
                      <p className="text-[12px] text-[#717171]">
                        Flat, House no., Building, Company, Apartment
                      </p>
                      <input
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        type="text"
                        className="mt-[4px] flex-1 rounded-[8px] outline-none border p-[16px] h-[48px] bg-[#F7F7F7] border-[#EDEDED] text-[14px]"
                      />
                    </div>
                    <div className="flex flex-col">
                      <p className="text-[12px] text-[#717171]">
                        Area, Street, Sector, Village
                      </p>
                      <input
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        type="text"
                        className="mt-[4px] flex-1 rounded-[8px] outline-none border p-[16px] h-[48px] bg-[#F7F7F7] border-[#EDEDED] text-[14px]"
                      />
                    </div>
                    <div className="flex flex-col">
                      <p className="text-[12px] text-[#717171]">
                        Landmark (optional)
                      </p>
                      <input
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        type="text"
                        className="mt-[4px] flex-1 rounded-[8px] outline-none border p-[16px] h-[48px] bg-[#F7F7F7] border-[#EDEDED] text-[14px]"
                        placeholder="Eg. Near RTO office"
                      />
                    </div>
                    <div className="flex items-center gap-x-[16px]"></div>
                  </div>
                ) : (
                  <div className="mt-[16px] flex flex-col">
                    <p className="text-[12px] text-[#717171]">
                      Pickup location
                    </p>
                    <div className="mt-[4px] gap-x-[12px] flex items-center">
                      <div className="relative w-full">
                        <HubDropdown
                          hubs={hubLocations}
                          selectedHubId={selectedHubId}
                          setSelectedHubId={setSelectedHubId}
                          isLoading={hubsLoading}
                          placeholder="Select a hub"
                        />
                      </div>
                    </div>
                    {/* Address validation message */}
                    {requiredDoorstepDelivery && isAddressRequired() && (
                      <div className="mt-[8px] p-[12px] bg-[#FEF2F2] border border-[#FECACA] rounded-[8px]">
                        <p className="text-[12px] text-[#DC2626]">
                          ⚠️ Please enter your complete address to proceed with
                          doorstep delivery
                        </p>
                        <p className="text-[11px] text-[#DC2626] mt-[4px]">
                          Missing:{" "}
                          {!addressLine1.trim() ? "Address Line 1" : ""}{" "}
                          {!addressLine1.trim() && !addressLine2.trim()
                            ? "and "
                            : ""}{" "}
                          {!addressLine2.trim() ? "Address Line 2" : ""}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {SHOW_EXTEND_UPSELL && (
                  <div className="mt-[24px] flex items-center overflow-hidden w-full h-[102px] rounded-[12px] py-[8px] pr-[20px] bg-[#FAF6FE]">
                    <img
                      className="mt-[20px] w-[112px] ml-[-10px]"
                      src="/images/CartoonScooter.png"
                      alt="Cartoon Scooter Image"
                    />
                    <div className="flex flex-col gap-y-[8px] flex-1">
                      <p className="font-bold text-[20px] text-[#262626]">
                        Extend for 2 more days for just ₹100{" "}
                      </p>
                      <p className="font-medium text-[11px] text-[#595959]">
                        Enjoy extra freedom on your EV with doorstep service
                        included.
                      </p>
                    </div>
                    <button className="w-[120px] flex items-center justify-center  h-[48px] rounded-[24px] border py-[13px] px-[24px] bg-[#000000] border-[#CBCBCB] cursor-pointer font-medium text-[#FFFFFF]">
                      Extend
                    </button>
                  </div>
                )}
                {SHOW_ADDITIONAL_SERVICES && (
                  <div className="flex flex-col gap-y-[16px] mt-[24px]">
                    <p className="font-bold text-[24px] text-[#222222]">
                      Additional Services{" "}
                      <span className="font-medium text-[14px]">
                        (Optional)
                      </span>
                    </p>
                    <div className="flex gap-x-[24px]">
                      <div className="flex flex-col flex-1 items-center justify-center h-[288px] rounded-[24px] border pt-[16px] pb-[24px] px-[70px] bg-[#FFFFFF] border-[#D9D9D9]">
                        <img
                          className="max-w-[78px]"
                          src="/images/Helmet.png"
                          alt="Helmet Image"
                        />
                        <div className="flex flex-col items-center gap-y-[4px] mt-[8px]">
                          <p className="font-bold text-[#222222]">
                            Rent a Helmet
                          </p>
                          <p className="text-[14px] text-[#484848] text-center">
                            Safe and comfortable helmet, pay per day
                          </p>
                          <p className="font-bold text-[18px] text-[#222222] text-center">
                            ₹{addOns.pricePerDay}/day
                          </p>
                        </div>
                        <div className="mt-[16px]">
                          <button
                            onClick={() => {
                              setAddOns((prev) => ({
                                ...prev,
                                rentHelmet: !addOns.rentHelmet,
                              }));
                            }}
                            className={`cursor-pointer ${
                              addOns.rentHelmet
                                ? "bg-[#EDEDED]"
                                : "bg-[#FFFFFF]"
                            } border-[#CBCBCB] flex items-center justify-center w-[120px] h-[48px] font-medium text-[#3A3A3A] rounded-[24px] border py-[13px] px-[24px]`}
                          >
                            {addOns.rentHelmet ? "Added" : "Add"}
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col flex-1 items-center justify-center h-[288px] rounded-[24px] border pt-[16px] pb-[24px] px-[70px] bg-[#FFFFFF] border-[#D9D9D9]">
                        <img
                          className="max-w-[78px]"
                          src="/images/Helmet.png"
                          alt="Helmet Image"
                        />
                        <div className="flex flex-col items-center gap-y-[4px] mt-[8px]">
                          <p className="font-bold text-[#222222]">
                            Buy a Helmet
                          </p>
                          <p className="text-[14px] text-[#484848] text-center">
                            Own a brand-new helmet for your rides
                          </p>
                          <p className="font-bold text-[18px] text-[#222222] text-center">
                            ₹{addOns.newHelmetPrice}
                          </p>
                        </div>
                        <div className="mt-[16px]">
                          <button
                            onClick={() => {
                              setAddOns((prev) => ({
                                ...prev,
                                newHelmet: !addOns.newHelmet,
                              }));
                            }}
                            className={`cursor-pointer ${
                              addOns.newHelmet ? "bg-[#EDEDED]" : "bg-[#FFFFFF]"
                            } border-[#CBCBCB] flex items-center justify-center w-[120px] h-[48px] font-medium text-[#3A3A3A] rounded-[24px] border py-[13px] px-[24px]`}
                          >
                            {addOns.newHelmet ? "Added" : "Add"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="hidden">
                  <p className="font-bold text-[24px] text-[#222222]">
                    Payment & Offers
                  </p>
                  <div className="mt-[16px] flex items-center gap-x-[10px]">
                    <p className="font-medium text-[18px] text-[#222222]">
                      Apply Discount or Coupons
                    </p>
                    <span className="h-[1px] flex-1 bg-[#D9D9D9] rounded-[8px]" />
                  </div>
                  {appliedPromocode ? (
                    <div className="mt-[16px] h-[82px] w-full rounded-[8px] border border-dashed p-[16px] bg-[#F3F4FF] border-[#D9D9D9] flex items-center justify-between">
                      <div className="flex items-center gap-x-[16px]">
                        <div className="w-[40px] bg-[#FFC101] h-[40px] rounded-full flex items-center justify-center">
                          <img
                            className="w-[24px] h-[24px]"
                            src="/images/Celebrate.png"
                            alt="Celebrate Image"
                          />
                        </div>
                        <div className="flex flex-col">
                          <p className="font-bold text-[18px] text-[#222222]">
                            {appliedPromocode.promocode}
                          </p>
                          <p className="mt-[2px] text-[13px] text-[#3A3A3A]">
                            You will save ₹{appliedPromocode.discountAmount}{" "}
                            with this coupon on the bill
                          </p>
                        </div>
                      </div>
                      <div
                        onClick={() => setAppliedPromocode(null)}
                        className="flex cursor-pointer items-center gap-x-[8px] px-[12px]"
                      >
                        <img
                          className="w-[20px] h-[20px]"
                          src="/images/Delete.png"
                          alt="Delete Icon"
                        />
                        <p className="font-medium text-[#1B29A9]">Remove</p>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setShowPromocodePage(true)}
                      className="mt-[16px] h-[82px] w-full rounded-[8px] border border-dashed py-[18px] px-[8px] bg-white cursor-pointer border-[#1B29A9] flex items-center"
                    >
                      <div className="flex items-center gap-x-[8px] p-[12px]">
                        <img
                          className="w-[20px] h-[20px]"
                          src="/images/AddBlue.png"
                          alt="Add Button"
                        />
                        <p className="font-bold text-[#1B29A9]">Apply Coupon</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-[24px]">
                  <p className="font-bold text-[24px] text-[#222222]">
                    Special Requests{" "}
                    <span className="font-medium text-[14px]">(Optional)</span>
                  </p>
                  <p className="mt-[16px] text-[14px] text-[#222222]">
                    Special requests are not guaranteed at the time of booking.
                    We will get back to you via email to confirm your request.
                  </p>
                  <div className="mt-[16px] flex flex-col">
                    <p className="text-[12px] text-[#717171]">
                      Special Requests
                    </p>
                    <input
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      type="text"
                      className="mt-[4px] flex-1 rounded-[8px] outline-none border p-[16px] h-[48px] bg-[#F7F7F7] border-[#EDEDED] text-[14px]"
                      placeholder="eg: Need support wheels, etc."
                    />
                  </div>
                </div>
                <WhatToExpect />
                <div className="mt-[24px]">
                  <p className="font-bold text-[24px] text-[#222222]">
                    Cancellation Policy
                  </p>
                  <p className="mt-[16px] text-[14px] text-[#222222]">
                    Cancellations made before 48 hours of the reservation will
                    incur a cancellation fee. This fee is applied to cover the
                    costs associated with holding the reservation and the
                    potential impact on our schedule.
                  </p>
                  <div className="mt-[32px]">
                    <CancellationBar
                      bookingDate={new Date()}
                      pickupDate={selectedPickup.date}
                    />
                  </div>
                </div>
                <div className="mt-[64px]">
                  <p className="font-bold text-[24px] text-[#222222]">
                    Terms & Conditions
                  </p>
                  <div className="mt-[16px] flex items-center gap-x-[4px]">
                    <input
                      type="checkbox"
                      id="tncCheckbox"
                      className="accent-[#1B29A9]"
                      checked={acceptedTnC}
                      onChange={() => setAcceptedTnC(!acceptedTnC)}
                    />
                    <label
                      htmlFor="tncCheckbox"
                      className="font-medium text-[13px] text-[#222222]"
                    >
                      By clicking here, I agree to the{" "}
                      <span
                        onClick={() => setShowTermsModal(true)}
                        className="cursor-pointer underline underline-offset-4 text-[#1B29A9] hover:text-[#0F0F0F]"
                      >
                        Terms & Conditions, Privacy Policy, Cookie Policy.
                      </span>
                    </label>
                  </div>
                </div>
              </div>
              <aside className="w-full">
                <div className="sticky top-[104px] space-y-[12px]">
                  <section className="rounded-[16px] bg-[#F7F7F7] p-[20px]">
                  <p className="font-bold text-[24px] text-[#222222]">
                    Booking Overview
                  </p>
                  <div className="mt-[24px] gap-x-[15px] flex items-center">
                    <div className="flex flex-col">
                      <p className="text-[11px] text-[#3A3A3A]">Pick up</p>
                      <p className="font-bold text-[14px] text-[#222222]">
                        {formattedDate(selectedPickup?.date)}{" "}
                        <span className="text-[#646464] text-[12px]">
                          {selectedPickup?.time || "10 AM"}
                        </span>
                      </p>
                    </div>
                    <div className="flex-1 flex items-center gap-x-[10px]">
                      <span className="h-[1px] flex-1 rounded-[8px] bg-[#D9D9D9]" />
                      <p className="text-[11px] text-[#222222]">{days} Days</p>
                      <span className="h-[1px] flex-1 rounded-[8px] bg-[#D9D9D9]" />
                    </div>
                    <div className="flex flex-col">
                      <p className="text-[11px] text-[#3A3A3A] text-right">
                        Dropoff
                      </p>
                      <p className="font-bold text-[14px] text-[#222222]">
                        {formattedDate(selectedDropoff?.date)}{" "}
                        <span className="text-[#646464] text-[12px]">
                          {selectedDropoff?.time || "10 AM"}
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDateChangeModal(true)}
                    className="mt-[12px] text-[14px] font-medium text-[#1B29A9] hover:text-[#3844B4] transition-colors cursor-pointer"
                  >
                    Change Dates
                  </button>
                  <div className="mt-[24px]">
                    <p className="font-bold text-[14px] text-[#3A3A3A]">
                      Vehicle Details
                    </p>
                    <div className="mt-[8px] flex items-center gap-x-[12px] h-[100px] rounded-[8px] p-[12px] bg-[#EDEDED]">
                      <img
                        className="w-[80px] h-[80px] rounded-[8px] object-cover"
                        src={selectedProduct?.imgUrl}
                        alt="Scooter Book Image"
                      />
                      <div className="flex flex-col">
                        <p className="font-bold text-[14px] text-[#3A3A3A]">
                          {selectedProduct?.vehicleName}
                        </p>
                        <p className="text-[#3A3A3A] text-[11px]">
                          Rental Plan :{" "}
                          {selectedProduct?.selectedPlanType
                            ? selectedProduct.selectedPlanType
                                .charAt(0)
                                .toUpperCase() +
                              selectedProduct.selectedPlanType.slice(1)
                            : selectedProduct?.planName || "Daily"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-[24px] flex flex-col w-full">
                    <p className="font-bold text-[14px] text-[#3A3A3A]">
                      Price Details
                    </p>
                    <div className="mt-[8px] flex flex-col gap-y-[4px]">
                      {/* Dynamic calculation breakdown if available */}
                      {selectedProduct?.calculationData?.payment_breakdown ? (
                        <>
                          <div className="flex items-center justify-between">
                            <p className="text-[14px] text-[#3A3A3A]">
                              Total Rental: 1 Vehicle x{" "}
                              {
                                selectedProduct.calculationData
                                  .payment_breakdown.duration
                              }{" "}
                              days
                            </p>
                            <p className="text-[#3A3A3A] text-[14px] font-medium">
                              ₹
                              {
                                selectedProduct.calculationData
                                  .payment_breakdown.total_rental
                              }
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-x-[4px]">
                              <p className="text-[14px] text-[#3A3A3A]">
                                Security Deposit
                              </p>
                              <img
                                className="w-[16px] h-[16px] cursor-pointer"
                                src="/images/Info.png"
                                alt="Info Icon"
                              />
                            </div>
                            <p className="text-[#3A3A3A] text-[14px] font-medium">
                              ₹
                              {
                                selectedProduct.calculationData
                                  .payment_breakdown.security_deposit
                              }
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-[14px] text-[#3A3A3A]">
                              Subtotal
                            </p>
                            <p className="text-[#3A3A3A] text-[14px] font-medium">
                              ₹
                              {
                                selectedProduct.calculationData
                                  .payment_breakdown.subtotal
                              }
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-x-[4px]">
                              <p className="text-[14px] text-[#3A3A3A]">
                                GST (
                                {
                                  selectedProduct.calculationData
                                    .payment_breakdown.gst_percentage
                                }
                                %)
                              </p>
                              <img
                                className="w-[16px] h-[16px] cursor-pointer"
                                src="/images/Info.png"
                                alt="Info Icon"
                              />
                            </div>
                            <p className="text-[#3A3A3A] text-[14px] font-medium">
                              ₹
                              {
                                selectedProduct.calculationData
                                  .payment_breakdown.gst_amount
                              }
                            </p>
                          </div>
                          {selectedProduct.calculationData.payment_breakdown
                            .home_delivery_amount > 0 && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-x-[4px]">
                                <p className="text-[14px] text-[#3A3A3A]">
                                  Home Delivery
                                </p>
                                <img
                                  className="w-[16px] h-[16px] cursor-pointer"
                                  src="/images/Info.png"
                                  alt="Info Icon"
                                />
                              </div>
                              <p className="text-[#3A3A3A] text-[14px] font-medium">
                                ₹
                                {
                                  selectedProduct.calculationData
                                    .payment_breakdown.home_delivery_amount
                                }
                              </p>
                            </div>
                          )}
                          {selectedProduct.calculationData.payment_breakdown
                            .discount_amount > 0 && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-x-[4px]">
                                <p className="text-[14px] text-[#1C840F]">
                                  Discount
                                </p>
                                <img
                                  className="w-[16px] h-[16px] cursor-pointer"
                                  src="/images/Info.png"
                                  alt="Info Icon"
                                />
                              </div>
                              <p className="text-[#1C840F] text-[14px] font-medium">
                                -₹
                                {
                                  selectedProduct.calculationData
                                    .payment_breakdown.discount_amount
                                }
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        /* Fallback to manual calculation */
                        <>
                          <div className="flex items-center justify-between">
                            <p className="text-[14px] text-[#3A3A3A]">
                              Base price: 1 Vehicle x {days} days
                            </p>
                            <p className="text-[#3A3A3A] text-[14px] font-medium">
                              ₹{(days * selectedProduct?.price).toFixed(2)}
                            </p>
                          </div>
                          {(addOns?.newHelmet || addOns?.rentHelmet) && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-x-[4px]">
                                <p className="text-[14px] text-[#3A3A3A]">
                                  Add-Ons (Helmet)
                                </p>
                                <img
                                  className="w-[16px] h-[16px] cursor-pointer"
                                  src="/images/Info.png"
                                  alt="Info Icon"
                                />
                              </div>
                              <p className="text-[#3A3A3A] text-[14px] font-medium">
                                ₹
                                {(addOns?.rentHelmet
                                  ? addOns?.pricePerDay * days
                                  : 0) +
                                  (addOns?.newHelmet
                                    ? addOns?.newHelmetPrice
                                    : 0)}
                              </p>
                            </div>
                          )}
                          {taxCharges && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-x-[4px]">
                                <p className="text-[14px] text-[#3A3A3A]">
                                  Taxes & Charges
                                </p>
                                <img
                                  className="w-[16px] h-[16px] cursor-pointer"
                                  src="/images/Info.png"
                                  alt="Info Icon"
                                />
                              </div>
                              <p className="text-[#3A3A3A] text-[14px] font-medium">
                                ₹{taxCharges.toFixed(2)}
                              </p>
                            </div>
                          )}
                          {appliedPromocode && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-x-[4px]">
                                <p className="text-[14px] text-[#1C840F]">
                                  Promo Code ({appliedPromocode.promocode})
                                </p>
                                <img
                                  className="w-[16px] h-[16px] cursor-pointer"
                                  src="/images/Info.png"
                                  alt="Info Icon"
                                />
                              </div>
                              <p className="text-[#1C840F] text-[14px] font-medium">
                                -₹{appliedPromocode.discountAmount.toFixed(2)}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="mt-[10px] min-h-[1px] w-full rounded-[8px] flex-1 bg-[#EDEDED]" />
                    <div className="flex mt-[12px] items-center justify-between">
                      <p className="font-medium text-[22px] text-[#222222]">
                        Total
                      </p>
                      <p className="font-bold text-[22px] text-[#222222]">
                        ₹{calculateTotal()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handlePayment}
                    className={`mt-[24px] h-[48px] w-full rounded-[24px] px-[24px] py-[13px] font-bold text-[#FDFDFD] transition-colors ${
                      canProceedToPayment()
                        ? "bg-[#351a75] cursor-pointer hover:bg-[#2c155f]"
                        : "bg-[#CBCBCB] cursor-not-allowed"
                    }`}
                    disabled={!canProceedToPayment() || isLoading}
                  >
                    {isLoading ? "Processing..." : "Proceed to Payment"}
                  </button>
                  </section>

                  <section className="rounded-[16px] bg-[#F7F7F7] p-[20px]">
                    <h2 className="text-[20px] font-bold text-[#222222]">
                      Payment & Offers
                    </h2>
                    <p className="mt-[12px] border-b border-[#dedede] pb-[10px] text-[13px] text-[#3a3a3a]">
                      Apply discount or coupons
                    </p>
                    {appliedPromocode ? (
                      <div className="mt-[14px] flex items-center justify-between gap-[12px] rounded-[10px] border border-dashed border-[#cfc6ef] bg-[#f6f3ff] p-[14px]">
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-bold text-[#351a75]">
                            {appliedPromocode.promocode}
                          </p>
                          <p className="mt-[2px] text-[11px] text-[#656565]">
                            You save ₹{appliedPromocode.discountAmount}
                          </p>
                        </div>
                        <button
                          onClick={() => setAppliedPromocode(null)}
                          className="text-[12px] font-bold text-[#351a75]"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowPromocodePage(true)}
                        className="mt-[14px] flex h-[52px] w-full items-center rounded-[10px] border border-dashed border-[#8f78c6] px-[16px] text-[13px] font-bold text-[#351a75] transition-colors hover:bg-[#f6f3ff]"
                      >
                        <span className="mr-[8px] text-[20px] font-normal">+</span>
                        Apply coupon
                      </button>
                    )}
                  </section>

                  <section className="rounded-[16px] bg-[#F7F7F7] p-[20px]">
                    <h2 className="text-[20px] font-bold text-[#222222]">
                      What&apos;s included
                    </h2>
                    <ul className="mt-[14px] space-y-[9px] text-[12px] text-[#4f4f4f]">
                      <li className="flex gap-[8px]"><span className="text-[#1ca05a]">✓</span>{selectedProduct?.perDayKmLimit || selectedProduct?.range || 0} km per day included</li>
                      <li className="flex gap-[8px]"><span className="text-[#1ca05a]">✓</span>24/7 breakdown assistance</li>
                      <li className="flex gap-[8px]"><span className="text-[#1ca05a]">✓</span>Vehicle insurance</li>
                    </ul>
                  </section>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>

      {/* Date Change Modal */}
      <DateChangeModal
        isOpen={showDateChangeModal}
        onClose={() => setShowDateChangeModal(false)}
        currentPickup={selectedPickup}
        currentDropoff={selectedDropoff}
        onDateChange={handleDateChange}
      />
    </>
  );
};

export default Booking;
