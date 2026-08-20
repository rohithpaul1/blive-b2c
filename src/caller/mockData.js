/**
 * ---------------------------------------------------------------------------
 * DUMMY FRONTEND MOCK LAYER
 * ---------------------------------------------------------------------------
 * When VITE_USE_MOCKS === 'true', the API layer (axiosUrls.js) routes every
 * getAPI/postAPI/putAPI/postAPIMedia call here instead of hitting a backend.
 * The whole storefront then runs standalone — no server, no Convex, nothing to
 * deploy behind it — which makes it a clickable reference of every screen and
 * every exact data shape.
 *
 * This is the SAME seam the real integration uses: flip the flag off and the
 * calls go back to the network; later that same seam points at Convex. So this
 * file is step one of the rewire, not a throwaway.
 *
 * Every response mirrors the real backend's wrapper: { status, message, data }.
 * getAPI/postAPI return this object directly, and components read `.status`,
 * `.data`, and `.message` off it.
 * ---------------------------------------------------------------------------
 */

const ok = (data, message = 'OK') => ({ status: 'success', message, data });

const LATENCY_MS = 350; // makes the dummy feel like a real round-trip
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// --- date helpers (browser runtime) ----------------------------------------
const iso = (d) => d.toISOString();
const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};
const durationDays = (a, b) => {
  if (!a || !b) return 0;
  const days = (new Date(b) - new Date(a)) / 86400000;
  return days > 0 ? Math.ceil(days) : 0;
};

// --- demo user --------------------------------------------------------------
const DEMO_USER = {
  id: 'usr_dummy_001',
  firstName: 'Demo',
  lastName: 'Rider',
  userType: 'B2C',
  type: 'B2C',
  bliveId: 'BLIVE-DEMO-0001',
  dob: '1996-04-12',
  phoneNumber: '9876543210',
  countryCode: '91',
  email: 'demo@blive.co.in',
  profileUrl: '/images/DummyPerson.png',
  profileImage: '/images/DummyPerson.png',
  currentState: 'active', // not "basic-profile-pending" -> logs straight in
  createdAt: iso(addDays(-120)),
};

// --- catalog: vehicles (brand names map to /public/images/<Brand>.png) ------
const VEHICLES = [
  mkVehicle('vm_ather', 'Ather', '450X', 'Ather Energy', 3499, 549, 149, 4000, 111, 90, 8000),
  mkVehicle('vm_ola', 'Ola', 'S1 Pro', 'Ola Electric', 3299, 519, 139, 4000, 116, 116, 8000),
  mkVehicle('vm_tvs', 'TVS', 'iQube', 'TVS Motor', 2999, 479, 129, 3500, 100, 82, 7000),
  mkVehicle('vm_revolt', 'Revolt', 'RV400', 'Revolt Motors', 3799, 599, 159, 4500, 150, 85, 9000),
  mkVehicle('vm_ampere', 'Ampere', 'Nexus', 'Ampere Vehicles', 2799, 449, 119, 3200, 136, 93, 6500),
  mkVehicle('vm_pure', 'Pure', 'EPluto 7G', 'Pure EV', 2599, 419, 109, 3000, 100, 60, 6000),
];

function mkVehicle(id, brand, modelName, manufacturer, daily, weeklyPerDay, monthlyPerDay, deposit, range, topSpeed, monthlyPrice) {
  return {
    availableVehiclesCount: 5,
    brand: { name: brand, brandLogo: null },
    model: {
      id,
      modelName,
      manufacturer,
      range,
      speed: topSpeed,
      batteryChargingTime: 4,
      batteryType: 'lithium-ion',
      batteryCapacity: 3,
      perDayKmLimit: 80,
      perKmCharge: 6,
      currentMileage: 1200,
      vehicleSpeed: 'standard',
      engineType: 'ev',
      vehicleCategory: 'two-wheeler',
      b2cDeposit: deposit,
    },
    plan: {
      id: `plan_${id}`,
      name: 'Standard Plan',
      onboardingFee: 499,
      enterDailyPlanPrice: daily,
      enterWeeklyPlanPrice: weeklyPerDay * 7,
      enterMonthlyPlanPrice: monthlyPrice,
    },
  };
}

// --- hubs -------------------------------------------------------------------
const HUBS = [
  hub('hub_hsr', 'BLive HSR Layout', 'HSR Layout, Sector 2, Bengaluru 560102', 12.9121, 77.6446),
  hub('hub_indiranagar', 'BLive Indiranagar', '100 Ft Road, Indiranagar, Bengaluru 560038', 12.9719, 77.6412),
  hub('hub_whitefield', 'BLive Whitefield', 'ITPL Main Road, Whitefield, Bengaluru 560066', 12.9698, 77.7499),
];
function hub(id, name, address, latitude, longitude) {
  return {
    id,
    hubName: name,
    name,
    address,
    contactNumber: '+91 75695 46222',
    contactEmail: 'hubs@blive.co.in',
    latitude,
    longitude,
    image: '/images/Hub.jpg',
    isActive: true,
  };
}

// --- coupons ----------------------------------------------------------------
const COUPONS = [
  { id: 'cpn_first', code: 'FIRST10', description: '10% off your first ride', discountType: 'percentage', discountValue: 10, isActive: true, currentRedemptions: 12, limitRedemptions: 500 },
  { id: 'cpn_weekend', code: 'WEEKEND150', description: 'Flat ₹150 off weekend rentals', discountType: 'flat', discountValue: 150, isActive: true, currentRedemptions: 40, limitRedemptions: 300 },
  { id: 'cpn_monsoon', code: 'MONSOON20', description: '20% off monthly plans', discountType: 'percentage', discountValue: 20, isActive: true, currentRedemptions: 5, limitRedemptions: 100 },
];

// --- notifications ----------------------------------------------------------
const NOTIFICATIONS = [
  { id: 'ntf_1', message: 'Your booking BLIVE-DEMO-1042 is confirmed. Pickup at HSR Layout.', status: 'UNSEEN', createdAt: iso(addDays(-1)) },
  { id: 'ntf_2', message: 'Use code MONSOON20 for 20% off your next monthly plan.', status: 'UNSEEN', createdAt: iso(addDays(-3)) },
  { id: 'ntf_3', message: 'Welcome to BLive! Complete your KYC to ride faster next time.', status: 'SEEN', createdAt: iso(addDays(-10)) },
];

// --- bookings ---------------------------------------------------------------
function mkBooking(id, bookingId, orderStatus, planType, offsetPickup, offsetDropoff, amount, vehicle, h) {
  return {
    id,
    bookingId,
    orderStatus,
    planType,
    pickUpDate: iso(addDays(offsetPickup)),
    dropOffDate: iso(addDays(offsetDropoff)),
    createdAt: iso(addDays(offsetPickup - 2)),
    updatedAt: iso(addDays(offsetPickup - 1)),
    validTill: iso(addDays(offsetDropoff)),
    lastPaymentAmount: String(amount),
    lastPaymentAt: iso(addDays(offsetPickup - 2)),
    isHomeDelivery: false,
    dropOffAddress: null,
    promoCodeId: null,
    vehicleModel: { modelName: vehicle.model.modelName, manufacturer: vehicle.model.manufacturer, brand: { logo: `/images/${vehicle.brand.name}.png`, name: vehicle.brand.name } },
    plan: vehicle.plan,
    hub: h,
  };
}
const BOOKING_UPCOMING = mkBooking('bk_up', 'BLIVE-DEMO-1042', 'upcoming-booking', 'weekly', 3, 10, 3633, VEHICLES[0], HUBS[0]);
const BOOKING_ACTIVE = mkBooking('bk_act', 'BLIVE-DEMO-1021', 'ongoing-booking', 'daily', -2, 4, 3499, VEHICLES[1], HUBS[1]);
const BOOKING_DONE = mkBooking('bk_done', 'BLIVE-DEMO-0987', 'completed-booking', 'monthly', -45, -15, 8000, VEHICLES[2], HUBS[2]);
const BOOKING_CANCELLED = mkBooking('bk_can', 'BLIVE-DEMO-0955', 'cancelled-booking', 'daily', -30, -28, 2999, VEHICLES[3], HUBS[0]);
const BOOKINGS_BY_ID = Object.fromEntries(
  [BOOKING_UPCOMING, BOOKING_ACTIVE, BOOKING_DONE, BOOKING_CANCELLED].map((b) => [b.id, b])
);

// --- KYC documents ----------------------------------------------------------
const KYC_DOCUMENTS = [
  { type: 'aadhaar_front', imageUrlFront: '/images/placeholder.jpeg', status: 'verified' },
  { type: 'driving_license', imageUrlFront: '/images/placeholder.jpeg', status: 'pending' },
];

// --- pricing engine (dummy but internally consistent) -----------------------
function calcPricing(body = {}) {
  const v = VEHICLES.find((x) => x.model.id === body.vehicleModelId) || VEHICLES[0];
  const ratePlan = (body.ratePlan || 'daily').toLowerCase();
  const days = durationDays(body.pickupDate, body.dropoffDate) || (ratePlan === 'monthly' ? 30 : ratePlan === 'weekly' ? 7 : 1);

  let total_rental;
  if (ratePlan === 'monthly') total_rental = v.plan.enterMonthlyPlanPrice * Math.max(1, Math.round(days / 30));
  else if (ratePlan === 'weekly') total_rental = v.plan.enterWeeklyPlanPrice * Math.max(1, Math.round(days / 7));
  else total_rental = v.plan.enterDailyPlanPrice * Math.max(1, days);

  const home_delivery_amount = body.isHomeDelivery ? 200 : 0;
  const discount_amount = body.promoCodeId ? Math.round(total_rental * 0.1) : 0;
  const gst_percentage = 18;
  const taxableBase = total_rental + home_delivery_amount - discount_amount;
  const gst_amount = Math.round(taxableBase * 0.18);
  const security_deposit = v.model.b2cDeposit;
  const subtotal = taxableBase; // pre-tax payable; UI adds GST + deposit as needed

  return {
    payment_breakdown: {
      duration: days,
      total_rental,
      home_delivery_amount,
      discount_amount,
      gst_percentage,
      gst_amount,
      security_deposit,
      subtotal,
      included_km_per_day: v.model.perDayKmLimit,
      extra_km_charge: v.model.perKmCharge,
      onboarding_fee: v.plan.onboardingFee,
    },
    vehicleModelId: v.model.id,
    ratePlan,
  };
}

// --- request router ---------------------------------------------------------
function route(method, rawPath, body) {
  const path = (rawPath || '').split('?')[0];
  const M = method.toUpperCase();

  // auth / OTP
  if (M === 'POST' && path === '/v1/sms/send-otp')
    return ok({ otp: '123456' }, 'OTP sent (dummy — enter any 6 digits)');
  if (M === 'POST' && path === '/v1/sms/verify-otp')
    return ok({ ...DEMO_USER, token: { accessToken: 'dummy.jwt.access', refreshToken: 'dummy.jwt.refresh' } }, 'OTP verified');

  // user onboarding
  if (M === 'POST' && path === '/user-onboarding/update-user')
    return ok({ ...DEMO_USER, firstName: body?.firstName || DEMO_USER.firstName, lastName: body?.lastName || DEMO_USER.lastName, currentState: 'active' }, 'User updated');
  if (M === 'GET' && path.startsWith('/user-onboarding/user-information/'))
    return ok({ ...DEMO_USER });
  if (M === 'POST' && path.startsWith('/user-onboarding/update-user-image/'))
    return ok({ profileUrl: '/images/DummyPerson.png' }, 'Profile image updated');

  // e-KYC
  if (M === 'GET' && path.startsWith('/e-kyc/get-documents'))
    return ok({ documents: KYC_DOCUMENTS, email: DEMO_USER.email });
  if (M === 'POST' && path.startsWith('/e-kyc/upload-documents'))
    return ok({ documents: KYC_DOCUMENTS }, 'Documents uploaded');

  // catalog + pricing
  if (M === 'GET' && path.startsWith('/vehicle-plan/vehicle-model-with-plan'))
    return ok({ data: VEHICLES, pagination: { total: VEHICLES.length, totalPages: 1, page: 1, limit: 12 } });
  if (M === 'POST' && path === '/vehicle-plan/dynamic-calculation')
    return ok(calcPricing(body));

  // payments (Razorpay bypass handled in Booking.jsx / ModifyDates.jsx)
  if (M === 'POST' && path === '/vehicle-plan/handle-payment') {
    const orderId = 'order_dummy_' + Date.now();
    return ok({
      razorpayKey: 'rzp_test_dummy',
      orderId,
      razorpayOrder: { id: orderId, amount: (body?.amount || 0) * 100, currency: 'INR' },
      amount: body?.amount || 0,
    }, 'Order created');
  }
  if (M === 'POST' && path === '/vehicle-plan/verify-payment') {
    return ok({
      bookingId: 'BLIVE-DEMO-' + Math.floor(1000 + Math.random() * 9000),
      razorpayOrder: { id: body?.razorpayOrderId || 'order_dummy' },
      paymentSummary: { amount: body?.amount || 0, status: 'PAID' },
    }, 'Payment verified & booking created');
  }

  // hubs
  if (M === 'GET' && path === '/vehicle-plan/all-hubs')
    return ok(HUBS);

  // bookings
  if (M === 'GET' && path.startsWith('/vehicle-plan/booking-history'))
    return ok({
      upcomingBooking: [BOOKING_UPCOMING],
      activeBooking: [BOOKING_ACTIVE],
      completedBooking: [BOOKING_DONE],
      cancelledBooking: [BOOKING_CANCELLED],
    });
  if (M === 'GET' && path.startsWith('/vehicle-plan/booking/')) {
    const id = path.split('/vehicle-plan/booking/')[1];
    return ok(BOOKINGS_BY_ID[id] || BOOKING_UPCOMING);
  }
  if (M === 'POST' && path.startsWith('/vehicle-plan/cancel-booking/'))
    return ok({ status: 'cancelled', refundAmount: 1200, message: 'Booking cancelled (dummy)' }, 'Booking cancelled');
  if (M === 'POST' && path.startsWith('/vehicle-plan/change-dates/'))
    return ok({ additionalAmount: 350, daysDifference: 2, message: 'New dates calculated (dummy)' });

  // coupons / new-user
  if (M === 'GET' && path.startsWith('/vehicle-plan/check-new-user'))
    return ok({ newUser: true });
  if (M === 'GET' && path.startsWith('/vehicle-plan/available-coupons'))
    return ok(COUPONS);

  // notifications
  if (M === 'GET' && path.startsWith('/vehicle-plan/notifications'))
    return ok({ notifications: NOTIFICATIONS, unseenCount: NOTIFICATIONS.filter((n) => n.status === 'UNSEEN').length });
  if (M === 'PUT' && path.startsWith('/vehicle-plan/notifications/mark-all-seen'))
    return ok({ updated: true });

  // stats
  if (M === 'GET' && path === '/vehicle-plan/environmental-stats')
    return ok({ activeUsers: 1284, co2SavedKg: '4520', petrolSavedLiters: '1890' });

  // unmapped — surface loudly so we notice a missing mock during the demo
  console.warn(`[mock] Unhandled ${M} ${path} — returning empty success`);
  return ok(null, `No dummy mapping for ${M} ${path}`);
}

/** Resolve a mocked request the way axios would resolve response.data. */
export async function resolveMock(method, path, body) {
  await delay(LATENCY_MS);
  return route(method, path, body);
}

/** True when the dummy-frontend flag is on. */
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';
