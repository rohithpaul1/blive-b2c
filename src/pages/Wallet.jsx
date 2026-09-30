import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock3,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Login from "../components/Login";
import Loader from "../components/Loader";
import { useUser } from "../contexts/UserContext";
import Navbar from "../sections/Navbar";

// Wallet: one balance, the deposit in plain words, one action, and a short
// activity list. Dues only appear when something is actually owed.

const rupees = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const readableDate = (value) => {
  if (!value) return "";
  const parsed =
    typeof value === "number" || /^\d+$/.test(String(value))
      ? new Date(Number(value))
      : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(parsed);
};

const transactionLabel = {
  topup: "Money added",
  charge: "Subscription payment",
  hold: "Security deposit held",
  release: "Deposit returned",
  refund: "Refund",
  adjustment: "Balance adjustment",
  fixed_rental: "Rental payment",
  subscription: "Subscription payment",
  wallet_topup: "Money added",
  wallet_hold: "Security deposit held",
  wallet_release: "Deposit returned",
  wallet_refund: "Refund credited",
  wallet_adjustment: "Balance adjustment",
  deposit: "Security deposit",
};

const PRESETS = [500, 1000, 2000];
const PREVIEW_ROWS = 4;
const isHold = (t) => ["hold", "wallet_hold", "deposit"].includes(t.type);

const Wallet = () => {
  const { isAuthenticated } = useUser();
  const navigate = useNavigate();
  const wallet = useQuery("b2c/wallet:summary", isAuthenticated ? {} : "skip");
  const finance = useQuery("b2c/finance:history", isAuthenticated ? {} : "skip");
  const addMoney = useMutation("b2c/wallet:topUp");
  const [amount, setAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(0);
  const [historyView, setHistoryView] = useState("activity");
  const [showAll, setShowAll] = useState(false);

  const chosenAmount = useMemo(
    () => Number(customAmount || amount || 0),
    [amount, customAmount],
  );

  const topUp = async (value) => {
    if (!Number.isFinite(value) || value < 100) {
      toast.error("Enter at least ₹100");
      return;
    }
    try {
      setAdding(true);
      await addMoney({ amount: value });
      setJustAdded(value);
      setCustomAmount("");
    } catch (error) {
      toast.error(error?.message || "Unable to add money right now");
    } finally {
      setAdding(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <Login />
      </div>
    );
  }

  const sub = wallet?.activeSubscription;
  const needed = sub?.amountNeeded > 0 ? sub.amountNeeded : 0;
  const outstanding = Number(finance?.summary?.outstanding || 0);
  const transactions = finance?.transactions ?? [];
  const receipts = finance?.receipts ?? [];
  const visibleTx = showAll ? transactions : transactions.slice(0, PREVIEW_ROWS);
  const visibleReceipts = showAll ? receipts : receipts.slice(0, PREVIEW_ROWS);
  const listLength = historyView === "activity" ? transactions.length : receipts.length;

  return (
    <div className="min-h-screen bg-[#f5f4f7] text-[#1b1530]">
      <Navbar onSearchPage={false} expanded={true} />
      <main className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-[148px] sm:px-6 lg:px-8">
        <h1 className="mb-6 text-[28px] font-bold tracking-[-0.02em] sm:text-[34px]">Wallet</h1>

        {wallet === undefined ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-[#ecebf0] bg-white">
            <Loader />
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Dues: only when something is owed */}
            {needed > 0 && (
              <div className="flex flex-col gap-3 rounded-2xl border border-[#f6d7a8] bg-[#fff4e5] p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ffe4bf] text-[#8a4b00]">
                  <Clock3 size={20} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#5c3200]">
                    Add {rupees(needed)} before your renewal{sub?.nextChargeAt ? ` on ${readableDate(sub.nextChargeAt)}` : ""}
                  </p>
                  <p className="mt-0.5 text-sm text-[#7a4a10]">So your {sub?.vehicleName || "subscription"} keeps running without a break.</p>
                </div>
                <button
                  type="button"
                  onClick={() => topUp(needed)}
                  disabled={adding}
                  className="min-h-11 rounded-xl bg-[#8a4b00] px-5 text-sm font-semibold text-white hover:bg-[#723e00] disabled:opacity-50"
                >
                  Add {rupees(needed)}
                </button>
              </div>
            )}
            {outstanding > 0 && (
              <div className="flex flex-col gap-3 rounded-2xl border border-[#f6d7a8] bg-[#fff4e5] p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ffe4bf] text-[#8a4b00]">
                  <Clock3 size={20} aria-hidden="true" />
                </span>
                <p className="min-w-0 flex-1 font-semibold text-[#5c3200]">{rupees(outstanding)} is due on your rentals</p>
                <button
                  type="button"
                  onClick={() => { setHistoryView("receipts"); setShowAll(true); }}
                  className="min-h-11 rounded-xl border border-[#d9a55c] bg-white px-5 text-sm font-semibold text-[#5c3200] hover:bg-[#fffaf2]"
                >
                  See what's due
                </button>
              </div>
            )}

            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
              <div className="flex min-w-0 flex-col gap-5">
                {/* One number */}
                <section className="rounded-3xl bg-[#231552] p-6 text-white sm:p-10">
                  <p className="text-sm font-medium text-[#cfc8ec] sm:text-[15px]">Available to use</p>
                  <p className="mt-2 text-[44px] font-bold leading-none tracking-[-0.03em] sm:text-[64px]">
                    {rupees(wallet.availableBalance)}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#cfc8ec] sm:text-[15px]">
                    {sub
                      ? `Used automatically for your ${sub.vehicleName || "subscription"} renewal${sub.nextChargeAt ? ` on ${readableDate(sub.nextChargeAt)}` : ""}.`
                      : "You can use this balance once your subscription starts."}
                  </p>
                  {wallet.heldAmount > 0 && (
                    <div className="mt-7 flex items-center gap-3.5 rounded-2xl bg-[#2f1f66] p-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3d2b7d] text-[#e4defa]">
                        <ShieldCheck size={18} aria-hidden="true" />
                      </span>
                      <p className="text-sm leading-5 text-[#e4defa]">
                        <span className="font-semibold text-white">{rupees(wallet.heldAmount)} security deposit</span> is held safely. You get it back when you return your vehicle.
                      </p>
                    </div>
                  )}
                </section>

                {/* Recent activity */}
                <section className="rounded-3xl border border-[#ecebf0] bg-white px-5 py-5 sm:px-8 sm:py-7">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex gap-1" role="tablist" aria-label="History">
                      {[{ value: "activity", label: "Recent activity" }, { value: "receipts", label: "Receipts" }].map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          role="tab"
                          aria-selected={historyView === item.value}
                          onClick={() => setHistoryView(item.value)}
                          className={`min-h-10 rounded-lg px-3 text-sm font-semibold ${historyView === item.value ? "bg-[#f1edff] text-[#3b2380]" : "text-[#5d5870] hover:text-[#1b1530]"}`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    {listLength > PREVIEW_ROWS && (
                      <button type="button" onClick={() => setShowAll((v) => !v)} className="min-h-10 px-2 text-sm font-semibold text-[#3b2380] hover:text-[#231552]">
                        {showAll ? "Show less" : "See all"}
                      </button>
                    )}
                  </div>

                  {finance === undefined ? (
                    <div className="flex min-h-[140px] items-center justify-center"><Loader /></div>
                  ) : historyView === "activity" ? (
                    transactions.length === 0 ? (
                      <p className="py-10 text-center text-sm text-[#5d5870]">Money you add and payments you make will show up here.</p>
                    ) : (
                      <ul className="mt-3">
                        {visibleTx.map((t) => {
                          const incoming = t.direction === "in";
                          const hold = isHold(t);
                          return (
                            <li key={t.id} className="flex items-center gap-3.5 border-t border-[#f0eff3] py-3.5">
                              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${incoming && !hold ? "bg-[#e6f4ec] text-[#1f7a4a]" : "bg-[#f1f0f4] text-[#5d5870]"}`}>
                                {hold ? <ShieldCheck size={18} aria-hidden="true" /> : incoming ? <ArrowDownLeft size={18} aria-hidden="true" /> : <ArrowUpRight size={18} aria-hidden="true" />}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[15px] font-semibold">{transactionLabel[t.type] || t.note || "Wallet activity"}</p>
                                <p className="mt-0.5 text-[13px] text-[#5d5870]">{readableDate(t.createdAtMs)}</p>
                              </div>
                              <p className={`text-[15px] font-semibold ${incoming && !hold ? "text-[#1f7a4a]" : "text-[#1b1530]"}`}>
                                {incoming && !hold ? "+" : ""}{rupees(t.amount)}
                              </p>
                            </li>
                          );
                        })}
                      </ul>
                    )
                  ) : receipts.length === 0 ? (
                    <p className="py-10 text-center text-sm text-[#5d5870]">A receipt appears here after your first rental payment.</p>
                  ) : (
                    <ul className="mt-3">
                      {visibleReceipts.map((r) => (
                        <li key={r.id} className="flex items-center gap-3.5 border-t border-[#f0eff3] py-3.5">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] font-semibold">{r.number}</p>
                            <p className="mt-0.5 text-[13px] text-[#5d5870]">
                              {readableDate(r.periodStart)} – {readableDate(r.periodEnd)}
                              {r.outstanding > 0 && <span className="text-[#8a4b00]"> · {rupees(r.outstanding)} due</span>}
                            </p>
                          </div>
                          <p className="text-[15px] font-semibold">{rupees(r.total)}</p>
                        </li>
                      ))}
                    </ul>
                  )}

                  {sub && (
                    <button
                      type="button"
                      onClick={() => navigate(`/booking/${sub.bookingId}`)}
                      className="mt-2 flex min-h-12 w-full items-center justify-between border-t border-[#f0eff3] pt-2 text-sm font-semibold text-[#1b1530] hover:text-[#3b2380]"
                    >
                      View active rental
                      <ChevronRight size={18} aria-hidden="true" />
                    </button>
                  )}
                </section>
              </div>

              {/* Add money */}
              <aside className="rounded-3xl border border-[#ecebf0] bg-white p-6 sm:p-8">
                <h2 className="text-[22px] font-bold">Add money</h2>
                <p className="mt-1 text-sm text-[#5d5870]">Top up in seconds with UPI or card.</p>
                <div className="mt-5 grid grid-cols-3 gap-2.5">
                  {PRESETS.map((preset) => {
                    const on = !customAmount && amount === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        aria-pressed={on}
                        onClick={() => { setAmount(preset); setCustomAmount(""); setJustAdded(0); }}
                        className={`min-h-[52px] rounded-2xl text-base font-semibold transition-colors ${
                          on ? "border-2 border-[#3b2380] bg-[#f1edff] text-[#3b2380]" : "border border-[#dcdae3] bg-white hover:border-[#b8a7dc]"
                        }`}
                      >
                        {rupees(preset)}
                      </button>
                    );
                  })}
                </div>
                <label className="mt-5 block text-sm font-semibold" htmlFor="wallet-amount">Or enter an amount</label>
                <div className="mt-2 flex h-[52px] items-center rounded-2xl border border-[#dcdae3] px-4 focus-within:border-[#3b2380] focus-within:ring-2 focus-within:ring-[#3b2380]/10">
                  <span className="text-[#5d5870]">₹</span>
                  <input
                    id="wallet-amount"
                    inputMode="numeric"
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value.replace(/[^0-9]/g, "").slice(0, 6)); setJustAdded(0); }}
                    placeholder="Enter amount"
                    className="h-full min-w-0 flex-1 bg-transparent px-2 text-base outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => topUp(chosenAmount)}
                  disabled={adding || !(chosenAmount > 0)}
                  className="mt-5 flex min-h-14 w-full items-center justify-center rounded-2xl bg-[#3b2380] px-5 text-base font-semibold text-white transition-colors hover:bg-[#2c155f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {adding ? "Adding money…" : chosenAmount > 0 ? `Add ${rupees(chosenAmount)}` : "Choose an amount"}
                </button>
                {justAdded > 0 && (
                  <p className="mt-4 flex items-center gap-2 text-sm font-medium text-[#1f7a4a]" role="status">
                    <Check size={16} strokeWidth={2.4} aria-hidden="true" />
                    {rupees(justAdded)} added to your wallet
                  </p>
                )}
                <p className="mt-4 text-xs text-[#6b6780]">Demo checkout: your wallet updates instantly, no real payment is taken.</p>
              </aside>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Wallet;
