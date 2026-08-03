import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Login from "../components/Login";
import Loader from "../components/Loader";
import { useUser } from "../contexts/UserContext";
import Navbar from "../sections/Navbar";

const rupees = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const readableDate = (value) => {
  if (!value) return "To be scheduled";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const transactionLabel = {
  topup: "Money added",
  charge: "Subscription payment",
  hold: "Amount held",
  release: "Hold released",
  refund: "Refund",
  adjustment: "Balance adjustment",
};

const Wallet = () => {
  const { isAuthenticated } = useUser();
  const navigate = useNavigate();
  const wallet = useQuery("b2c/wallet:summary", isAuthenticated ? {} : "skip");
  const addMoney = useMutation("b2c/wallet:topUp");
  const [amount, setAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [adding, setAdding] = useState(false);

  const chosenAmount = useMemo(
    () => Number(customAmount || amount || 0),
    [amount, customAmount],
  );

  const handleTopUp = async () => {
    if (!Number.isFinite(chosenAmount) || chosenAmount < 100) {
      toast.error("Enter at least ₹100");
      return;
    }
    try {
      setAdding(true);
      await addMoney({ amount: chosenAmount });
      toast.success(`${rupees(chosenAmount)} added to your wallet`);
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

  return (
    <div className="min-h-screen bg-[#f7f7f8] text-[#222222]">
      <Navbar onSearchPage={false} expanded={true} />
      <main className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-[148px] sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-[#6d6d72]">Subscription wallet</p>
          <h1 className="mt-1 text-[28px] font-bold tracking-[-0.02em] sm:text-[34px]">
            Your wallet
          </h1>
          <p className="mt-2 max-w-[620px] text-sm leading-6 text-[#6d6d72] sm:text-base">
            Keep enough balance for your next renewal. We will show you exactly what is due before money is charged.
          </p>
        </div>

        {wallet === undefined ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-[#e8e8eb] bg-white">
            <Loader />
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
            <section className="overflow-hidden rounded-3xl bg-[#271254] text-white shadow-[0_18px_50px_rgba(39,18,84,0.16)]">
              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white/70">Available balance</p>
                    <p className="mt-2 text-[38px] font-bold tracking-[-0.04em] sm:text-[48px]">
                      {rupees(wallet.availableBalance)}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12">
                    <WalletCards size={24} aria-hidden="true" />
                  </div>
                </div>

                {wallet.activeSubscription ? (
                  <div className="mt-8 rounded-2xl border border-white/15 bg-white/10 p-5">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/60">
                          Next renewal
                        </p>
                        <p className="mt-2 text-lg font-semibold">
                          {wallet.activeSubscription.vehicleName}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/75">
                          <span className="flex items-center gap-2">
                            <CalendarDays size={16} aria-hidden="true" />
                            {readableDate(wallet.activeSubscription.nextChargeAt)}
                          </span>
                          <span>
                            {rupees(wallet.activeSubscription.recurringCharge)} every {wallet.activeSubscription.cadence}
                          </span>
                        </div>
                      </div>
                      {wallet.activeSubscription.amountNeeded > 0 && (
                        <div className="rounded-xl bg-[#fff2df] px-4 py-3 text-[#7a3e00]">
                          <p className="text-xs font-semibold uppercase tracking-wide">Add before renewal</p>
                          <p className="mt-1 text-lg font-bold">
                            {rupees(wallet.activeSubscription.amountNeeded)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-8 max-w-[520px] text-sm leading-6 text-white/70">
                    Your wallet becomes active when a subscription rental starts.
                  </p>
                )}
              </div>
              <div className="grid border-t border-white/10 bg-black/10 sm:grid-cols-2">
                <div className="p-5 sm:px-8">
                  <p className="text-xs font-medium uppercase tracking-wide text-white/55">Wallet total</p>
                  <p className="mt-1 text-lg font-semibold">{rupees(wallet.balance)}</p>
                </div>
                <div className="border-t border-white/10 p-5 sm:border-l sm:border-t-0 sm:px-8">
                  <p className="text-xs font-medium uppercase tracking-wide text-white/55">Held for deposit</p>
                  <p className="mt-1 text-lg font-semibold">{rupees(wallet.heldAmount)}</p>
                </div>
              </div>
            </section>

            <aside className="rounded-3xl border border-[#e8e8eb] bg-white p-5 sm:p-6">
              <h2 className="text-xl font-bold">Add money</h2>
              <p className="mt-1 text-sm leading-5 text-[#6d6d72]">
                Choose an amount or enter your own.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                {[500, 1000, 2000, 5000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setAmount(preset);
                      setCustomAmount("");
                    }}
                    className={`min-h-11 rounded-xl border px-3 text-sm font-semibold transition-colors ${
                      !customAmount && amount === preset
                        ? "border-[#5d35b5] bg-[#f6f2ff] text-[#4a2595]"
                        : "border-[#dedee3] bg-white hover:border-[#b8a7dc]"
                    }`}
                  >
                    {rupees(preset)}
                  </button>
                ))}
              </div>
              <label className="mt-4 block text-sm font-semibold" htmlFor="wallet-amount">
                Custom amount
              </label>
              <div className="mt-2 flex h-12 items-center rounded-xl border border-[#dedee3] px-4 focus-within:border-[#5d35b5] focus-within:ring-2 focus-within:ring-[#5d35b5]/10">
                <span className="text-[#6d6d72]">₹</span>
                <input
                  id="wallet-amount"
                  inputMode="numeric"
                  value={customAmount}
                  onChange={(event) => setCustomAmount(event.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Enter amount"
                  className="h-full min-w-0 flex-1 bg-transparent px-2 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleTopUp}
                disabled={adding}
                className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-[#351a75] px-5 text-sm font-bold text-white transition-colors hover:bg-[#2c155f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {adding ? "Adding money…" : `Add ${rupees(chosenAmount)}`}
              </button>
              <div className="mt-4 flex items-start gap-3 rounded-xl bg-[#f7f7f8] p-3 text-xs leading-5 text-[#5f5f64]">
                <ShieldCheck className="mt-0.5 shrink-0" size={16} aria-hidden="true" />
                This test checkout updates your wallet instantly. No real payment is collected.
              </div>
            </aside>

            <section className="rounded-3xl border border-[#e8e8eb] bg-white lg:col-span-2">
              <div className="flex items-center justify-between border-b border-[#ededf0] px-5 py-5 sm:px-6">
                <div>
                  <h2 className="text-xl font-bold">Recent activity</h2>
                  <p className="mt-1 text-sm text-[#77777d]">Your latest wallet credits and charges</p>
                </div>
              </div>
              {wallet.transactions.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="font-semibold">No wallet activity yet</p>
                  <p className="mt-1 text-sm text-[#77777d]">Top-ups and renewal payments will appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#ededf0]">
                  {wallet.transactions.map((transaction) => {
                    const incoming = transaction.amount >= 0;
                    return (
                      <div key={transaction.id} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${incoming ? "bg-[#eaf8ef] text-[#19733b]" : "bg-[#fff0ef] text-[#a1322d]"}`}>
                          {incoming ? <ArrowDownLeft size={20} aria-hidden="true" /> : <ArrowUpRight size={20} aria-hidden="true" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold sm:text-base">
                            {transaction.note || transactionLabel[transaction.type] || "Wallet activity"}
                          </p>
                          <p className="mt-0.5 text-xs text-[#77777d] sm:text-sm">
                            {readableDate(transaction.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold sm:text-base ${incoming ? "text-[#19733b]" : "text-[#a1322d]"}`}>
                            {incoming ? "+" : "−"}{rupees(Math.abs(transaction.amount))}
                          </p>
                          {transaction.balanceAfter != null && (
                            <p className="mt-0.5 text-xs text-[#77777d]">
                              {rupees(transaction.balanceAfter)} balance
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {wallet.activeSubscription && (
                <button
                  type="button"
                  onClick={() => navigate(`/booking/${wallet.activeSubscription.bookingId}`)}
                  className="flex min-h-12 w-full items-center justify-between border-t border-[#ededf0] px-5 text-sm font-semibold hover:bg-[#fafafa] sm:px-6"
                >
                  View active rental
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default Wallet;
