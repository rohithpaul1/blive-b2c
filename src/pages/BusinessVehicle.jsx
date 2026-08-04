import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BatteryCharging,
  Bike,
  Building2,
  Check,
  Gauge,
  MapPin,
  Share2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Navbar from "../sections/Navbar";
import Footer from "../sections/Footer";

function BusinessVehicle() {
  const navigate = useNavigate();
  const { modelId = "" } = useParams();
  const catalog = useQuery("b2c/catalog:list", {});
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [modelId]);

  const vehicle = useMemo(() => {
    const rows = Array.isArray(catalog?.data) ? catalog.data : [];
    return rows.find((row) => {
      const name = row?.model?.modelName?.trim() || "";
      const id = String(row?.model?.id || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
      return id === modelId;
    });
  }, [catalog, modelId]);

  const model = vehicle?.model;
  const brand = vehicle?.brand;
  const plan = vehicle?.plan;
  const image =
    model?.imageUrl ||
    model?.images?.[0] ||
    brand?.brandLogo ||
    "/images/vehicle-models/electric-scooter-generic.jpg";
  const dailyRate = Number(plan?.enterDailyPlanPrice || 0);
  const stableId = String(model?.id || modelId);

  const shareVehicle = async () => {
    const shareData = {
      title: `${model?.modelName || "Vehicle"} for business rental`,
      text: `View ${model?.modelName || "this vehicle"} for a BLive business fleet.`,
      url: window.location.href,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(window.location.href);
        setShareMessage("Link copied");
        window.setTimeout(() => setShareMessage(""), 2200);
      }
    } catch (error) {
      if (error?.name !== "AbortError") setShareMessage("Could not share this link");
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#262326]">
      <Navbar />
      <main className="pt-[72px]">
        {catalog === undefined ? (
          <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 md:py-24">
            <div className="h-[620px] animate-pulse rounded-[28px] bg-[#f3f2f4]" />
          </div>
        ) : !vehicle ? (
          <section className="mx-auto flex min-h-[620px] max-w-[720px] flex-col items-center justify-center px-5 text-center">
            <Bike className="size-10 text-[#9a959d]" aria-hidden="true" />
            <h1 className="mt-5 text-[30px] font-black tracking-[-0.035em]">Vehicle model unavailable</h1>
            <p className="mt-3 text-[14px] leading-6 text-[#716c75]">
              This model may have been removed from the current business catalogue.
            </p>
            <Link to="/business#business-fleet-builder" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#252127] px-6 text-[14px] font-black text-white">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Browse business vehicles
            </Link>
          </section>
        ) : (
          <>
            <section className="bg-[#f6f6f6] px-5 py-8 sm:px-8 md:py-12">
              <div className="mx-auto max-w-[1180px]">
                <div className="flex items-center justify-between gap-4">
                  <Link to="/business#business-fleet-builder" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-[13px] font-bold text-[#4e4950] shadow-sm">
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Business vehicles
                  </Link>
                  <button
                    type="button"
                    onClick={shareVehicle}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#dcd9de] bg-white px-4 text-[13px] font-bold"
                  >
                    <Share2 className="size-4" aria-hidden="true" />
                    {shareMessage || "Share model"}
                  </button>
                </div>

                <div className="mt-6 grid overflow-hidden rounded-[28px] border border-[#e1dfe2] bg-white shadow-[0_18px_55px_rgba(35,29,39,0.08)] lg:grid-cols-[minmax(0,1.08fr)_minmax(430px,0.92fr)]">
                  <div className="flex min-h-[390px] items-center justify-center bg-[#f8f8f8] p-8 sm:min-h-[520px] sm:p-14">
                    <img src={image} alt={model.modelName} className="max-h-[430px] w-full object-contain" />
                  </div>
                  <div className="flex flex-col p-6 sm:p-9 lg:p-11">
                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f1edf6] px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] text-[#5b3b78]">
                      <Building2 className="size-3.5" aria-hidden="true" />
                      Business fleet model
                    </span>
                    <p className="mt-7 text-[12px] font-bold uppercase tracking-[0.1em] text-[#89838b]">
                      {brand?.name || model.manufacturer || "BLive catalogue"}
                    </p>
                    <h1 className="mt-2 text-[38px] font-black leading-[1.04] tracking-[-0.045em] sm:text-[50px]">
                      {model.modelName}
                    </h1>
                    <p className="mt-5 text-[15px] leading-7 text-[#716c75]">
                      Build this model into a multi-vehicle business rental. Final
                      availability and commercial pricing are confirmed in your quotation.
                    </p>

                    <div className="mt-7 rounded-[18px] border border-[#e6e3e7] bg-[#fbfafc] p-5">
                      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#89838b]">Indicative business rate</p>
                      <p className="mt-2 text-[28px] font-black tracking-[-0.03em]">
                        {dailyRate > 0 ? `₹${dailyRate.toLocaleString("en-IN")}` : "Quoted for your fleet"}
                        {dailyRate > 0 && <span className="ml-1 text-[13px] font-bold text-[#777179]">/ day</span>}
                      </p>
                      <p className="mt-2 text-[11px] leading-5 text-[#89838b]">
                        Your final rate depends on fleet quantity, city, rental duration, and deployment plan.
                      </p>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="rounded-[14px] border border-[#e6e3e7] p-4">
                        <MapPin className="size-4 text-[#65526f]" aria-hidden="true" />
                        <p className="mt-3 text-[11px] text-[#888189]">Catalogue availability</p>
                        <p className="mt-1 text-[14px] font-black">{Number(vehicle.availableVehiclesCount || 0)} vehicles</p>
                      </div>
                      <div className="rounded-[14px] border border-[#e6e3e7] p-4">
                        <Zap className="size-4 text-[#65526f]" aria-hidden="true" />
                        <p className="mt-3 text-[11px] text-[#888189]">Powertrain</p>
                        <p className="mt-1 text-[14px] font-black">
                          {["ev", "electric"].includes(String(model.engineType || "").toLowerCase())
                            ? "Electric"
                            : String(model.engineType || "Powertrain on request").replace(/\b\w/g, (value) => value.toUpperCase())}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(`/business?model=${encodeURIComponent(stableId)}#business-fleet-builder`)}
                      className="mt-7 inline-flex min-h-[54px] items-center justify-center gap-2 rounded-full bg-[#252127] px-6 text-[14px] font-black text-white transition hover:bg-black"
                    >
                      Add to fleet enquiry
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="px-5 py-16 sm:px-8 md:py-24">
              <div className="mx-auto max-w-[1180px]">
                <div className="max-w-[680px]">
                  <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#6a5294]">Fleet-ready details</p>
                  <h2 className="mt-3 text-[32px] font-black tracking-[-0.035em] sm:text-[42px]">Useful context before you enquire.</h2>
                </div>
                <div className="mt-9 grid gap-4 md:grid-cols-3">
                  {[
                    [<Gauge key="range" className="size-5" aria-hidden="true" />, "Operating range", model.range ? `${model.range} km` : "Confirmed by model year", "Use the model range to plan routes and charging cycles."],
                    [<BatteryCharging key="charge" className="size-5" aria-hidden="true" />, "Charging time", model.batteryChargingTime ? `${model.batteryChargingTime} hours` : "Shared in quotation", "Charging requirements can be included in deployment planning."],
                    [<ShieldCheck key="support" className="size-5" aria-hidden="true" />, "Business support", "Connected operations", "Quotation, KYB, deployment, rentals, and support remain linked."],
                  ].map(([icon, title, value, copy]) => (
                    <article key={title} className="rounded-[20px] border border-[#e4e1e5] bg-white p-6">
                      <span className="flex size-11 items-center justify-center rounded-full bg-[#f2eef6] text-[#5b3b78]">{icon}</span>
                      <p className="mt-6 text-[12px] font-bold text-[#837d85]">{title}</p>
                      <h3 className="mt-2 text-[19px] font-black">{value}</h3>
                      <p className="mt-3 text-[13px] leading-6 text-[#716c75]">{copy}</p>
                    </article>
                  ))}
                </div>

                <div className="mt-10 rounded-[24px] bg-[#17131f] p-6 text-white sm:p-9">
                  <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div>
                      <h2 className="text-[26px] font-black tracking-[-0.03em]">Add {model.modelName} to your business fleet.</h2>
                      <div className="mt-5 grid gap-3 text-[13px] text-white/72 sm:grid-cols-3">
                        {["Select any fleet quantity", "Combine multiple models", "Receive one tailored quotation"].map((item) => (
                          <span key={item} className="flex items-center gap-2"><Check className="size-4 text-[#c3adee]" aria-hidden="true" />{item}</span>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/business?model=${encodeURIComponent(stableId)}#business-fleet-builder`)}
                      className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-white px-6 text-[14px] font-black text-[#241b2b]"
                    >
                      Start enquiry
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default BusinessVehicle;
