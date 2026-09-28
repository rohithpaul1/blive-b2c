// Payment link page - /pay/:token
//
// Admins can book on a customer's behalf and "Send payment link". The rider
// opens this page (no login needed - the token is the credential), sees the
// same price breakdown the website checkout shows, and pays to confirm.
// Payment is simulated for now, exactly like the regular website checkout.
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../sections/Navbar";
import { convexClient } from "../caller/convexReactClient";

const inr = (n) =>
  `₹${Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const fmt = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      })
    : "";

const Line = ({ label, value, bold, green }) => (
  <div className={`flex justify-between py-[6px] text-[15px] ${bold ? "font-bold text-[#222222]" : "text-[#555555]"}`}>
    <span>{label}</span>
    <span className={green ? "text-[#1a9e55]" : "text-[#222222]"}>{value}</span>
  </div>
);

const PayLink = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const load = async () => {
    if (!convexClient) {
      setData({ state: "not_found" });
      setLoading(false);
      return;
    }
    try {
      const res = await convexClient.query("b2c/adminBooking:linkCheckout", { token });
      setData(res);
    } catch {
      setData({ state: "not_found" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const pay = async () => {
    setPaying(true);
    try {
      await convexClient.mutation("b2c/adminBooking:payByLink", { token });
      toast.success("Payment received — your booking is confirmed!");
      await load();
    } catch (e) {
      toast.error(String(e?.message ?? e).replace(/^.*Uncaught Error:\s*/, "").split("\n")[0]);
      await load();
    } finally {
      setPaying(false);
    }
  };

  const b = data?.booking;
  const pb = data?.breakdown;
  const isSub = b?.rentalMode === "subscription";

  return (
    <div className="w-full min-h-dvh overflow-x-hidden flex flex-col items-center bg-[#FAFAFA]">
      <Navbar onSearchPage={false} expanded={true} />
      <div className="mt-[124px] w-full max-w-[520px] px-[16px] pb-[48px]">
        {loading ? (
          <p className="text-center text-[#969696] mt-[48px]">Loading your booking…</p>
        ) : data?.state === "not_found" ? (
          <div className="rounded-[16px] bg-white shadow-md p-[24px] text-center">
            <h1 className="text-[22px] font-bold text-[#222222]">Link not found</h1>
            <p className="mt-[8px] text-[#555555]">This payment link isn't valid. Please contact b:live support.</p>
          </div>
        ) : (
          <div className="rounded-[16px] bg-white shadow-md p-[24px]">
            <p className="text-[13px] text-[#969696]">Booking {data.bookingNumber}</p>
            <h1 className="text-[22px] font-bold text-[#222222] mt-[4px]">
              {data.state === "paid"
                ? "Booking confirmed"
                : data.state === "expired"
                  ? "This link has expired"
                  : data.state === "closed"
                    ? "This booking is closed"
                    : `Hi ${data.riderName ?? "there"}, complete your payment`}
            </h1>

            {b && (
              <div className="mt-[16px] rounded-[12px] border border-[#EDEDED] p-[16px]">
                <p className="font-bold text-[#222222]">{b.vehicleModel?.modelName}</p>
                <p className="text-[14px] text-[#555555]">{b.plan?.name}</p>
                <p className="mt-[8px] text-[14px] text-[#555555]">
                  {fmt(b.pickUpDate)} → {fmt(b.dropOffDate)}
                </p>
                <p className="text-[14px] text-[#555555]">
                  {b.isHomeDelivery ? `Doorstep delivery: ${b.dropOffAddress ?? ""}` : `Pickup: ${b.hub?.name ?? ""}`}
                </p>
              </div>
            )}

            {pb && (
              <div className="mt-[16px]">
                <Line label={`Rental (${inr(pb.unit_rate)} × ${pb.quantity})`} value={inr(pb.total_rental)} />
                {pb.discount_amount > 0 && <Line label="Discount" value={`− ${inr(pb.discount_amount)}`} green />}
                {pb.home_delivery_amount > 0 && <Line label="Doorstep delivery" value={inr(pb.home_delivery_amount)} />}
                <Line label={`GST (${pb.gst_percentage}%)`} value={inr(pb.gst_amount)} />
                {isSub ? (
                  <Line label="Wallet top-up" value={inr(pb.wallet_top_up)} />
                ) : (
                  <Line label="Refundable security deposit" value={inr(pb.security_deposit)} />
                )}
                <div className="border-t border-[#EDEDED] my-[8px]" />
                <Line label="Total" value={inr(data.amount)} bold />
              </div>
            )}

            {data.state === "payable" && (
              <>
                <button
                  onClick={pay}
                  disabled={paying}
                  className="mt-[20px] w-full rounded-[12px] bg-[#222222] py-[14px] text-white font-bold disabled:opacity-50"
                >
                  {paying ? "Processing…" : `Pay ${inr(data.amount)}`}
                </button>
                {data.expiresAt && (
                  <p className="mt-[8px] text-center text-[13px] text-[#969696]">
                    Vehicle held until {new Date(data.expiresAt).toLocaleString("en-IN")}
                  </p>
                )}
              </>
            )}
            {data.state === "paid" && (
              <button
                onClick={() => navigate("/my-bookings")}
                className="mt-[20px] w-full rounded-[12px] border border-[#222222] py-[14px] text-[#222222] font-bold"
              >
                View my bookings
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PayLink;
