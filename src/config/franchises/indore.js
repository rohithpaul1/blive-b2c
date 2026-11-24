// Indore franchise site: e-Sprinto Esprinto HS, one hub.
// Specs and photos: esprinto.in product page (Nov 2026). Photos are fetched into
// public/images/franchises/indore/ by scripts/fetch-indore-images.sh.
// MOCK DATA: franchise name, hub, prices, stats and the testimonial are placeholders.
import { paletteFor } from "../theme";
import { nxtBenefits } from "../benefits";

// Accent candidates from the demo. Deep teal (the first) was chosen on 18 Nov 2026.
export const indoreAccents = [
  { name: "Deep teal", hex: "#0f6e6e" },
  { name: "Saffron", hex: "#b8640f" },
  { name: "Indigo", hex: "#3b4cca" },
];

const ACCENT = indoreAccents[0].hex;
const IMG = "/images/franchises/indore";
// Side-on transparent product shot for the search page stage (like Jaipur's NDuro cutout).
const CUTOUT = `${IMG}/hs-white.webp`;

export const indore = {
  slug: "indore",
  domains: ["indore"],
  accent: ACCENT,
  palette: paletteFor(ACCENT),
  // MOCK: indoreHD aerial (watermarked, 640px). Replace with a licensed, full-size photo before launch.
  heroImage: `${IMG}/indore-hero.webp`,
  // City tile shows the stadium and streets, not the sky.
  cityTilePosition: "center 85%",
  // Benefit tiles: the EV tile shows the three-colour line-up, the maintenance tile the white scooter.
  benefits: nxtBenefits.map((b) =>
    b.icon === "ev" ? { ...b, photo: "model", image: `${IMG}/hs-fleet.webp` } : b.icon === "maintenance" ? { ...b, image: `${IMG}/hs-white.webp` } : b
  ),
  // Road photo, kept for the testimonial fallback only.
  tileImage: `${IMG}/hs-scooter.webp`,
  // The road photo is too small to run full width, so the testimonial band uses an accent glow.
  quoteImage: null,
  seo: { title: "BLive NXT Indore | Electric scooter rentals" },
  brand: "BLive NXT",
  // Header shows BLive NXT × Evision; the city moves to the hero eyebrow; partner band above the footer.
  brandMode: "cobrand",
  franchiseName: "Evision Mobility",
  franchiseTagline: "Quiet rides, clean cities, electric fleets.",
  // Evision's website, for the "About Evision" link in the partner band. Empty hides the link.
  partnerUrl: "",
  hubArea: "Vijay Nagar",
  legalEntity: "Evision Mobility LLP",
  // Franchise logo (traced from a 430px image; swap for the vector when Evision sends it).
  franchiseLogo: `${IMG}/evision-logo.webp`,
  franchiseLogoOnDark: `${IMG}/evision-logo-white.webp`,
  city: "Indore",
  hubAddress: "Shop 4, AB Road, near C21 Mall, Vijay Nagar, Indore 452010",
  supportPhone: "080-4719-0022",
  supportPhoneHref: "tel:08047190022",
  // Franchise's own number for the top bar. Empty: the shared support line above is shown.
  // MOCK: dummy number until the franchise sends its own.
  navPhone: "+91 90000 00002",
  businessEmail: "contact@blive.co.in",
  businessEmailHref: "mailto:contact@blive.co.in?subject=Business%20enquiry%20(Indore)",
  headline: "India's cleanest city goes electric.",
  stats: [
    { value: "New", label: "in Indore" },
    { value: "24/7", label: "support" },
    { value: "₹0", label: "fuel cost" },
  ],
  kmPerDay: 60,
  deposit: "₹2,000",
  monthlySaving: "₹2,500",
  addOns: [
    {
      id: "phone-kit",
      name: "Phone holder + USB charger",
      price: 99,
      per: "one-time",
      details: "A handlebar mount that keeps your delivery app in view, and a charger so your phone lasts the whole shift.",
    },
    {
      id: "top-box",
      name: "Delivery top box",
      price: 20,
      per: "day",
      details: "A 45 L lockable box on the rear carrier. Fits most food and parcel orders.",
    },
    {
      id: "extra-km",
      name: "Extra 40 km a day",
      price: 30,
      per: "day",
      kmBonus: 40,
      details: "100 km a day instead of 60, for long or double shifts. Cheaper than paying for extra km.",
    },
    {
      id: "rain-kit",
      name: "Rain kit",
      price: 149,
      per: "one-time",
      details: "A raincoat and a waterproof seat cover for monsoon shifts.",
    },
    {
      id: "damage-cover",
      name: "Damage cover",
      price: 29,
      per: "day",
      details: "Pay nothing for minor scratches and dents during your rental.",
    },
  ],
  model: {
    name: "Esprinto HS",
    // The search page lists only models from this brand (matched on brand or model name).
    brand: "Esprinto",
    cutout: CUTOUT,
    // Large shot in the homepage model section.
    heroShot: `${IMG}/hs-spec.webp`,
    features: [
      { icon: "range", label: "120 km range" },
      { icon: "speed", label: "50 km/h" },
      { icon: "battery", label: "60V 42Ah lithium" },
      { icon: "charge", label: "3-4 h full charge" },
    ],
    specs: [
      { value: "120 km", label: "max range" },
      { value: "50 km/h", label: "top speed" },
      { value: "3-4 h", label: "full charge" },
      { value: "150 kg", label: "carrying capacity" },
    ],
    // Close-ups are esprinto.in's round shots (red ring removed), shown whole on a dark tile.
    gallery: [
      { src: `${IMG}/hs-dashboard.webp`, alt: "Esprinto HS digital dashboard", caption: "Digital dashboard", fit: "circle" },
      { src: `${IMG}/hs-features.webp`, alt: "Esprinto HS remote key", caption: "Remote key with central lock", fit: "circle" },
      { src: `${IMG}/hs-high-speed.webp`, alt: "Esprinto HS headlamp", caption: "LED headlamp", fit: "circle" },
      { src: `${IMG}/hs-battery.webp`, alt: "Esprinto HS key ignition", caption: "Keyed ignition", fit: "circle" },
    ],
    // Full spec sheet from esprinto.in, for the model page and the admin.
    specSheet: {
      battery: "Lithium-ion NMC, 60V 30Ah / 42Ah",
      motor: "800W BLDC hub motor",
      topSpeed: "50 km/h",
      maxRange: "120 km",
      chargingTime: "3-4 h",
      kerbWeight: "78 kg",
      carryingCapacity: "150 kg",
      brakes: "Front and rear disc",
      tyres: '10"',
      wheelbase: "1325 mm",
      dimensions: "1820 x 700 x 1100 mm",
      gradeability: "10 degrees",
      colours: ["Ruby Red", "Denim Blue", "Pearl White"],
      features: ["Remote central lock", "Find my vehicle", "Part failure alerts", "Reverse mode"],
    },
  },
  plans: [
    {
      id: "daily",
      name: "Daily",
      sub: "1–6 days",
      tags: [{ label: "Maintenance" }, { label: "24/7 support" }],
      image: `${IMG}/hs-red.webp`,
      // Cutout: shown whole on the card instead of cropped like a photo.
      imageFit: "contain",
      imageAlt: "Esprinto HS in Ruby Red",
      perDay: "₹280",
      total: "₹560",
      totalNote: "for 2 days",
      pickerNote: "2 days",
      cta: "Book daily",
    },
    {
      id: "weekly",
      name: "Weekly",
      sub: "7–29 days",
      tags: [{ label: "Save 10%", accent: true }, { label: "24/7 support" }],
      image: `${IMG}/hs-blue.webp`,
      // Cutout: shown whole on the card instead of cropped like a photo.
      imageFit: "contain",
      imageAlt: "Esprinto HS in Denim Blue",
      perDay: "₹250",
      total: "₹1,750",
      totalNote: "for 7 days",
      pickerNote: "7 days · save 10%",
      cta: "Book weekly",
    },
    {
      id: "monthly",
      name: "Subscription",
      sub: "30+ days",
      tags: [{ label: "Save 50%", accent: true }, { label: "24/7 support" }],
      image: `${IMG}/hs-white.webp`,
      // Cutout: shown whole on the card instead of cropped like a photo.
      imageFit: "contain",
      imageAlt: "Esprinto HS in Pearl White",
      perDay: "₹140",
      total: "₹4,200",
      totalNote: "a month",
      pickerNote: "30 days, renews monthly · save 50%",
      cta: "Subscribe",
      best: true,
    },
  ],
  steps: [
    { title: "Pick your dates", body: "Choose pickup and return times that suit your day, down to the half hour." },
    { title: "Choose your plan", body: "Ride by the day, save 10% by the week, or subscribe and save 50%." },
    { title: "Pay in a minute", body: "One secure online payment and your scooter is held for you." },
    { title: "Get verified online", body: "Upload your licence and Aadhaar from your phone. No paperwork at the hub." },
    { title: "Grab the keys and go", body: "Pick up a ready-to-ride Esprinto HS at the Vijay Nagar hub and head out." },
  ],
  moreImages: {
    // Cutouts: shown whole, standing at the foot of each card.
    // Reuse kept far from where each image first appears; the line-up is used once, above.
    subscribe: { src: `${IMG}/hs-spec.webp`, alt: "Esprinto HS in Pearl White", fit: "contain" },
    team: { src: `${IMG}/hs-blue.webp`, alt: "Esprinto HS in Denim Blue", fit: "contain" },
    help: { src: `${IMG}/hs-red.webp`, alt: "Esprinto HS in Ruby Red", fit: "contain" },
  },
  subscribePerDay: "₹140",
  quote: {
    text: "Booked on my phone, picked it up the same evening. My daily delivery shifts cost far less than on petrol.",
    name: "Rahul M.",
    meta: "Delivery rider, Vijay Nagar",
  },
  faqs: [
    {
      q: "What's the difference between fixed rental and subscription?",
      a: "Fixed rental is for a set number of days or weeks. A subscription runs month to month at the lowest daily price.",
    },
    { q: "What documents do I need?", a: "A valid driving licence and Aadhaar, uploaded online." },
    {
      q: "Is there a security deposit?",
      a: "Yes, ₹2,000. It's fully refundable and comes back to you within 5 working days of returning the scooter.",
    },
    { q: "Where do I pick up the scooter?", a: "At our Vijay Nagar hub on AB Road, near C21 Mall." },
  ],
};
