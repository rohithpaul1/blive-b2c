import { createElement, useEffect, useMemo, useState } from "react";
import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Bike,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Download,
  FileCheck2,
  FileText,
  Headphones,
  IndianRupee,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MapPinned,
  MapPin,
  Menu,
  Plus,
  RefreshCcw,
  ReceiptText,
  Send,
  ShieldCheck,
  TicketCheck,
  UserCog,
  UserRound,
  WifiOff,
  X,
} from "lucide-react";

const NAVIGATION = [
  { id: "home", label: "Overview", icon: LayoutDashboard },
  { id: "fleet", label: "Live fleet", icon: MapPinned },
  { id: "bookings", label: "Rentals", icon: CalendarDays },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "support", label: "Support", icon: LifeBuoy },
  { id: "account", label: "Account", icon: UserCog },
];

const SUPPORT_CATEGORIES = [
  "Vehicle breakdown",
  "Service support",
  "Billing question",
  "Accident",
  "Theft",
  "General support",
];

const REQUEST_CITIES = [
  "Bengaluru, Karnataka",
  "Hyderabad, Telangana",
  "Mumbai, Maharashtra",
  "Pune, Maharashtra",
  "Chennai, Tamil Nadu",
  "Delhi NCR",
  "Other",
];

const inputClass =
  "mt-2 h-11 w-full rounded-[10px] border border-[#dedbe1] bg-white px-3.5 text-[14px] text-[#29252d] outline-none transition placeholder:text-[#9b969e] focus:border-[#70549b] focus:ring-2 focus:ring-[#70549b]/10";

function normalise(value) {
  return String(value ?? "").trim().toLowerCase().replaceAll("_", " ");
}

function titleCase(value) {
  return normalise(value)
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0) / 100);
}

function relativeTime(value) {
  if (!value) return "Location time unavailable";
  const minutes = Math.max(0, Math.round((Date.now() - Number(value)) / 60000));
  if (minutes < 2) return "Updated just now";
  if (minutes < 60) return `Updated ${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Updated ${hours} hr ago`;
  return `Updated ${Math.round(hours / 24)} days ago`;
}

function statusTone(status) {
  const value = normalise(status);
  if (["active", "paid", "approved", "resolved", "delivered", "rental active"].includes(value)) {
    return "border-[#b9e5cd] bg-[#effaf4] text-[#25734a]";
  }
  if (["overdue", "critical", "cancelled", "rejected", "closed", "needs attention"].includes(value)) {
    return "border-[#f0c4c0] bg-[#fff4f3] text-[#a43a32]";
  }
  if (["upcoming", "planning", "issued", "waiting", "pending", "new", "request received", "quotation sent"].includes(value)) {
    return "border-[#ead7a8] bg-[#fffaf0] text-[#8a651d]";
  }
  return "border-[#ddd5ea] bg-[#f7f4fb] text-[#62498a]";
}

function StatusBadge({ value }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusTone(value)}`}>
      {titleCase(value || "Pending")}
    </span>
  );
}

function EmptyState({ icon: Icon = FileText, title, description, action }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[18px] border border-dashed border-[#dcd7df] bg-[#faf9fb] px-6 text-center">
      <span className="flex size-11 items-center justify-center rounded-[13px] bg-white text-[#68537e] shadow-sm">
        {createElement(Icon, { className: "size-5" })}
      </span>
      <h3 className="mt-4 text-[15px] font-extrabold">{title}</h3>
      <p className="mt-2 max-w-[420px] text-[12px] leading-5 text-[#77717a]">{description}</p>
      {action}
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="h-[92px] animate-pulse rounded-[16px] bg-[#efedf1]" />
      ))}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, detail, tone = "neutral" }) {
  const tones = {
    neutral: "bg-[#f5f3f6] text-[#584f5e]",
    purple: "bg-[#f0ecf7] text-[#5f3e88]",
    green: "bg-[#edf8f2] text-[#28754c]",
    amber: "bg-[#fff7e7] text-[#946b18]",
  };
  return (
    <div className="min-w-0 rounded-[17px] border border-[#e5e2e7] bg-white p-4 sm:p-5">
      <span className={`flex size-9 items-center justify-center rounded-[11px] ${tones[tone]}`}>
        {createElement(Icon, { className: "size-[18px]" })}
      </span>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.08em] text-[#7a747d]">{label}</p>
      <p className="mt-1 text-[26px] font-black tracking-[-0.04em] text-[#29252d]">{value}</p>
      <p className="mt-1 truncate text-[11px] text-[#8b858e]">{detail}</p>
    </div>
  );
}

function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#745a96]">{eyebrow}</p>}
        <h2 className="mt-1 text-[22px] font-black tracking-[-0.035em] text-[#29252d] sm:text-[26px]">{title}</h2>
        {description && <p className="mt-2 text-[13px] leading-5 text-[#77717a]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function HomeView({ overview, onNavigate, onRequest }) {
  if (!overview) return <LoadingPanel />;
  const counts = overview.counts ?? {};
  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-[22px] bg-[#211a2a] text-white shadow-[0_18px_48px_rgba(28,20,37,.12)]">
        <div className="relative grid gap-7 px-6 py-7 sm:px-8 sm:py-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="absolute right-[-90px] top-[-100px] size-[320px] rounded-full bg-[#8362af]/20 blur-2xl" />
          <div className="relative">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#c8b5df]">Company workspace</p>
            <h1 className="mt-2 text-[30px] font-black tracking-[-0.045em] sm:text-[38px]">
              Welcome, {overview.client.companyName}
            </h1>
            <p className="mt-3 max-w-[590px] text-[13px] leading-6 text-white/62">
              Your rentals, fleet records, documents, and support requests are connected here.
            </p>
          </div>
          <button
            type="button"
            onClick={onRequest}
            className="relative inline-flex min-h-11 items-center justify-center gap-2 rounded-[11px] bg-white px-5 text-[13px] font-extrabold text-[#2e1e41] transition hover:bg-[#f4f0f8]"
          >
            <Plus className="size-4" /> Request vehicles
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard icon={Bike} label="Vehicles on rent" value={counts.vehiclesOnRent ?? 0} detail="Currently allocated" tone="purple" />
        <MetricCard icon={CalendarDays} label="Active rentals" value={counts.activeRentals ?? 0} detail={`${counts.upcomingRentals ?? 0} upcoming`} tone="green" />
        <MetricCard icon={FileCheck2} label="Active contracts" value={counts.contracts ?? 0} detail="Commercial agreements" />
        <MetricCard icon={TicketCheck} label="Open support" value={counts.openTickets ?? 0} detail="Requests in progress" tone={counts.openTickets ? "amber" : "neutral"} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,.75fr)]">
        <section className="rounded-[20px] border border-[#e4e1e6] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[16px] font-extrabold">Recent bookings</h2>
              <p className="mt-1 text-[11px] text-[#817b84]">The latest rental activity for your company</p>
            </div>
            <button type="button" onClick={() => onNavigate("bookings")} className="flex items-center gap-1 text-[12px] font-bold text-[#5d407d]">
              View all <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="mt-5 space-y-2">
            {overview.recentBookings?.length ? overview.recentBookings.map((booking) => (
              <button
                type="button"
                key={booking.id}
                onClick={() => onNavigate("bookings")}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-[13px] border border-[#ece9ee] px-4 py-3 text-left transition hover:border-[#cfc6d8] hover:bg-[#fbfafc] sm:grid-cols-[minmax(0,1fr)_130px_120px_auto]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-extrabold">{booking.number}</span>
                  <span className="mt-1 block truncate text-[11px] text-[#827c85]">{booking.hub?.name ?? "Hub to be confirmed"}</span>
                </span>
                <span className="hidden text-[12px] font-bold sm:block">{booking.allocatedCount} / {booking.committedCount} vehicles</span>
                <span className="hidden text-[11px] text-[#767078] sm:block">{formatDate(booking.periodStart)}</span>
                <StatusBadge value={booking.status} />
              </button>
            )) : (
              <EmptyState icon={CalendarDays} title="No bookings yet" description="Accepted fleet requests will appear here when operations creates a booking." />
            )}
          </div>
        </section>

        <aside className="rounded-[20px] border border-[#e4e1e6] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-extrabold">Needs attention</h2>
            {overview.attention?.length > 0 && <span className="flex size-7 items-center justify-center rounded-full bg-[#fff2df] text-[11px] font-black text-[#9a6517]">{overview.attention.length}</span>}
          </div>
          <div className="mt-5 space-y-2.5">
            {overview.attention?.length ? overview.attention.map((item) => (
              <button
                type="button"
                key={`${item.type}-${item.label}`}
                onClick={() => onNavigate(item.destination)}
                className="flex w-full items-center gap-3 rounded-[13px] border border-[#ebe7ee] p-3 text-left transition hover:bg-[#faf8fc]"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#fff7e8] text-[#93691c]">
                  <AlertCircle className="size-[17px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-extrabold">{item.label}</span>
                  <span className="mt-0.5 block text-[10px] text-[#867f88]">{item.count} record{item.count === 1 ? "" : "s"}</span>
                </span>
                <ChevronRight className="size-4 text-[#908993]" />
              </button>
            )) : (
              <div className="rounded-[14px] bg-[#f1f8f4] p-4 text-center">
                <CheckCircle2 className="mx-auto size-6 text-[#2d7a50]" />
                <p className="mt-2 text-[12px] font-extrabold text-[#286746]">Nothing needs attention</p>
                <p className="mt-1 text-[10px] leading-4 text-[#6a8072]">Your active records are up to date.</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function FleetMap({ vehicles }) {
  const liveVehicles = useMemo(
    () =>
      (vehicles ?? []).filter(
        (vehicle) =>
          vehicle.location &&
          Number.isFinite(vehicle.location.latitude) &&
          Number.isFinite(vehicle.location.longitude)
      ),
    [vehicles]
  );
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!liveVehicles.length) {
      setSelectedId(null);
      return;
    }
    if (!liveVehicles.some((vehicle) => vehicle.id === selectedId)) {
      setSelectedId(liveVehicles[0].id);
    }
  }, [liveVehicles, selectedId]);

  const map = useMemo(() => {
    if (!liveVehicles.length) return null;
    const latitudes = liveVehicles.map((vehicle) => vehicle.location.latitude);
    const longitudes = liveVehicles.map((vehicle) => vehicle.location.longitude);
    const rawMinLat = Math.min(...latitudes);
    const rawMaxLat = Math.max(...latitudes);
    const rawMinLon = Math.min(...longitudes);
    const rawMaxLon = Math.max(...longitudes);
    const latPadding = Math.max(0.018, (rawMaxLat - rawMinLat) * 0.22);
    const lonPadding = Math.max(0.018, (rawMaxLon - rawMinLon) * 0.22);
    const minLat = rawMinLat - latPadding;
    const maxLat = rawMaxLat + latPadding;
    const minLon = rawMinLon - lonPadding;
    const maxLon = rawMaxLon + lonPadding;
    return {
      minLat,
      maxLat,
      minLon,
      maxLon,
      url: `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik`,
    };
  }, [liveVehicles]);

  if (!map) {
    return (
      <EmptyState
        icon={WifiOff}
        title="No live locations yet"
        description="Allocated vehicles will appear on this map as soon as their tracking device sends a location."
      />
    );
  }

  const selected =
    liveVehicles.find((vehicle) => vehicle.id === selectedId) ?? liveVehicles[0];

  return (
    <section className="overflow-hidden rounded-[20px] border border-[#dfdce2] bg-white">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_310px]">
        <div className="relative min-h-[390px] overflow-hidden bg-[#e9edf0]">
          <iframe
            title="Live business fleet map"
            src={map.url}
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
            tabIndex={-1}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1f1927]/10 to-transparent" />
          {liveVehicles.map((vehicle, index) => {
            const left =
              ((vehicle.location.longitude - map.minLon) /
                (map.maxLon - map.minLon)) *
              100;
            const top =
              ((map.maxLat - vehicle.location.latitude) /
                (map.maxLat - map.minLat)) *
              100;
            const selectedMarker = vehicle.id === selected.id;
            return (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => setSelectedId(vehicle.id)}
                aria-label={`Show ${vehicle.registrationNo} on the fleet map`}
                className={`absolute z-10 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white text-[11px] font-black shadow-[0_5px_16px_rgba(30,24,35,.28)] transition ${
                  selectedMarker
                    ? "scale-110 bg-[#352044] text-white"
                    : vehicle.location.needsAttention
                      ? "bg-[#d85b4f] text-white"
                      : "bg-white text-[#352044]"
                }`}
                style={{ left: `${left}%`, top: `${top}%` }}
              >
                {index + 1}
              </button>
            );
          })}
          <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold text-[#625c65] shadow-sm">
            {liveVehicles.length} live location{liveVehicles.length === 1 ? "" : "s"}
          </span>
        </div>

        <aside className="border-t border-[#e6e2e8] p-5 lg:border-l lg:border-t-0 lg:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#7b668b]">Selected vehicle</p>
              <h3 className="mt-2 text-[18px] font-black">{selected.modelName}</h3>
              <p className="mt-1 font-mono text-[11px] text-[#79737c]">{selected.registrationNo}</p>
            </div>
            <StatusBadge value={selected.location.needsAttention ? "Needs attention" : "Active"} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <div className="rounded-[12px] bg-[#f6f4f7] p-3">
              <p className="text-[9px] font-bold uppercase tracking-[.08em] text-[#8c858e]">Charge</p>
              <p className="mt-1 text-[14px] font-black">{selected.location.soc == null ? "—" : `${Math.round(selected.location.soc)}%`}</p>
            </div>
            <div className="rounded-[12px] bg-[#f6f4f7] p-3">
              <p className="text-[9px] font-bold uppercase tracking-[.08em] text-[#8c858e]">Speed</p>
              <p className="mt-1 text-[14px] font-black">{Math.round(selected.location.speed ?? 0)} km/h</p>
            </div>
          </div>
          <div className="mt-5 space-y-4 text-[11px]">
            <div>
              <p className="font-extrabold text-[#4f4952]">Allocated rider</p>
              <p className="mt-1 text-[#817b84]">{selected.rider?.name ?? "Not assigned"}</p>
            </div>
            <div>
              <p className="font-extrabold text-[#4f4952]">Last update</p>
              <p className="mt-1 text-[#817b84]">{relativeTime(selected.location.updatedAtMs)}</p>
            </div>
            <div>
              <p className="font-extrabold text-[#4f4952]">Rental</p>
              <p className="mt-1 text-[#817b84]">{selected.bookingNumber}</p>
            </div>
          </div>
          <a
            href={`https://www.google.com/maps?q=${selected.location.latitude},${selected.location.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-[#d8d3db] text-[11px] font-extrabold text-[#513970]"
          >
            Open exact location <ArrowRight className="size-3.5" />
          </a>
        </aside>
      </div>
    </section>
  );
}

function FleetView({ fleet }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = useMemo(() => {
    if (!fleet) return [];
    const term = query.trim().toLowerCase();
    return fleet.filter((vehicle) => {
      const hasLocation = vehicle.location && Number.isFinite(vehicle.location.latitude) && Number.isFinite(vehicle.location.longitude);
      const matchesStatus = status === "all" || (status === "attention" && vehicle.location?.needsAttention) || (status === "offline" && !hasLocation);
      const matchesSearch = !term || [vehicle.registrationNo, vehicle.modelName, vehicle.bookingNumber, vehicle.rider?.name].some((value) => normalise(value).includes(term));
      return matchesStatus && matchesSearch;
    });
  }, [fleet, query, status]);

  const counts = useMemo(() => ({
    all: fleet?.length ?? 0,
    attention: fleet?.filter((vehicle) => vehicle.location?.needsAttention).length ?? 0,
    offline: fleet?.filter((vehicle) => !vehicle.location || !Number.isFinite(vehicle.location.latitude) || !Number.isFinite(vehicle.location.longitude)).length ?? 0,
  }), [fleet]);

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Operations" title="Live fleet" description="See where allocated vehicles last reported, who is riding them, and which vehicles need attention." />
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-3 rounded-[15px] border border-[#e3e0e5] bg-white px-4">
          <Bike className="size-[18px] text-[#7d7680]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search registration, model, rental or rider" className="h-12 w-full bg-transparent text-[13px] outline-none placeholder:text-[#99939b]" />
        </div>
        <div className="flex gap-1 overflow-x-auto rounded-[13px] border border-[#e1dee4] bg-white p-1.5">
          {[["all", "All", counts.all], ["attention", "Needs attention", counts.attention], ["offline", "No location", counts.offline]].map(([value, label, count]) => (
            <button key={value} type="button" onClick={() => setStatus(value)} className={`min-h-9 shrink-0 rounded-[8px] px-3 text-[11px] font-extrabold ${status === value ? "bg-[#eee9f4] text-[#513871]" : "text-[#77717a] hover:bg-[#f7f5f8]"}`}>
              {label} <span className="ml-1 opacity-60">{count}</span>
            </button>
          ))}
        </div>
      </div>
      {fleet !== undefined && <FleetMap vehicles={filtered} />}
      {fleet === undefined ? <LoadingPanel /> : filtered.length ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((vehicle) => {
            const hasLocation = vehicle.location && Number.isFinite(vehicle.location.latitude) && Number.isFinite(vehicle.location.longitude);
            return (
              <article key={vehicle.id} className="overflow-hidden rounded-[19px] border border-[#e3e0e5] bg-white">
                <div className="flex items-start justify-between gap-4 border-b border-[#eeeaf0] p-5">
                  <div className="flex min-w-0 gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-[13px] bg-[#f0edf4] text-[#654987]"><Bike className="size-5" /></span>
                    <div className="min-w-0">
                      <h3 className="truncate text-[15px] font-black">{vehicle.modelName}</h3>
                      <p className="mt-1 truncate font-mono text-[11px] text-[#79737c]">{vehicle.registrationNo}</p>
                    </div>
                  </div>
                  {vehicle.location?.needsAttention ? <StatusBadge value="Needs attention" /> : <StatusBadge value="Active" />}
                </div>
                <div className="grid grid-cols-2 gap-px bg-[#ece9ee]">
                  <div className="bg-white px-5 py-3.5"><p className="text-[10px] font-bold uppercase tracking-[.08em] text-[#8b858e]">Booking</p><p className="mt-1 text-[12px] font-extrabold">{vehicle.bookingNumber}</p></div>
                  <div className="bg-white px-5 py-3.5"><p className="text-[10px] font-bold uppercase tracking-[.08em] text-[#8b858e]">Charge</p><p className="mt-1 text-[12px] font-extrabold">{vehicle.location?.soc == null ? "Not available" : `${Math.round(vehicle.location.soc)}%`}</p></div>
                </div>
                <div className="p-5">
                  <div className="flex gap-3">
                    <MapPin className={`mt-0.5 size-4 shrink-0 ${hasLocation ? "text-[#5d407d]" : "text-[#aaa4ac]"}`} />
                    <div className="min-w-0">
                      <p className="text-[12px] font-extrabold">{hasLocation ? "Last-known location" : vehicle.hub?.name ?? "Location unavailable"}</p>
                      <p className="mt-1 text-[10px] leading-4 text-[#817b84]">{hasLocation ? relativeTime(vehicle.location.updatedAtMs) : "This vehicle has not sent a location update."}</p>
                    </div>
                  </div>
                  {hasLocation && (
                    <a href={`https://www.google.com/maps?q=${vehicle.location.latitude},${vehicle.location.longitude}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-[11px] font-extrabold text-[#5c3e7c]">
                      Open in Maps <ArrowRight className="size-3.5" />
                    </a>
                  )}
                  <div className="mt-4 border-t border-[#eeeaf0] pt-4 text-[11px] text-[#78727b]">
                    <span className="font-bold text-[#4b454e]">Rider:</span> {vehicle.rider?.name ?? "Not assigned"}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : <EmptyState icon={Bike} title="No matching fleet" description={query ? "Try a different registration, model, booking, or rider." : "Vehicles will appear here after they are allocated to an active rental."} />}
    </div>
  );
}

function BookingsView({ bookings, requests, onRequest, onRebook }) {
  const [view, setView] = useState("rentals");
  const [filter, setFilter] = useState("all");
  const filtered = useMemo(() => {
    if (!bookings) return [];
    if (filter === "all") return bookings;
    if (filter === "active") return bookings.filter((booking) => ["active", "deployed", "rental active", "on rent"].includes(normalise(booking.status)));
    if (filter === "upcoming") return bookings.filter((booking) => new Date(`${booking.periodStart}T00:00:00`) >= new Date() && !["active", "deployed", "rental active", "on rent"].includes(normalise(booking.status)));
    return bookings.filter((booking) => ["cancelled", "closed", "completed", "returned", "recovered"].includes(normalise(booking.status)));
  }, [bookings, filter]);
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Rentals" title="Rentals & requests" description="Track a requirement from the first request through quotation, contract, and vehicle deployment." action={<button type="button" onClick={() => onRequest()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] bg-[#352044] px-4 text-[12px] font-extrabold text-white"><Plus className="size-4" /> Request vehicles</button>} />
      <div className="flex gap-1 overflow-x-auto rounded-[12px] border border-[#e1dee4] bg-white p-1.5">
        {[["rentals", "Rentals", bookings?.length ?? 0], ["requests", "Fleet requests", requests?.length ?? 0]].map(([value, label, count]) => (
          <button key={value} type="button" onClick={() => setView(value)} className={`min-h-9 shrink-0 rounded-[8px] px-4 text-[11px] font-extrabold transition ${view === value ? "bg-[#eee9f4] text-[#513871]" : "text-[#77717a] hover:bg-[#f7f5f8]"}`}>{label}<span className="ml-2 opacity-60">{count}</span></button>
        ))}
      </div>
      {view === "rentals" && <>
        <div className="flex gap-1 overflow-x-auto border-b border-[#e2dfe4] pb-2">
          {[["all", "All"], ["active", "Active"], ["upcoming", "Upcoming"], ["past", "Past"]].map(([value, label]) => (
            <button key={value} type="button" onClick={() => setFilter(value)} className={`min-h-8 shrink-0 rounded-[8px] px-3 text-[11px] font-extrabold ${filter === value ? "bg-white text-[#513871] shadow-sm" : "text-[#77717a]"}`}>{label}</button>
          ))}
        </div>
        {bookings === undefined ? <LoadingPanel /> : filtered.length ? (
          <div className="overflow-hidden rounded-[18px] border border-[#e2dfe4] bg-white">
            <div className="hidden grid-cols-[1.05fr_1fr_.7fr_.9fr_.75fr_auto] gap-4 bg-[#f7f6f8] px-5 py-3 text-[10px] font-extrabold uppercase tracking-[.08em] text-[#79737c] md:grid">
              <span>Rental</span><span>Rental period</span><span>Fleet</span><span>Hub</span><span>Status</span><span />
            </div>
            {filtered.map((booking) => (
              <div key={booking.id} className="grid gap-3 border-t border-[#edeaef] p-4 first:border-t-0 md:grid-cols-[1.05fr_1fr_.7fr_.9fr_.75fr_auto] md:items-center md:gap-4 md:px-5 md:py-4">
                <div><p className="text-[13px] font-black">{booking.number}</p><p className="mt-1 text-[10px] text-[#817b84]">{booking.contract?.number ?? "Direct rental"}</p></div>
                <div className="text-[11px] leading-5 text-[#5d5760]"><span className="font-bold md:hidden">Period: </span>{formatDate(booking.periodStart)}<span className="block text-[#918b94]">to {formatDate(booking.periodEnd)}</span></div>
                <div><p className="text-[12px] font-extrabold">{booking.allocatedCount} / {booking.committedCount}</p><p className="mt-1 text-[10px] text-[#847e87]">vehicles allocated</p></div>
                <div><p className="truncate text-[12px] font-bold">{booking.hub?.name ?? "To be confirmed"}</p><p className="mt-1 truncate text-[10px] text-[#847e87]">{booking.hub?.city ?? "—"}</p></div>
                <div><StatusBadge value={booking.status} /></div>
                <button type="button" onClick={() => onRebook(booking)} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-[9px] border border-[#dcd7df] px-3 text-[10px] font-extrabold text-[#563b73]"><RefreshCcw className="size-3.5" /> Rebook</button>
              </div>
            ))}
          </div>
        ) : <EmptyState icon={CalendarDays} title="No rentals in this view" description="Try another status, or request vehicles for a new rental requirement." action={<button type="button" onClick={() => onRequest()} className="mt-4 text-[12px] font-extrabold text-[#5b3c7b]">Request vehicles</button>} />}
      </>}
      {view === "requests" && (requests === undefined ? <LoadingPanel /> : requests.length ? (
        <div className="space-y-3">
          {requests.map((request) => {
            const totalVehicles = request.lines.reduce((total, line) => total + Number(line.quantity ?? 0), 0);
            const stage = request.contract ? "Contract created" : request.quote ? `Quotation ${titleCase(request.quote.status)}` : request.status === "new" ? "Request received" : titleCase(request.status);
            return (
              <article key={request.id} className="rounded-[18px] border border-[#e2dfe4] bg-white p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-[14px] font-black">{request.number}</h3><StatusBadge value={stage} /></div><p className="mt-2 text-[11px] text-[#817b84]">Sent {new Date(request.createdAtMs).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} · {request.location ?? "Location to be confirmed"}</p></div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[540px]">
                    <div className="rounded-[11px] bg-[#f7f5f8] p-3"><p className="text-[9px] font-bold uppercase tracking-[.07em] text-[#8a848d]">Fleet</p><p className="mt-1 text-[12px] font-black">{totalVehicles} vehicles</p></div>
                    <div className="rounded-[11px] bg-[#f7f5f8] p-3"><p className="text-[9px] font-bold uppercase tracking-[.07em] text-[#8a848d]">Start</p><p className="mt-1 text-[12px] font-black">{formatDate(request.rentalStartDate)}</p></div>
                    <div className="rounded-[11px] bg-[#f7f5f8] p-3"><p className="text-[9px] font-bold uppercase tracking-[.07em] text-[#8a848d]">Quotation</p><p className="mt-1 truncate text-[12px] font-black">{request.quote?.number ?? "Pending"}</p></div>
                    <div className="rounded-[11px] bg-[#f7f5f8] p-3"><p className="text-[9px] font-bold uppercase tracking-[.07em] text-[#8a848d]">Contract</p><p className="mt-1 truncate text-[12px] font-black">{request.contract?.number ?? "Not created"}</p></div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-[#eeeaf0] pt-4">
                  {request.lines.map((line, index) => <span key={`${request.id}-${index}`} className="rounded-full border border-[#ded9e2] bg-[#faf9fb] px-3 py-1.5 text-[10px] font-bold text-[#5f5862]">{line.quantity} × {line.modelName} · {line.durationMonths} mo</span>)}
                  {request.quote && <span className="ml-auto text-[11px] font-black text-[#44364e]">{formatMoney(request.quote.total)}</span>}
                </div>
              </article>
            );
          })}
        </div>
      ) : <EmptyState icon={ReceiptText} title="No fleet requests yet" description="New requests and their quotation status will remain visible here." action={<button type="button" onClick={() => onRequest()} className="mt-4 text-[12px] font-extrabold text-[#5b3c7b]">Start a fleet request</button>} />)}
    </div>
  );
}

function DocumentsView({ documents }) {
  const requestRenewal = useMutation("b2bPortal:requestContractRenewal");
  const [section, setSection] = useState("contracts");
  const [workingId, setWorkingId] = useState(null);
  const rows = documents?.[section] ?? [];
  const labels = { contracts: "Contracts", invoices: "Invoices", kybDocuments: "KYB documents" };
  const renew = async (row) => {
    setWorkingId(row.id);
    try {
      await requestRenewal({ contractId: row.id });
      toast.success("Renewal request sent to the BLive commercial team");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We could not send the renewal request.");
    } finally { setWorkingId(null); }
  };
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Commercial records" title="Documents" description="Company agreements, invoices, and KYB files from the same records used by BLive operations." />
      <div className="flex gap-1 overflow-x-auto rounded-[12px] border border-[#e1dee4] bg-white p-1.5">
        {Object.entries(labels).map(([value, label]) => <button key={value} type="button" onClick={() => setSection(value)} className={`min-h-9 shrink-0 rounded-[8px] px-4 text-[11px] font-extrabold ${section === value ? "bg-[#eee9f4] text-[#513871]" : "text-[#77717a] hover:bg-[#f7f5f8]"}`}>{label}<span className="ml-2 text-[10px] opacity-60">{documents?.[value]?.length ?? 0}</span></button>)}
      </div>
      {documents === undefined ? <LoadingPanel /> : rows.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((row) => {
            const isInvoice = section === "invoices";
            const title = row.number ?? row.name;
            return (
              <article key={row.id} className="flex min-w-0 items-start gap-4 rounded-[17px] border border-[#e3e0e5] bg-white p-4 sm:p-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-[#f1edf5] text-[#624685]">{isInvoice ? <ReceiptText className="size-5" /> : section === "kybDocuments" ? <ShieldCheck className="size-5" /> : <FileCheck2 className="size-5" />}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-[13px] font-black">{title}</h3><StatusBadge value={row.status} /></div>
                  {isInvoice ? <p className="mt-2 text-[11px] text-[#78727b]">{formatMoney(row.total)} · Due {formatDate(row.dueDate)}</p> : section === "contracts" ? <p className="mt-2 text-[11px] text-[#78727b]">{formatDate(row.startDate)} to {formatDate(row.endDate)}</p> : <p className="mt-2 truncate text-[11px] text-[#78727b]">{row.fileName ?? "Uploaded document"}</p>}
                  {section === "contracts" && <p className="mt-2 text-[10px] text-[#8b858e]">{row.autoRenew ? "Auto-renewal enabled" : "Renewal is reviewed by the commercial team"}{row.paymentTerms ? ` · ${row.paymentTerms}` : ""}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {row.downloadUrl ? <a href={row.downloadUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#593b79]"><Download className="size-3.5" /> Open document</a> : <p className="text-[10px] font-bold text-[#989199]">Digital file not attached yet</p>}
                    {section === "contracts" && ["active", "expired"].includes(normalise(row.status)) && (row.renewalStatus === "open" ? <span className="rounded-full bg-[#f3eff6] px-2.5 py-1 text-[10px] font-extrabold text-[#60447f]">Renewal requested</span> : <button type="button" disabled={workingId === row.id} onClick={() => renew(row)} className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#593b79] disabled:opacity-50"><RefreshCcw className="size-3.5" /> {workingId === row.id ? "Sending…" : "Request renewal"}</button>)}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : <EmptyState icon={FileText} title={`No ${labels[section].toLowerCase()} available`} description="Documents will appear automatically when BLive operations adds them to your company record." />}
    </div>
  );
}

function SupportView({ tickets, fleet }) {
  const createTicket = useMutation("b2bPortal:createSupportTicket");
  const [formOpen, setFormOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [form, setForm] = useState({ category: "General support", subject: "", description: "", vehicleId: "" });

  const submit = async (event) => {
    event.preventDefault();
    setWorking(true);
    try {
      const result = await createTicket({ category: form.category, subject: form.subject.trim(), description: form.description.trim(), vehicleId: form.vehicleId || undefined });
      toast.success(`${result.number} has been raised`);
      setForm({ category: "General support", subject: "", description: "", vehicleId: "" });
      setFormOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We could not raise this request.");
    } finally { setWorking(false); }
  };

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Help" title="Support" description="Raise a connected service request and follow its status here." action={<button type="button" onClick={() => setFormOpen((value) => !value)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] bg-[#352044] px-4 text-[12px] font-extrabold text-white"><Plus className="size-4" /> New request</button>} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[18px] border border-[#ead6d2] bg-[#fff8f7] p-5"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-[12px] bg-white text-[#a44237]"><Headphones className="size-5" /></span><div><h3 className="text-[13px] font-black">Emergency support</h3><p className="mt-1 text-[10px] text-[#886c68]">Accident, theft, or an unsafe vehicle</p></div></div><a href="tel:08047190022" className="mt-5 inline-flex min-h-10 w-full items-center justify-center rounded-[10px] border border-[#d9aaa4] bg-white text-[12px] font-extrabold text-[#8b3028]">Call 080-4719-0022</a></div>
        <div className="rounded-[18px] border border-[#e2dfe4] bg-white p-5"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-[12px] bg-[#f1edf5] text-[#624685]"><CircleHelp className="size-5" /></span><div><h3 className="text-[13px] font-black">Operations help</h3><p className="mt-1 text-[10px] text-[#7f7881]">Service, billing, and general requests</p></div></div><button type="button" onClick={() => setFormOpen(true)} className="mt-5 min-h-10 w-full rounded-[10px] border border-[#d5cfda] text-[12px] font-extrabold text-[#4f405a]">Raise a request</button></div>
      </div>
      {formOpen && (
        <form onSubmit={submit} className="rounded-[20px] border border-[#ded9e2] bg-white p-5 shadow-[0_18px_45px_rgba(35,27,43,.07)] sm:p-6">
          <div className="flex items-center justify-between"><h3 className="text-[16px] font-black">New support request</h3><button type="button" aria-label="Close support form" onClick={() => setFormOpen(false)} className="flex size-8 items-center justify-center rounded-[8px] hover:bg-[#f4f2f5]"><X className="size-4" /></button></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-[12px] font-bold">Category<select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className={inputClass}>{SUPPORT_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-[12px] font-bold">Vehicle (optional)<select value={form.vehicleId} onChange={(event) => setForm((current) => ({ ...current, vehicleId: event.target.value }))} className={inputClass}><option value="">No specific vehicle</option>{fleet?.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.registrationNo} · {vehicle.modelName}</option>)}</select></label></div>
          <label className="mt-4 block text-[12px] font-bold">Subject<input required value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} placeholder="Briefly describe the issue" className={inputClass} /></label>
          <label className="mt-4 block text-[12px] font-bold">What happened?<textarea required value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Add the details our operations team will need" className={`${inputClass} h-28 resize-none py-3`} /></label>
          <button type="submit" disabled={working} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-[#352044] px-5 text-[12px] font-extrabold text-white disabled:bg-[#aaa4ae]"><Send className="size-4" />{working ? "Sending…" : "Send request"}</button>
        </form>
      )}
      <section>
        <h2 className="text-[16px] font-black">Request history</h2>
        <div className="mt-4 space-y-3">{tickets === undefined ? <LoadingPanel /> : tickets.length ? tickets.map((ticket) => <article key={ticket.id} className="grid gap-3 rounded-[16px] border border-[#e3e0e5] bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-[13px] font-black">{ticket.subject}</h3><StatusBadge value={ticket.status} /></div><p className="mt-2 text-[11px] text-[#77717a]">{ticket.number} · {ticket.category} · {new Date(ticket.createdAtMs).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p><p className="mt-2 line-clamp-2 text-[11px] leading-5 text-[#918b94]">{ticket.description}</p></div><span className="text-[10px] font-bold uppercase tracking-[.07em] text-[#8b858d]">{titleCase(ticket.priority)} priority</span></article>) : <EmptyState icon={TicketCheck} title="No support requests" description="When you raise a request, its status and history will stay visible here." />}</div>
      </section>
    </div>
  );
}

function AccountView({ session, onSignOut, onSupport }) {
  const updateAccount = useMutation("b2bPortal:updateAccount");
  const [phone, setPhone] = useState(session.client.phone ?? "");
  const [working, setWorking] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setWorking(true);
    try {
      const result = await updateAccount({ phone });
      setPhone(result.phone);
      toast.success("Company contact number updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We could not update the account.");
    } finally { setWorking(false); }
  };

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Company access" title="Account" description="The identity and contact details used for this Business portal." />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(290px,.8fr)]">
        <form onSubmit={submit} className="rounded-[20px] border border-[#e2dfe4] bg-white p-5 sm:p-6">
          <div className="flex items-center gap-4 border-b border-[#eeeaf0] pb-5">
            <span className="flex size-12 items-center justify-center rounded-[14px] bg-[#eee9f4] text-[#5a3e78]"><Building2 className="size-5" /></span>
            <div className="min-w-0"><h2 className="truncate text-[17px] font-black">{session.client.companyName}</h2><p className="mt-1 truncate text-[11px] text-[#827c85]">Primary company login</p></div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-[12px] font-bold">Company name<input readOnly value={session.client.companyName} className={`${inputClass} cursor-not-allowed bg-[#f7f6f8] text-[#746e77]`} /></label>
            <label className="text-[12px] font-bold">Login email<input readOnly value={session.client.email ?? ""} className={`${inputClass} cursor-not-allowed bg-[#f7f6f8] text-[#746e77]`} /></label>
            <label className="text-[12px] font-bold sm:col-span-2">Business contact number<input required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" className={inputClass} /></label>
          </div>
          <button type="submit" disabled={working} className="mt-5 min-h-11 rounded-[10px] bg-[#352044] px-5 text-[12px] font-extrabold text-white disabled:bg-[#aaa5ad]">{working ? "Saving…" : "Save contact details"}</button>
        </form>
        <aside className="space-y-4">
          <div className="rounded-[20px] border border-[#e2dfe4] bg-white p-5">
            <h3 className="text-[14px] font-black">Account status</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-[12px] bg-[#f7f6f8] p-3"><span className="text-[11px] font-bold text-[#716a74]">Company</span><StatusBadge value={session.client.status} /></div>
              <div className="flex items-center justify-between gap-3 rounded-[12px] bg-[#f7f6f8] p-3"><span className="text-[11px] font-bold text-[#716a74]">KYB</span><StatusBadge value={session.client.kybStatus} /></div>
              <div className="flex items-center justify-between gap-3 rounded-[12px] bg-[#f7f6f8] p-3"><span className="text-[11px] font-bold text-[#716a74]">Portal role</span><span className="text-[11px] font-black">{titleCase(session.role)}</span></div>
            </div>
          </div>
          <div className="rounded-[20px] border border-[#e2dfe4] bg-white p-5">
            <h3 className="text-[14px] font-black">Access help</h3>
            <p className="mt-2 text-[11px] leading-5 text-[#7e7881]">This workspace currently uses one primary company login. Ask Support to change the authorised email or company access.</p>
            <button type="button" onClick={onSupport} className="mt-4 min-h-10 w-full rounded-[10px] border border-[#dcd7df] text-[11px] font-extrabold text-[#563b73]">Contact Support</button>
            <button type="button" onClick={onSignOut} className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[10px] text-[11px] font-extrabold text-[#7b747e] hover:bg-[#f7f5f8]"><LogOut className="size-4" /> Sign out</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function RequestVehiclesModal({ catalog, onClose, seed }) {
  const requestVehicles = useMutation("b2bPortal:requestMoreVehicles");
  const models = useMemo(() => {
    const rows = Array.isArray(catalog?.data) ? catalog.data : [];
    return [...new Set([...rows.map((row) => row?.model?.modelName?.trim()).filter(Boolean), ...(seed?.lines ?? []).map((line) => line.modelName).filter(Boolean)])];
  }, [catalog, seed]);
  const [form, setForm] = useState({ location: seed?.location ?? "Bengaluru, Karnataka", rentalStartDate: seed?.rentalStartDate ?? "", durationMonths: seed?.durationMonths ?? 6, notes: seed?.notes ?? "" });
  const [lines, setLines] = useState(seed?.lines?.length ? seed.lines : [{ modelName: "", quantity: 10 }]);
  const [working, setWorking] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (lines.some((line) => !line.modelName || Number(line.quantity) < 1)) return toast.error("Choose a model and quantity for every line.");
    setWorking(true);
    try {
      const result = await requestVehicles({ ...form, durationMonths: Number(form.durationMonths), notes: form.notes.trim() || undefined, lines: lines.map((line) => ({ modelName: line.modelName, quantity: Number(line.quantity) })) });
      toast.success(`${result.number} was sent to the BLive team`);
      onClose();
    } catch (error) { toast.error(error instanceof Error ? error.message : "We could not send this request."); }
    finally { setWorking(false); }
  };
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#17131f]/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Request more vehicles">
      <form onSubmit={submit} className="max-h-[94vh] w-full overflow-y-auto rounded-t-[24px] bg-white p-5 shadow-2xl sm:max-w-[680px] sm:rounded-[24px] sm:p-7">
        <div className="flex items-start justify-between gap-5"><div><p className="text-[11px] font-extrabold uppercase tracking-[.1em] text-[#725491]">{seed ? "Rebook rental" : "New fleet requirement"}</p><h2 className="mt-1 text-[23px] font-black tracking-[-.035em]">{seed ? "Request a similar fleet" : "Request vehicles"}</h2><p className="mt-2 text-[12px] leading-5 text-[#7e7881]">This creates an enquiry for your company. Our commercial team will respond with availability and pricing.</p></div><button type="button" aria-label="Close vehicle request" onClick={onClose} className="flex size-9 shrink-0 items-center justify-center rounded-[9px] border border-[#e3dfe5]"><X className="size-4" /></button></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3"><label className="text-[12px] font-bold">City<select value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} className={inputClass}>{REQUEST_CITIES.map((city) => <option key={city}>{city}</option>)}</select></label><label className="text-[12px] font-bold">Expected start<input required type="date" value={form.rentalStartDate} onChange={(event) => setForm((current) => ({ ...current, rentalStartDate: event.target.value }))} className={inputClass} /></label><label className="text-[12px] font-bold">Rental duration<select value={form.durationMonths} onChange={(event) => setForm((current) => ({ ...current, durationMonths: Number(event.target.value) }))} className={inputClass}>{[1, 3, 6, 12, 18, 24, 36].map((value) => <option key={value} value={value}>{value} month{value === 1 ? "" : "s"}</option>)}</select></label></div>
        <div className="mt-6 flex items-center justify-between"><h3 className="text-[13px] font-black">Vehicle models</h3><button type="button" onClick={() => setLines((current) => [...current, { modelName: "", quantity: 10 }])} disabled={lines.length >= 20} className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#5b3d7b]"><Plus className="size-3.5" /> Add model</button></div>
        <div className="mt-3 space-y-3">{lines.map((line, index) => <div key={index} className="grid grid-cols-[minmax(0,1fr)_90px_auto] items-end gap-2"><label className="text-[11px] font-bold">Model<select required value={line.modelName} onChange={(event) => setLines((current) => current.map((item, lineIndex) => lineIndex === index ? { ...item, modelName: event.target.value } : item))} className={inputClass}><option value="">Choose a vehicle</option>{models.map((model) => <option key={model}>{model}</option>)}</select></label><label className="text-[11px] font-bold">Quantity<input required type="number" min="1" max="5000" value={line.quantity} onChange={(event) => setLines((current) => current.map((item, lineIndex) => lineIndex === index ? { ...item, quantity: Number(event.target.value) } : item))} className={inputClass} /></label><button type="button" aria-label={`Remove vehicle model ${index + 1}`} onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))} disabled={lines.length === 1} className="mb-0 flex size-11 items-center justify-center rounded-[10px] border border-[#e1dde3] text-[#8a838d] disabled:opacity-30"><X className="size-4" /></button></div>)}</div>
        <label className="mt-5 block text-[12px] font-bold">Notes (optional)<textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Deployment locations, use case, or other operational details" className={`${inputClass} h-24 resize-none py-3`} /></label>
        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-[#ece8ee] pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="min-h-11 rounded-[10px] border border-[#ded9e1] px-5 text-[12px] font-extrabold">Cancel</button><button type="submit" disabled={working} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-[#352044] px-5 text-[12px] font-extrabold text-white disabled:bg-[#aaa5ad]">{working ? "Sending…" : "Send fleet request"}<ArrowRight className="size-4" /></button></div>
      </form>
    </div>
  );
}

function BusinessPortal() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { signOut } = useAuthActions();
  const { isLoading } = useConvexAuth();
  const session = useQuery("b2bPortal:session", isLoading ? "skip" : {});
  const ready = session?.state === "ready";
  const overview = useQuery("b2bPortal:overview", ready ? {} : "skip");
  const bookings = useQuery("b2bPortal:bookings", ready ? {} : "skip");
  const requests = useQuery("b2bPortal:requests", ready ? {} : "skip");
  const fleet = useQuery("b2bPortal:fleet", ready ? {} : "skip");
  const documents = useQuery("b2bPortal:documents", ready ? {} : "skip");
  const tickets = useQuery("b2bPortal:support", ready ? {} : "skip");
  const catalog = useQuery("b2c/catalog:list", ready ? {} : "skip");
  const initialSection = NAVIGATION.some((item) => item.id === searchParams.get("section")) ? searchParams.get("section") : "home";
  const [active, setActive] = useState(initialSection);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestSeed, setRequestSeed] = useState(null);
  const [attentionOpen, setAttentionOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && session && session.state !== "ready") navigate("/business/access", { replace: true });
  }, [isLoading, navigate, session]);

  const selectSection = (id) => {
    setActive(id);
    setSearchParams(id === "home" ? {} : { section: id }, { replace: true });
    setMobileMenu(false);
    setAttentionOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openRequest = (seed = null) => { setRequestSeed(seed); setRequestOpen(true); };
  const closeRequest = () => { setRequestOpen(false); setRequestSeed(null); };
  const rebook = (booking) => {
    const start = new Date();
    start.setDate(start.getDate() + 7);
    const hubCity = booking.hub?.city ?? "";
    const location = REQUEST_CITIES.find((city) => normalise(city).includes(normalise(hubCity))) ?? "Bengaluru, Karnataka";
    openRequest({
      location,
      rentalStartDate: start.toISOString().slice(0, 10),
      durationMonths: 6,
      notes: `Similar to ${booking.number}`,
      lines: [{ modelName: booking.vehicleType ?? "", quantity: Math.max(1, booking.committedCount ?? 1) }],
    });
  };
  const logout = async () => { await signOut(); navigate("/business/access", { replace: true }); };

  if (!ready) return <div className="flex min-h-screen items-center justify-center bg-[#f6f5f7]"><div className="size-9 animate-spin rounded-full border-[3px] border-[#d6cfdf] border-t-[#5c3f7c]" /></div>;

  return (
    <div className="min-h-screen bg-[#f6f5f7] text-[#29252d] lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="hidden h-screen border-r border-[#e4e1e6] bg-white lg:sticky lg:top-0 lg:flex lg:flex-col">
        <div className="flex h-[76px] items-center gap-3 border-b border-[#ece9ee] px-6"><img src="/images/BliveLogo.svg" alt="BLive" className="h-8 w-auto" /><span className="h-5 w-px bg-[#ded9e1]" /><span className="text-[11px] font-extrabold text-[#5f5862]">Business</span></div>
        <nav className="flex-1 space-y-1 px-3 py-5">{NAVIGATION.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => selectSection(id)} className={`flex min-h-11 w-full items-center gap-3 rounded-[10px] px-3.5 text-[12px] font-extrabold transition ${active === id ? "bg-[#efeaf5] text-[#52366f]" : "text-[#6d6770] hover:bg-[#f7f5f8]"}`}>{createElement(Icon, { className: "size-[17px]" })}{label}</button>)}</nav>
        <div className="border-t border-[#ece9ee] p-4"><div className="flex items-center gap-3 rounded-[12px] bg-[#f7f5f8] p-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#e9e1f1] text-[#5e417d]"><Building2 className="size-[17px]" /></span><div className="min-w-0"><p className="truncate text-[11px] font-black">{session.client.companyName}</p><p className="mt-0.5 truncate text-[9px] text-[#817b84]">Primary company login</p></div></div><button type="button" onClick={logout} className="mt-2 flex min-h-10 w-full items-center gap-3 rounded-[9px] px-3 text-[11px] font-extrabold text-[#7b747e] hover:bg-[#f7f5f8]"><LogOut className="size-4" /> Sign out</button></div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-[68px] items-center justify-between border-b border-[#e4e1e6] bg-white/95 px-4 backdrop-blur sm:px-6 lg:h-[76px] lg:px-8">
          <div className="flex min-w-0 items-center gap-3 lg:hidden"><button type="button" aria-label="Open navigation" onClick={() => setMobileMenu(true)} className="flex size-10 items-center justify-center rounded-[10px] border border-[#e1dde3]"><Menu className="size-5" /></button><img src="/images/BliveLogo.svg" alt="BLive" className="h-7 w-auto" /></div>
          <div className="hidden lg:block"><p className="text-[11px] font-bold text-[#8a848d]">BLive Business Portal</p><h2 className="mt-1 text-[14px] font-black">{NAVIGATION.find((item) => item.id === active)?.label}</h2></div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => openRequest()} className="hidden min-h-10 items-center gap-2 rounded-[10px] border border-[#dcd7e0] bg-white px-4 text-[11px] font-extrabold text-[#4e4356] sm:inline-flex"><Plus className="size-4" /> Request vehicles</button>
            <div className="relative">
              <button type="button" onClick={() => setAttentionOpen((value) => !value)} className="relative flex size-10 items-center justify-center rounded-[10px] border border-[#e1dde3] text-[#6e6871]" aria-label="Notifications" aria-expanded={attentionOpen}><Bell className="size-[18px]" />{overview?.attention?.length > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#d25549] ring-2 ring-white" />}</button>
              {attentionOpen && <div className="absolute right-0 top-12 z-50 w-[min(340px,calc(100vw-32px))] rounded-[16px] border border-[#dfdbe2] bg-white p-3 shadow-[0_18px_50px_rgba(30,23,37,.16)]"><div className="flex items-center justify-between px-1 pb-2"><h3 className="text-[12px] font-black">Needs attention</h3><span className="text-[10px] text-[#8a848d]">{overview?.attention?.length ?? 0} items</span></div>{overview?.attention?.length ? <div className="space-y-1">{overview.attention.map((item) => <button key={`${item.type}-${item.label}`} type="button" onClick={() => selectSection(item.destination)} className="flex w-full items-center gap-3 rounded-[11px] px-3 py-3 text-left hover:bg-[#f7f5f8]"><span className="flex size-8 items-center justify-center rounded-[9px] bg-[#fff4e5] text-[#93691c]"><AlertCircle className="size-4" /></span><span className="min-w-0 flex-1"><span className="block text-[11px] font-extrabold">{item.label}</span><span className="mt-0.5 block text-[9px] text-[#89828b]">{item.count} record{item.count === 1 ? "" : "s"}</span></span><ChevronRight className="size-4 text-[#969099]" /></button>)}</div> : <div className="rounded-[11px] bg-[#f1f8f4] p-4 text-center text-[11px] font-bold text-[#2d704b]">Nothing needs attention</div>}</div>}
            </div>
            <button type="button" onClick={() => selectSection("account")} aria-label="Open account" className="hidden size-10 items-center justify-center rounded-[10px] bg-[#352044] text-white sm:flex"><UserRound className="size-[18px]" /></button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1380px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
          {active === "home" && <HomeView overview={overview} onNavigate={selectSection} onRequest={() => openRequest()} />}
          {active === "fleet" && <FleetView fleet={fleet} />}
          {active === "bookings" && <BookingsView bookings={bookings} requests={requests} onRequest={openRequest} onRebook={rebook} />}
          {active === "documents" && <DocumentsView documents={documents} />}
          {active === "support" && <SupportView tickets={tickets} fleet={fleet} />}
          {active === "account" && <AccountView session={session} onSignOut={logout} onSupport={() => selectSection("support")} />}
        </main>

        <button type="button" onClick={() => openRequest()} className="fixed bottom-5 right-5 z-30 flex size-13 items-center justify-center rounded-full bg-[#352044] text-white shadow-[0_12px_30px_rgba(42,29,54,.25)] sm:hidden" aria-label="Request vehicles"><Plus className="size-5" /></button>
      </div>

      {mobileMenu && <div className="fixed inset-0 z-[70] bg-[#17131f]/50 lg:hidden" onClick={() => setMobileMenu(false)}><aside className="h-full w-[280px] bg-white p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex h-12 items-center justify-between"><img src="/images/BliveLogo.svg" alt="BLive" className="h-7 w-auto" /><button type="button" aria-label="Close navigation" onClick={() => setMobileMenu(false)} className="flex size-9 items-center justify-center rounded-[9px] border border-[#e0dce2]"><X className="size-4" /></button></div><div className="mt-5 rounded-[13px] bg-[#f3eff6] p-4"><p className="text-[10px] font-bold uppercase tracking-[.09em] text-[#7f6c8e]">Company</p><p className="mt-1 truncate text-[13px] font-black">{session.client.companyName}</p></div><nav className="mt-4 space-y-1">{NAVIGATION.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => selectSection(id)} className={`flex min-h-11 w-full items-center gap-3 rounded-[10px] px-3 text-[12px] font-extrabold ${active === id ? "bg-[#eee9f4] text-[#51366e]" : "text-[#6d6770]"}`}>{createElement(Icon, { className: "size-[17px]" })}{label}</button>)}</nav><button type="button" onClick={logout} className="mt-8 flex min-h-11 w-full items-center gap-3 border-t border-[#e9e5eb] px-3 pt-4 text-[12px] font-extrabold text-[#7d767f]"><LogOut className="size-4" /> Sign out</button></aside></div>}
      {requestOpen && <RequestVehiclesModal key={requestSeed?.notes ?? "new-request"} catalog={catalog} seed={requestSeed} onClose={closeRequest} />}
    </div>
  );
}

export default BusinessPortal;
