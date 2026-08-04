import { useEffect, useState } from "react";
import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Building2, Check, Eye, EyeOff, ShieldCheck } from "lucide-react";

const fieldClass =
  "mt-2 h-12 w-full rounded-[12px] border border-[#ddd9e1] bg-white px-4 text-[15px] text-[#2d2930] outline-none transition placeholder:text-[#969198] focus:border-[#6a5294] focus:ring-2 focus:ring-[#6a5294]/10";

function BusinessPortalAccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite")?.trim() ?? "";
  const invitedEmail = searchParams.get("email")?.trim() ?? "";
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const session = useQuery("b2bPortal:session", isLoading ? "skip" : {});
  const redeemInvitation = useMutation("b2bPortal:redeemInvitation");

  const [mode, setMode] = useState(inviteToken ? "create" : "signin");
  const [email, setEmail] = useState(invitedEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [working, setWorking] = useState(false);
  const [pendingRedemption, setPendingRedemption] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session?.state === "ready") navigate("/business/portal", { replace: true });
  }, [navigate, session?.state]);

  useEffect(() => {
    if (!pendingRedemption || !isAuthenticated || !inviteToken) return;
    let active = true;
    setWorking(true);
    redeemInvitation({ token: inviteToken })
      .then(() => {
        if (active) navigate("/business/portal", { replace: true });
      })
      .catch((redemptionError) => {
        if (!active) return;
        setError(
          redemptionError instanceof Error
            ? redemptionError.message
            : "We could not connect this invitation."
        );
        setPendingRedemption(false);
      })
      .finally(() => {
        if (active) setWorking(false);
      });
    return () => {
      active = false;
    };
  }, [inviteToken, isAuthenticated, navigate, pendingRedemption, redeemInvitation]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const workEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(workEmail)) {
      setError("Enter your work email address.");
      return;
    }
    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }
    if (mode === "create" && !inviteToken) {
      setError("Open the invitation shared with your accepted quotation.");
      return;
    }

    setWorking(true);
    try {
      if (isAuthenticated && session?.state === "invitation_required" && mode === "create") {
        setPendingRedemption(true);
        return;
      }
      await signIn("password", {
        email: workEmail,
        password,
        flow: mode === "create" ? "signUp" : "signIn",
      });
      if (mode === "create") setPendingRedemption(true);
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : mode === "create"
          ? "We could not create your portal access."
          : "The email or password is incorrect."
      );
      setWorking(false);
    }
  };

  const resetSignedInAccount = async () => {
    setWorking(true);
    setError("");
    try {
      await signOut();
      setPendingRedemption(false);
    } finally {
      setWorking(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f5f7] text-[#29252d] lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)]">
      <section className="relative hidden overflow-hidden bg-[#17131f] px-14 py-12 text-white lg:flex lg:min-h-screen lg:flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_90%,rgba(121,89,181,.4),transparent_38%)]" />
        <button
          type="button"
          onClick={() => navigate("/business")}
          className="relative inline-flex w-fit items-center gap-2 text-[13px] font-bold text-white/70 transition hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Back to BLive for Business
        </button>
        <div className="relative my-auto max-w-[560px]">
          <span className="flex size-12 items-center justify-center rounded-[15px] bg-white text-[#351a75]">
            <Building2 className="size-6" />
          </span>
          <h1 className="mt-8 text-[52px] font-black leading-[1.03] tracking-[-0.05em]">
            Your fleet,
            <span className="block text-[#c8b5ef]">in one clear view.</span>
          </h1>
          <p className="mt-6 max-w-[490px] text-[17px] leading-7 text-white/62">
            Track rentals, retrieve commercial documents, and contact the BLive
            operations team without switching between emails and spreadsheets.
          </p>
          <div className="mt-10 space-y-4 text-[14px] text-white/75">
            {["Company-scoped access", "Live operational records", "One connected support history"].map((item) => (
              <span key={item} className="flex items-center gap-3">
                <span className="flex size-6 items-center justify-center rounded-full bg-white/10">
                  <Check className="size-3.5 text-[#c8b5ef]" />
                </span>
                {item}
              </span>
            ))}
          </div>
        </div>
        <p className="relative text-[11px] text-white/38">BLive Business Client Portal</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10 lg:px-14">
        <div className="w-full max-w-[480px]">
          <div className="flex items-center justify-between lg:hidden">
            <img src="/images/BliveLogo.svg" alt="BLive" className="h-8 w-auto" />
            <button type="button" onClick={() => navigate("/business")} className="text-[13px] font-bold text-[#5b5360]">
              Back
            </button>
          </div>

          <div className="mt-12 rounded-[24px] border border-[#e1dee4] bg-white p-6 shadow-[0_24px_70px_rgba(36,28,46,.08)] sm:p-8 lg:mt-0">
            <span className="flex size-11 items-center justify-center rounded-[14px] bg-[#f1edf8] text-[#5b3b8e]">
              <ShieldCheck className="size-5" />
            </span>
            <h2 className="mt-6 text-[30px] font-black tracking-[-0.04em]">
              {mode === "create" ? "Set up portal access" : "Business login"}
            </h2>
            <p className="mt-3 text-[14px] leading-6 text-[#716c75]">
              {mode === "create"
                ? "Use the work email from your accepted quotation to create the company’s primary login."
                : "Sign in with the primary work email connected to your BLive fleet."}
            </p>

            {isAuthenticated && session?.state === "invitation_required" && (
              <div className="mt-5 rounded-[12px] border border-[#eadfca] bg-[#fffaf0] p-4 text-[12px] leading-5 text-[#725626]">
                You are already signed in as {session.email || "another account"}. If this is not the invited work email, sign out before continuing.
                <button type="button" onClick={resetSignedInAccount} className="ml-1 font-bold underline">
                  Sign out
                </button>
              </div>
            )}

            <form onSubmit={submit} className="mt-7">
              <label className="block text-[13px] font-bold text-[#3f3a42]">
                Work email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com"
                  autoComplete="email"
                  readOnly={mode === "create" && Boolean(invitedEmail)}
                  className={`${fieldClass} read-only:bg-[#f7f6f8] read-only:text-[#6d6770]`}
                />
              </label>
              <label className="mt-5 block text-[13px] font-bold text-[#3f3a42]">
                Password
                <span className="relative block">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={mode === "create" ? "Create at least 8 characters" : "Enter your password"}
                    autoComplete={mode === "create" ? "new-password" : "current-password"}
                    className={`${fieldClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-[18px] flex size-8 items-center justify-center rounded-[8px] text-[#777179] hover:bg-[#f5f3f6]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-[17px]" /> : <Eye className="size-[17px]" />}
                  </button>
                </span>
              </label>

              {error && (
                <p role="alert" className="mt-5 rounded-[11px] border border-[#f1c7c3] bg-[#fff5f4] px-4 py-3 text-[12px] font-medium leading-5 text-[#9f2d25]">
                  {error.replace(/^\[CONVEX[^\]]*\]\s*/i, "")}
                </p>
              )}

              <button
                type="submit"
                disabled={working || isLoading}
                className="mt-6 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[13px] bg-[#351a75] px-5 text-[14px] font-bold text-white transition hover:bg-[#2c155f] disabled:cursor-wait disabled:bg-[#aaa4b2]"
              >
                {working
                  ? mode === "create"
                    ? "Connecting your company…"
                    : "Signing in…"
                  : mode === "create"
                  ? "Create company access"
                  : "Sign in to portal"}
                {!working && <ArrowRight className="size-[17px]" />}
              </button>
            </form>

            <div className="mt-6 border-t border-[#ebe8ed] pt-5 text-center text-[12px] text-[#716c75]">
              {mode === "create" ? "Already set up?" : "Have an invitation?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode((current) => (current === "create" ? "signin" : "create"));
                  setError("");
                }}
                className="font-bold text-[#4d287f]"
              >
                {mode === "create" ? "Sign in" : "Create access"}
              </button>
            </div>
          </div>
          <p className="mt-5 text-center text-[11px] leading-5 text-[#8a858c]">
            Need access help? Contact BLive at 080-4719-0022.
          </p>
        </div>
      </section>
    </main>
  );
}

export default BusinessPortalAccess;
