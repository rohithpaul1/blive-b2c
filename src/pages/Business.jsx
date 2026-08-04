import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeIndianRupee,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import Navbar from "../sections/Navbar";
import Footer from "../sections/Footer";

const CITY_OPTIONS = [
  "Bengaluru, Karnataka",
  "Hyderabad, Telangana",
  "Mumbai, Maharashtra",
  "Pune, Maharashtra",
  "Chennai, Tamil Nadu",
  "Delhi NCR",
  "Other",
];

const DURATION_OPTIONS = [1, 3, 6, 12, 18, 24, 36];

const BUSINESS_USE_CASES = [
  {
    title: "Quick commerce deliveries",
    image: "/images/business/quick-commerce.png",
  },
  {
    title: "3PL and logistics operations",
    image: "/images/business/logistics.png",
  },
  {
    title: "Employee commute programmes",
    image: "/images/business/employee-commute.png",
  },
  {
    title: "Field service operations",
    image: "/images/business/field-service.png",
  },
  {
    title: "Food delivery fleets",
    image: "/images/business/food-delivery.png",
  },
];

const emptyLine = () => ({ modelName: "", quantity: 10 });

const inputClass =
  "mt-2 h-12 w-full rounded-[12px] border border-[#dedce1] bg-white px-4 text-[15px] text-[#262626] outline-none transition placeholder:text-[#969198] focus:border-[#6a5294] focus:ring-2 focus:ring-[#6a5294]/10";

function FieldLabel({ children }) {
  return (
    <span className="block text-[13px] font-bold text-[#3f3a42]">
      {children}
    </span>
  );
}

function Business() {
  const navigate = useNavigate();
  const catalog = useQuery("b2c/catalog:list", {});
  const createEnquiry = useMutation("enquiries:createEnquiry");
  const submissionReference = useRef(null);

  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    location: "Bengaluru, Karnataka",
    rentalStartDate: "",
    durationMonths: 6,
    notes: "",
    consent: false,
    website: "",
  });
  const [lines, setLines] = useState([emptyLine()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(null);

  const models = useMemo(() => {
    const rows = Array.isArray(catalog?.data) ? catalog.data : [];
    const unique = new Map();
    rows.forEach((row) => {
      const name = row?.model?.modelName?.trim();
      if (!name || unique.has(name)) return;
      unique.set(name, {
        name,
        image:
          row?.model?.imageUrl ||
          row?.model?.images?.[0] ||
          row?.brand?.brandLogo ||
          "/images/vehicle-models/electric-scooter-generic.jpg",
        available: Number(row?.availableVehiclesCount || 0),
      });
    });
    return [...unique.values()];
  }, [catalog]);

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const updateLine = (index, patch) => {
    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...patch } : line
      )
    );
    setError("");
  };

  const validate = () => {
    if (!form.companyName.trim()) return "Enter your company name.";
    if (!form.contactName.trim()) return "Enter a contact person.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      return "Enter a valid work email address.";
    }
    if (!form.phone.trim()) return "Enter a contact number.";
    if (!form.rentalStartDate) return "Choose an expected start date.";
    if (lines.some((line) => !line.modelName || Number(line.quantity) < 1)) {
      return "Choose a model and quantity for every fleet line.";
    }
    if (!form.consent) return "Confirm that we may contact you about this enquiry.";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.website) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      if (!submissionReference.current) {
        const id = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
        submissionReference.current = `business-web-${id}`;
      }
      const result = await createEnquiry({
        externalReference: submissionReference.current,
        source: "website-business",
        companyName: form.companyName.trim(),
        contactName: form.contactName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        location: form.location,
        rentalStartDate: form.rentalStartDate,
        notes: form.notes.trim() || undefined,
        lines: lines.map((line) => ({
          modelName: line.modelName,
          quantity: Number(line.quantity),
          durationMonths: Number(form.durationMonths),
        })),
        details: {
          channel: "business-page",
          rentalType: "b2b",
          requestedModelCount: lines.length,
        },
      });
      setSubmitted({
        number: result?.enquiry?.number ?? "Received",
        companyName: form.companyName.trim(),
        vehicleCount: lines.reduce(
          (total, line) => total + Number(line.quantity || 0),
          0
        ),
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We could not submit your enquiry. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-[#262626]">
      <Navbar />

      <main className="pt-[72px]">
        <section className="relative overflow-hidden bg-[#17131f] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(108,77,166,0.32),transparent_38%)]" />
          <div className="relative mx-auto grid max-w-[1280px] items-center gap-10 px-5 py-14 sm:px-8 md:min-h-[610px] md:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)] md:px-12 md:py-20 lg:px-16">
            <div className="max-w-[650px]">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[12px] font-bold text-white/85">
                <Building2 className="size-4" aria-hidden="true" />
                BLive for Business
              </span>
              <h1 className="mt-6 text-[42px] font-black leading-[1.02] tracking-[-0.045em] sm:text-[58px] md:text-[66px]">
                The smarter way to rent vehicles
                <span className="block text-[#c9b8f0]">for your business.</span>
              </h1>
              <p className="mt-6 max-w-[560px] text-[17px] leading-7 text-white/68 sm:text-[19px]">
                Fleet rentals for delivery, employee commute, field operations,
                and enterprise mobility—planned around your requirements.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#business-enquiry"
                  className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-[14px] bg-white px-6 text-[15px] font-bold text-[#24183d] transition hover:bg-[#f4f0fc]"
                >
                  Plan your fleet
                  <ArrowRight className="size-[18px]" aria-hidden="true" />
                </a>
                <a
                  href="#how-business-works"
                  className="inline-flex min-h-[54px] items-center justify-center rounded-[14px] border border-white/20 px-6 text-[15px] font-bold text-white transition hover:bg-white/10"
                >
                  See how it works
                </a>
              </div>
              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-[13px] font-medium text-white/70">
                {["Multiple models", "Flexible fleet sizes", "Deployment support"].map(
                  (item) => (
                    <span key={item} className="flex items-center gap-2">
                      <Check className="size-4 text-[#bba4ef]" aria-hidden="true" />
                      {item}
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="relative mx-auto h-[390px] w-full max-w-[520px] sm:h-[480px]">
              <div className="absolute left-0 top-4 w-[70%] overflow-hidden rounded-[26px] border border-white/10 bg-white/10 p-3 shadow-2xl backdrop-blur">
                <img
                  src="/images/vehicle-models/ather-450x-electric.jpg"
                  alt="Ather electric scooter for a business fleet"
                  className="h-[230px] w-full rounded-[18px] object-cover sm:h-[300px]"
                />
                <div className="flex items-center justify-between px-2 pb-1 pt-3">
                  <span className="text-[14px] font-bold">Urban mobility</span>
                  <span className="text-[12px] text-white/60">EV fleet</span>
                </div>
              </div>
              <div className="absolute bottom-2 right-0 w-[58%] overflow-hidden rounded-[24px] border border-white/10 bg-[#2a2235] p-3 shadow-2xl">
                <img
                  src="/images/vehicle-models/tvs-iqube-electric.jpg"
                  alt="TVS electric scooter for business rentals"
                  className="h-[165px] w-full rounded-[16px] object-cover sm:h-[210px]"
                />
                <div className="px-2 pb-1 pt-3">
                  <span className="text-[13px] font-bold">Built around your requirement</span>
                  <span className="mt-1 block text-[11px] text-white/55">
                    Model · quantity · duration
                  </span>
                </div>
              </div>
              <div className="absolute right-3 top-10 rounded-[18px] border border-white/15 bg-white px-4 py-3 text-[#2b2333] shadow-xl sm:right-0">
                <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[#746b7b]">
                  One workflow
                </span>
                <span className="mt-1 block text-[16px] font-black">Enquire → Deploy</span>
              </div>
            </div>
          </div>
        </section>

        <section id="how-business-works" className="bg-[#f7f6f8] px-5 py-16 sm:px-8 md:py-20">
          <div className="mx-auto max-w-[1180px]">
            <div className="max-w-[650px]">
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#6a5294]">
                A simple commercial journey
              </p>
              <h2 className="mt-3 text-[32px] font-black tracking-[-0.035em] sm:text-[42px]">
                From requirement to deployment, in one flow.
              </h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-4">
              {[
                ["01", "Share your requirement", "Choose the models, quantity, city, and expected rental duration."],
                ["02", "Review your quotation", "Receive one proposal with vehicle rates and commercial terms."],
                ["03", "Complete business verification", "Upload KYB documents only after you accept the quotation."],
                ["04", "Plan deployment", "We align vehicles, hub, and delivery before your rental starts."],
              ].map(([step, title, copy]) => (
                <article key={step} className="rounded-[20px] border border-[#e6e3e8] bg-white p-5">
                  <span className="text-[12px] font-black text-[#6a5294]">{step}</span>
                  <h3 className="mt-7 text-[18px] font-black">{title}</h3>
                  <p className="mt-3 text-[14px] leading-6 text-[#716c75]">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="business-enquiry" className="px-5 py-16 sm:px-8 md:py-24">
          <div className="mx-auto grid max-w-[1180px] items-start gap-10 lg:grid-cols-[minmax(0,0.72fr)_minmax(600px,1.28fr)]">
            <div className="lg:sticky lg:top-[104px]">
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#6a5294]">
                Fleet enquiry
              </p>
              <h2 className="mt-3 text-[34px] font-black tracking-[-0.04em] sm:text-[44px]">
                Tell us what your business needs.
              </h2>
              <p className="mt-4 text-[16px] leading-7 text-[#716c75]">
                This goes directly to the BLive commercial team. We will review
                availability and send a quotation before asking for KYB documents.
              </p>
              <div className="mt-7 space-y-4 rounded-[18px] bg-[#f7f6f8] p-5">
                {[
                  [<Users key="users" className="size-[18px]" aria-hidden="true" />, "No account needed", "Submit the requirement first."],
                  [<ShieldCheck key="shield" className="size-[18px]" aria-hidden="true" />, "KYB comes later", "Verification starts only after acceptance."],
                  [<CheckCircle2 key="check" className="size-[18px]" aria-hidden="true" />, "One commercial record", "Your enquiry, quote, and rental stay connected."],
                ].map(([icon, title, copy]) => (
                  <div key={title} className="flex gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-white text-[#5b3b8e] shadow-sm">
                      {icon}
                    </span>
                    <div>
                      <p className="text-[14px] font-bold">{title}</p>
                      <p className="mt-0.5 text-[13px] text-[#777179]">{copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-[#e0dde3] bg-white shadow-[0_20px_60px_rgba(32,24,43,0.09)]">
              {submitted ? (
                <div className="flex min-h-[620px] flex-col items-center justify-center px-6 py-14 text-center sm:px-12">
                  <span className="flex size-16 items-center justify-center rounded-full bg-[#edf8f1] text-[#208653]">
                    <CheckCircle2 className="size-8" aria-hidden="true" />
                  </span>
                  <p className="mt-6 font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-[#6a5294]">
                    {submitted.number}
                  </p>
                  <h2 className="mt-3 text-[32px] font-black tracking-[-0.035em]">
                    Your fleet enquiry is in.
                  </h2>
                  <p className="mt-4 max-w-[460px] text-[15px] leading-6 text-[#716c75]">
                    We received {submitted.vehicleCount} vehicles for {submitted.companyName}.
                    The commercial team can now review it in the B2B pipeline and prepare your quotation.
                  </p>
                  <div className="mt-8 flex w-full max-w-[420px] flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => navigate("/home")}
                      className="min-h-[50px] flex-1 rounded-[13px] border border-[#dcd8e0] px-5 text-[14px] font-bold text-[#3f3a42]"
                    >
                      Back to home
                    </button>
                    <a
                      href="mailto:contact@blive.co.in"
                      className="flex min-h-[50px] flex-1 items-center justify-center rounded-[13px] bg-[#351a75] px-5 text-[14px] font-bold text-white"
                    >
                      Contact BLive
                    </a>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <div className="border-b border-[#e6e3e8] px-5 py-5 sm:px-7">
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-[#f2edf9] text-[#5b3b8e]">
                        <Building2 className="size-5" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-[19px] font-black">Business and contact</h3>
                        <p className="mt-1 text-[13px] text-[#777179]">
                          We will use these details to prepare the quotation.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-5 px-5 py-6 sm:grid-cols-2 sm:px-7">
                    <label>
                      <FieldLabel>Company name</FieldLabel>
                      <input
                        value={form.companyName}
                        onChange={(event) => updateForm("companyName", event.target.value)}
                        placeholder="Example: Acme Logistics"
                        className={inputClass}
                        autoComplete="organization"
                      />
                    </label>
                    <label>
                      <FieldLabel>Contact person</FieldLabel>
                      <input
                        value={form.contactName}
                        onChange={(event) => updateForm("contactName", event.target.value)}
                        placeholder="Full name"
                        className={inputClass}
                        autoComplete="name"
                      />
                    </label>
                    <label>
                      <FieldLabel>Work email</FieldLabel>
                      <span className="relative block">
                        <Mail className="pointer-events-none absolute left-4 top-[25px] size-[17px] text-[#777179]" aria-hidden="true" />
                        <input
                          type="email"
                          value={form.email}
                          onChange={(event) => updateForm("email", event.target.value)}
                          placeholder="name@company.com"
                          className={`${inputClass} pl-11`}
                          autoComplete="email"
                        />
                      </span>
                    </label>
                    <label>
                      <FieldLabel>Contact number</FieldLabel>
                      <span className="relative block">
                        <Phone className="pointer-events-none absolute left-4 top-[25px] size-[17px] text-[#777179]" aria-hidden="true" />
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(event) => updateForm("phone", event.target.value)}
                          placeholder="+91 98765 43210"
                          className={`${inputClass} pl-11`}
                          autoComplete="tel"
                        />
                      </span>
                    </label>
                    <input
                      tabIndex={-1}
                      aria-hidden="true"
                      autoComplete="off"
                      value={form.website}
                      onChange={(event) => updateForm("website", event.target.value)}
                      className="hidden"
                      name="website"
                    />
                  </div>

                  <div className="border-y border-[#e6e3e8] bg-[#fbfafc] px-5 py-5 sm:px-7">
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-white text-[#5b3b8e] shadow-sm">
                        <MapPin className="size-5" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-[19px] font-black">Fleet requirement</h3>
                        <p className="mt-1 text-[13px] text-[#777179]">
                          Add every vehicle model you are considering.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-6 sm:px-7">
                    <div className="grid gap-5 sm:grid-cols-3">
                      <label>
                        <FieldLabel>Deployment city</FieldLabel>
                        <select
                          value={form.location}
                          onChange={(event) => updateForm("location", event.target.value)}
                          className={inputClass}
                        >
                          {CITY_OPTIONS.map((city) => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <FieldLabel>Expected start date</FieldLabel>
                        <span className="relative block">
                          <CalendarDays className="pointer-events-none absolute left-4 top-[25px] size-[17px] text-[#777179]" aria-hidden="true" />
                          <input
                            type="date"
                            min={new Date().toISOString().slice(0, 10)}
                            value={form.rentalStartDate}
                            onChange={(event) => updateForm("rentalStartDate", event.target.value)}
                            className={`${inputClass} pl-11`}
                          />
                        </span>
                      </label>
                      <label>
                        <FieldLabel>Rental duration</FieldLabel>
                        <select
                          value={form.durationMonths}
                          onChange={(event) => updateForm("durationMonths", Number(event.target.value))}
                          className={inputClass}
                        >
                          {DURATION_OPTIONS.map((duration) => (
                            <option key={duration} value={duration}>
                              {duration} {duration === 1 ? "month" : "months"}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="mt-7">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <FieldLabel>Vehicles</FieldLabel>
                          <p className="mt-1 text-[12px] text-[#777179]">
                            Quantities are the number of vehicles, not model variants.
                          </p>
                        </div>
                        <span className="rounded-full bg-[#f3f1f5] px-3 py-1.5 text-[11px] font-bold text-[#5e5861]">
                          {lines.length} {lines.length === 1 ? "model" : "models"}
                        </span>
                      </div>

                      <div className="mt-4 space-y-3">
                        {lines.map((line, index) => {
                          const selectedModel = models.find((model) => model.name === line.modelName);
                          return (
                            <div key={index} className="grid gap-3 rounded-[16px] border border-[#e1dee4] p-3 sm:grid-cols-[56px_minmax(0,1fr)_130px_42px] sm:items-center">
                              <span className="hidden size-14 overflow-hidden rounded-[12px] bg-[#f4f2f5] sm:block">
                                <img
                                  src={selectedModel?.image || "/images/vehicle-models/electric-scooter-generic.jpg"}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              </span>
                              <label>
                                <span className="mb-1 block text-[11px] font-bold text-[#716c75] sm:hidden">Vehicle model</span>
                                <select
                                  aria-label={`Vehicle model ${index + 1}`}
                                  value={line.modelName}
                                  onChange={(event) => updateLine(index, { modelName: event.target.value })}
                                  className="h-11 w-full rounded-[10px] border border-[#dedce1] bg-white px-3 text-[14px] font-medium outline-none focus:border-[#6a5294]"
                                >
                                  <option value="">Select a vehicle model</option>
                                  {models.map((model) => (
                                    <option key={model.name} value={model.name}>
                                      {model.name}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                <span className="mb-1 block text-[11px] font-bold text-[#716c75] sm:hidden">Quantity</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="5000"
                                  aria-label={`Vehicle quantity ${index + 1}`}
                                  value={line.quantity}
                                  onChange={(event) => updateLine(index, { quantity: event.target.value })}
                                  className="h-11 w-full rounded-[10px] border border-[#dedce1] bg-white px-3 text-[14px] outline-none focus:border-[#6a5294]"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))}
                                disabled={lines.length === 1}
                                aria-label={`Remove vehicle model ${index + 1}`}
                                className="flex size-10 items-center justify-center rounded-[10px] text-[#777179] transition hover:bg-[#fff0f0] hover:text-[#b42318] disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <Trash2 className="size-[17px]" aria-hidden="true" />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => setLines((current) => [...current, emptyLine()])}
                        disabled={lines.length >= 10}
                        className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-[11px] border border-[#dcd8e0] px-4 text-[13px] font-bold text-[#3f3a42] transition hover:bg-[#f8f6fa] disabled:opacity-40"
                      >
                        <Plus className="size-4" aria-hidden="true" />
                        Add another model
                      </button>
                    </div>

                    <label className="mt-7 block">
                      <FieldLabel>Anything else we should know? <span className="font-normal text-[#8a858c]">(optional)</span></FieldLabel>
                      <textarea
                        value={form.notes}
                        onChange={(event) => updateForm("notes", event.target.value)}
                        rows={4}
                        placeholder="Delivery location, usage pattern, charging requirement, or other commercial context"
                        className="mt-2 w-full resize-y rounded-[12px] border border-[#dedce1] bg-white px-4 py-3 text-[14px] leading-6 outline-none placeholder:text-[#969198] focus:border-[#6a5294] focus:ring-2 focus:ring-[#6a5294]/10"
                      />
                    </label>

                    <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-[12px] bg-[#f7f6f8] p-4">
                      <input
                        type="checkbox"
                        checked={form.consent}
                        onChange={(event) => updateForm("consent", event.target.checked)}
                        className="mt-0.5 size-4 accent-[#351a75]"
                      />
                      <span className="text-[12px] leading-5 text-[#686368]">
                        I agree that BLive may contact me about this fleet enquiry and quotation.
                      </span>
                    </label>

                    {error && (
                      <p role="alert" className="mt-4 rounded-[11px] border border-[#f1c7c3] bg-[#fff5f4] px-4 py-3 text-[13px] font-medium text-[#9f2d25]">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={submitting || catalog === undefined}
                      className="mt-5 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#351a75] px-6 text-[15px] font-bold text-white transition hover:bg-[#2c155f] disabled:cursor-not-allowed disabled:bg-[#aaa4b2]"
                    >
                      {submitting ? "Submitting enquiry…" : "Submit fleet enquiry"}
                      {!submitting && <ArrowRight className="size-[18px]" aria-hidden="true" />}
                    </button>
                    <p className="mt-3 text-center text-[11px] text-[#8a858c]">
                      Submitting an enquiry does not create a booking or request payment.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>

        <section className="border-y border-[#ece9ee] bg-[#fbfafc] px-5 py-16 sm:px-8 md:py-24">
          <div className="mx-auto max-w-[1180px]">
            <div className="mx-auto max-w-[720px] text-center">
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#6a5294]">
                Built for real operations
              </p>
              <h2 className="mt-3 text-[32px] font-black tracking-[-0.035em] sm:text-[42px]">
                Tailored fleet solutions for every business need.
              </h2>
              <p className="mt-4 text-[15px] leading-6 text-[#716c75] sm:text-[16px]">
                Purpose-built fleet programmes for delivery, logistics, employee
                mobility, and field operations.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 lg:gap-6">
              {BUSINESS_USE_CASES.map((item) => (
                <article key={item.title} className="text-center">
                  <div className="mx-auto aspect-square w-full max-w-[190px] overflow-hidden rounded-full bg-white shadow-[0_14px_35px_rgba(35,29,39,0.12)]">
                    <img
                      src={item.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <h3 className="mx-auto mt-5 max-w-[190px] text-[14px] font-black leading-5 text-[#2d2930] sm:text-[15px]">
                    {item.title}
                  </h3>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#17131f] px-5 py-16 text-white sm:px-8 md:py-24">
          <div className="mx-auto max-w-[1180px]">
            <div className="mx-auto max-w-[700px] text-center">
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#c9b8f0]">
                Why BLive for Business
              </p>
              <h2 className="mt-3 text-[32px] font-black tracking-[-0.035em] sm:text-[42px]">
                One partner from quotation to deployment.
              </h2>
              <p className="mt-4 text-[15px] leading-6 text-white/62 sm:text-[16px]">
                Clear commercial terms, a connected onboarding journey, and
                operational support after your fleet goes live.
              </p>
            </div>

            <div className="mt-11 grid gap-4 md:grid-cols-3">
              {[
                [<Building2 key="models" className="size-5" aria-hidden="true" />, "Fleet choice that fits", "Request multiple models and quantities in the same enquiry."],
                [<BadgeIndianRupee key="pricing" className="size-5" aria-hidden="true" />, "One clear quotation", "Review vehicle pricing and commercial terms before KYB begins."],
                [<Clock3 key="support" className="size-5" aria-hidden="true" />, "Deployment support", "Coordinate vehicles, hub, and start dates through one connected flow."],
              ].map(([icon, title, copy]) => (
                <article key={title} className="rounded-[20px] border border-white/10 bg-white/[0.06] p-6">
                  <span className="flex size-11 items-center justify-center rounded-full bg-white text-[#351a75]">
                    {icon}
                  </span>
                  <h3 className="mt-7 text-[18px] font-black">{title}</h3>
                  <p className="mt-3 text-[14px] leading-6 text-white/58">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-16 sm:px-8 md:py-24">
          <div className="relative mx-auto min-h-[360px] max-w-[1180px] overflow-hidden rounded-[28px] bg-[#29252d] sm:min-h-[420px]">
            <img
              src="/images/business/fleet-cta.png"
              alt="Commercial vehicle fleet ready for deployment"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/20" />
            <div className="relative flex min-h-[360px] max-w-[600px] flex-col items-start justify-center px-7 py-12 text-white sm:min-h-[420px] sm:px-12">
              <h2 className="text-[34px] font-black leading-[1.08] tracking-[-0.04em] sm:text-[48px]">
                Ready to move your business forward?
              </h2>
              <p className="mt-4 max-w-[500px] text-[15px] leading-6 text-white/72 sm:text-[17px]">
                Share your fleet requirement and let our commercial team build a
                proposal around your operation.
              </p>
              <a
                href="#business-enquiry"
                className="mt-7 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[13px] bg-white px-6 text-[14px] font-bold text-[#261d30] transition hover:bg-[#f3eff8]"
              >
                Make an enquiry
                <ArrowRight className="size-[18px]" aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Business;
