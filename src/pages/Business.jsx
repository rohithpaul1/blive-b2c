import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import Cards from "../components/Cards";
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
  const [searchParams] = useSearchParams();
  const catalog = useQuery("b2c/catalog:list", {});
  const createEnquiry = useMutation("enquiries:createEnquiry");
  const submissionReference = useRef(null);
  const preselectedModelReference = useRef(null);

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
  const [lines, setLines] = useState([]);
  const [modelQuery, setModelQuery] = useState("");
  const [evOnly, setEvOnly] = useState(false);
  const [modelPage, setModelPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(null);
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);

  const models = useMemo(() => {
    const rows = Array.isArray(catalog?.data) ? catalog.data : [];
    const unique = new Map();
    rows.forEach((row) => {
      const name = row?.model?.modelName?.trim();
      if (!name || unique.has(name)) return;
      unique.set(name, {
        id: String(row?.model?.id || name.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
        name,
        brandName: row?.brand?.name || row?.model?.manufacturer || "BLive fleet",
        image:
          row?.model?.imageUrl ||
          row?.model?.images?.[0] ||
          row?.brand?.brandLogo ||
          "/images/vehicle-models/electric-scooter-generic.jpg",
        available: Number(row?.availableVehiclesCount || 0),
        dailyRate: Number(row?.plan?.enterDailyPlanPrice || 0),
        engineType: String(row?.model?.engineType || "ev").toLowerCase(),
        range: Number(row?.model?.range || row?.model?.perDayKmLimit || 0),
        topSpeed: Number(row?.model?.speed || row?.model?.topSpeed || 0),
        chargeTime: Number(row?.model?.batteryChargingTime || 0),
        perDayKmLimit: Number(row?.model?.perDayKmLimit || 0),
      });
    });
    return [...unique.values()];
  }, [catalog]);

  const filteredModels = useMemo(() => {
    const query = modelQuery.trim().toLowerCase();
    return models.filter((model) => {
      const matchesQuery =
        !query ||
        model.name.toLowerCase().includes(query) ||
        model.brandName.toLowerCase().includes(query);
      const matchesEngine = !evOnly || model.engineType === "ev" || model.engineType === "electric";
      return matchesQuery && matchesEngine;
    });
  }, [evOnly, modelQuery, models]);

  const modelPageSize = 6;
  const modelPageCount = Math.max(1, Math.ceil(filteredModels.length / modelPageSize));
  const visibleModels = filteredModels.slice(
    (modelPage - 1) * modelPageSize,
    modelPage * modelPageSize
  );
  const selectedVehicleCount = lines.reduce(
    (total, line) => total + Number(line.quantity || 0),
    0
  );

  const visibleBusinessCards = useMemo(
    () =>
      visibleModels.map((model) => ({
        id: model.id,
        vehicleName: model.name,
        manufacturer: model.brandName,
        brandName: model.brandName,
        imgUrl: model.image,
        price: model.dailyRate,
        range: model.range,
        topSpeed: model.topSpeed,
        chargeTime: model.chargeTime,
        perDayKmLimit: model.perDayKmLimit,
        engineType: model.engineType,
        isAvailable: true,
        availableCount: model.available,
        nextAvailableDate: model.available > 0 ? "Available now" : "On request",
      })),
    [visibleModels]
  );

  useEffect(() => {
    setModelPage(1);
  }, [evOnly, modelQuery]);

  useEffect(() => {
    if (modelPage > modelPageCount) setModelPage(modelPageCount);
  }, [modelPage, modelPageCount]);

  useEffect(() => {
    if (!isEnquiryOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !submitting) setIsEnquiryOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isEnquiryOpen, submitting]);

  useEffect(() => {
    const requestedModelId = searchParams.get("model");
    if (
      !requestedModelId ||
      models.length === 0 ||
      preselectedModelReference.current === requestedModelId
    ) return;
    const requestedModel = models.find((model) => model.id === requestedModelId);
    if (!requestedModel) return;
    preselectedModelReference.current = requestedModelId;
    setLines((current) =>
      current.some((line) => line.modelName === requestedModel.name)
        ? current
        : [...current, { modelName: requestedModel.name, quantity: 10 }]
    );
    requestAnimationFrame(() => {
      document.getElementById("business-fleet-builder")?.scrollIntoView({ block: "start" });
    });
  }, [models, searchParams]);

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const selectModel = (modelName) => {
    setLines((current) =>
      current.some((line) => line.modelName === modelName)
        ? current
        : [...current, { modelName, quantity: 10 }]
    );
    setError("");
  };

  const changeModelQuantity = (modelName, amount) => {
    setLines((current) =>
      current.map((line) =>
        line.modelName === modelName
          ? { ...line, quantity: Math.max(1, Math.min(5000, Number(line.quantity || 1) + amount)) }
          : line
      )
    );
    setError("");
  };

  const removeModel = (modelName) => {
    setLines((current) => current.filter((line) => line.modelName !== modelName));
    setError("");
  };

  const openEnquiry = () => {
    if (lines.length === 0) {
      document.getElementById("business-fleet-builder")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }
    setError("");
    setIsEnquiryOpen(true);
  };

  const editFleet = () => {
    setIsEnquiryOpen(false);
    requestAnimationFrame(() => {
      document.getElementById("business-fleet-builder")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const validate = () => {
    if (!form.companyName.trim()) return "Enter your company name.";
    if (!form.contactName.trim()) return "Enter a contact person.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      return "Enter a valid work email address.";
    }
    if (!form.phone.trim()) return "Enter a contact number.";
    if (!form.rentalStartDate) return "Choose an expected start date.";
    if (lines.length === 0) return "Choose at least one vehicle model for your fleet.";
    if (lines.some((line) => Number(line.quantity) < 1)) return "Enter a valid quantity for every selected model.";
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
          <div className="relative mx-auto grid max-w-[1280px] items-center gap-8 px-5 py-12 sm:px-8 md:min-h-[440px] md:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)] md:px-12 md:py-14 lg:px-16">
            <div className="max-w-[650px]">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[12px] font-bold text-white/85">
                <Building2 className="size-4" aria-hidden="true" />
                BLive for Business
              </span>
              <h1 className="mt-6 text-[40px] font-black leading-[1.02] tracking-[-0.045em] sm:text-[52px] md:text-[58px]">
                Choose vehicles
                <span className="block text-[#c9b8f0]">for your business.</span>
              </h1>
              <p className="mt-5 max-w-[560px] text-[16px] leading-7 text-white/68 sm:text-[18px]">
                Select the vehicle models and quantities you need. We will review
                availability and return with one tailored quotation.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#business-fleet-builder"
                  className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-[14px] bg-white px-6 text-[15px] font-bold text-[#24183d] transition hover:bg-[#f4f0fc]"
                >
                  Choose vehicles
                  <ArrowRight className="size-[18px]" aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="relative mx-auto h-[280px] w-full max-w-[460px] sm:h-[330px]">
              <div className="absolute left-0 top-4 w-[70%] overflow-hidden rounded-[26px] border border-white/10 bg-white/10 p-3 shadow-2xl backdrop-blur">
                <img
                  src="/images/vehicle-models/ather-450x-electric.jpg"
                  alt="Ather electric scooter for a business fleet"
                  className="h-[165px] w-full rounded-[18px] object-cover sm:h-[205px]"
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
                  className="h-[110px] w-full rounded-[16px] object-cover sm:h-[135px]"
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
                <span className="mt-1 block text-[16px] font-black">Select → Enquire</span>
              </div>
            </div>
          </div>
        </section>

        <section id="business-fleet-builder" className="scroll-mt-[72px] bg-[#f6f6f6] px-5 py-14 sm:px-8 md:py-20">
          <div className="mx-auto max-w-[1180px]">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#6a5294]">
                  Business vehicle catalogue
                </p>
                <h2 className="mt-3 text-[34px] font-black tracking-[-0.04em] sm:text-[44px]">
                  Vehicles for your business.
                </h2>
                <p className="mt-3 max-w-[650px] text-[15px] leading-6 text-[#716c75]">
                  Select one or more models, set the number of vehicles, and then
                  share your business details for a tailored quotation.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative block min-w-0 sm:w-[280px]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-[17px] -translate-y-1/2 text-[#777179]" aria-hidden="true" />
                  <input
                    type="search"
                    value={modelQuery}
                    onChange={(event) => setModelQuery(event.target.value)}
                    placeholder="Search vehicle models"
                    aria-label="Search business vehicle models"
                    className="h-12 w-full rounded-full border border-[#dedce1] bg-white pl-11 pr-4 text-[14px] outline-none transition focus:border-[#252127]"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setEvOnly((current) => !current)}
                  aria-pressed={evOnly}
                  className={`inline-flex h-12 items-center justify-center gap-2 rounded-full border px-5 text-[13px] font-bold transition ${
                    evOnly
                      ? "border-[#252127] bg-[#252127] text-white"
                      : "border-[#dedce1] bg-white text-[#4d484f] hover:border-[#aaa5ac]"
                  }`}
                >
                  <Zap className="size-4" aria-hidden="true" />
                  EV only
                </button>
              </div>
            </div>

            <div className="mt-9 overflow-hidden rounded-[24px] border border-[#e2e0e3] bg-white shadow-[0_12px_35px_rgba(34,29,38,0.06)]">
              <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3 lg:gap-6">
                {catalog === undefined &&
                  Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-[320px] animate-pulse rounded-[18px] bg-[#f2f1f3]" />
                  ))}

                {catalog !== undefined && visibleModels.length === 0 && (
                  <div className="col-span-full flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
                    <Search className="size-7 text-[#9a959d]" aria-hidden="true" />
                    <h3 className="mt-4 text-[17px] font-black">No matching models</h3>
                    <p className="mt-2 text-[13px] text-[#777179]">Try another model name or turn off the EV filter.</p>
                  </div>
                )}

                {catalog !== undefined && visibleBusinessCards.length > 0 && (
                  <Cards
                    cards={visibleBusinessCards}
                    variant="business"
                    selectedPlanType="daily"
                    getSelectedQuantity={(card) =>
                      lines.find((line) => line.modelName === card.vehicleName)?.quantity || 0
                    }
                    onSelect={(card) => selectModel(card.vehicleName)}
                    onIncrease={(card) => changeModelQuantity(card.vehicleName, 1)}
                    onDecrease={(card) => changeModelQuantity(card.vehicleName, -1)}
                    onRemove={(card) => removeModel(card.vehicleName)}
                    getDetailsPath={(card) =>
                      `/business/vehicles/${encodeURIComponent(card.id)}`
                    }
                  />
                )}
              </div>

              <div className="flex flex-col gap-4 border-t border-[#e7e4e8] px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[18px] font-black">Your fleet ({lines.length})</p>
                  <p className="mt-1 text-[12px] text-[#777179]">
                    {selectedVehicleCount > 0
                      ? `${selectedVehicleCount} vehicles selected across ${lines.length} ${lines.length === 1 ? "model" : "models"}`
                      : "Choose a model to start your business enquiry"}
                  </p>
                </div>

                {modelPageCount > 1 && (
                  <div className="flex items-center justify-center gap-2" aria-label="Vehicle catalogue pages">
                    <button
                      type="button"
                      onClick={() => setModelPage((current) => Math.max(1, current - 1))}
                      disabled={modelPage === 1}
                      className="flex size-9 items-center justify-center rounded-full border border-[#e2dfe4] disabled:opacity-35"
                      aria-label="Previous vehicle models"
                    >
                      <ChevronLeft className="size-4" aria-hidden="true" />
                    </button>
                    <span className="min-w-16 text-center text-[12px] font-bold text-[#625d65]">
                      {modelPage} of {modelPageCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setModelPage((current) => Math.min(modelPageCount, current + 1))}
                      disabled={modelPage === modelPageCount}
                      className="flex size-9 items-center justify-center rounded-full border border-[#e2dfe4] disabled:opacity-35"
                      aria-label="Next vehicle models"
                    >
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  disabled={lines.length === 0}
                  onClick={openEnquiry}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#252127] px-6 text-[14px] font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-[#aaa6ac]"
                >
                  Continue enquiry
                  <ArrowRight className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {isEnquiryOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-[#17131f]/60 p-0 backdrop-blur-[3px] sm:items-center sm:p-5"
            onMouseDown={() => !submitting && setIsEnquiryOpen(false)}
          >
            <section
              id="business-enquiry"
              role="dialog"
              aria-modal="true"
              aria-labelledby="business-enquiry-title"
              className="relative max-h-[94dvh] w-full max-w-[960px] overflow-y-auto rounded-t-[26px] bg-white shadow-[0_28px_90px_rgba(20,14,27,0.30)] sm:max-h-[90dvh] sm:rounded-[26px]"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e7e4e8] bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.11em] text-[#6a5294]">Fleet enquiry</p>
                  <h2 id="business-enquiry-title" className="mt-1 text-[20px] font-black sm:text-[23px]">
                    Tell us what your business needs
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => !submitting && setIsEnquiryOpen(false)}
                  aria-label="Close fleet enquiry"
                  className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#dedbe0] bg-white text-[#474149] hover:bg-[#f6f5f7]"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>

              <div className="px-5 py-6 sm:px-7 sm:py-7">
            <div className="max-w-[720px]">
              <p className="text-[14px] leading-6 text-[#716c75]">
                This goes directly to the BLive commercial team. We will review
                availability and send a quotation before asking for KYB documents.
              </p>
              <div className="mt-5 grid gap-3 rounded-[18px] bg-[#f7f6f8] p-4 sm:grid-cols-3">
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

            <div className="mt-6 overflow-hidden rounded-[22px] border border-[#e0dde3] bg-white">
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

                    <div className="mt-7 rounded-[18px] border border-[#e1dee4] bg-[#fbfafc] p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <FieldLabel>Selected fleet</FieldLabel>
                          <p className="mt-1 text-[12px] text-[#777179]">
                            {selectedVehicleCount} vehicles across {lines.length} {lines.length === 1 ? "model" : "models"}.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={editFleet}
                          className="shrink-0 rounded-full border border-[#d8d4da] bg-white px-4 py-2 text-[12px] font-bold text-[#423d44]"
                        >
                          Edit fleet
                        </button>
                      </div>

                      {lines.length === 0 ? (
                        <div className="mt-4 rounded-[14px] border border-dashed border-[#d6d2d9] bg-white px-4 py-6 text-center">
                          <p className="text-[13px] font-bold">No vehicles selected yet</p>
                          <button
                            type="button"
                            onClick={editFleet}
                            className="mt-3 text-[12px] font-black text-[#5b3b8e]"
                          >
                            Choose vehicle models
                          </button>
                        </div>
                      ) : (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {lines.map((line) => {
                            const selectedModel = models.find((model) => model.name === line.modelName);
                            return (
                              <div key={line.modelName} className="flex items-center gap-3 rounded-[14px] border border-[#e3e0e5] bg-white p-3">
                                <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[11px] bg-[#f4f3f5] p-1">
                                  <img src={selectedModel?.image || "/images/vehicle-models/electric-scooter-generic.jpg"} alt="" className="h-full w-full object-contain" />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-[13px] font-black">{line.modelName}</p>
                                  <p className="mt-1 text-[11px] text-[#777179]">{line.quantity} vehicles</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeModel(line.modelName)}
                                  aria-label={`Remove ${line.modelName} from fleet`}
                                  className="flex size-9 shrink-0 items-center justify-center rounded-[9px] text-[#9a4540] hover:bg-[#fff1f0]"
                                >
                                  <Trash2 className="size-4" aria-hidden="true" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
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
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}

export default Business;
