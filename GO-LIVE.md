# BLive B2C — Go-Live Runbook

Originally prepared 27 July 2026. **Rewritten August 2026** to reflect the
architecture change: the storefront (`b2c-fe-development`, React 19 / Vite 7) now
runs on the **admin's Convex backend** (`ezy-saas-admin-fe`), not the standalone
NestJS backend. NestJS (`b2c-be-development`) is being retired.

---

## 0. What changed since the first runbook

The first version of this doc assumed go-live meant standing up the NestJS
backend and pointing the site at it. That plan is superseded. The storefront's
API layer (`getAPI/postAPI`) now routes through a Convex seam
(`src/caller/convexClient.js`) to the admin's shared Convex deployment, and only
falls back to NestJS for endpoints not yet migrated. Consequence: the old
"backend can't build / no prod API host" blockers are **moot for everything that
has been migrated**, and the critical path is now **finishing the Convex cutover
+ real payments + KYC**, not shipping NestJS.

The switch is one env var: `VITE_CONVEX_URL` → the admin's **prod** Convex
(`https://helpful-hummingbird-285.convex.cloud`).

---

## 1. Status at a glance

| Area | State |
|---|---|
| Frontend build | ✅ Builds clean, env-driven, secrets stripped from bundle |
| Frontend routing on static host | ✅ SPA rewrite verified |
| Backend | ✅ **Convex (admin, shared)** — no NestJS host to stand up for migrated flows |
| Rental core on Convex | ✅ Catalog, pricing/quote, hubs, coupons, booking start/confirm, history, detail |
| Auth (phone OTP) | ⚠️ On Convex Auth, but **prod env not set** — sign-in currently errors |
| Prod Convex data | ⚠️ Must be **seeded + linked** (models→pricing, plans, rates, hubs) |
| Remaining endpoints | ❌ Profile, e-KYC, notifications, env-stats, cancel, change-dates still fall back to NestJS |
| Payments | ❌ **Simulated** today (`SIMULATE_PAYMENT` / `confirmSimulatedPayment`) — real Razorpay not wired |
| KYC linkage | ❌ Uploads go to NestJS/S3; admin reviews Convex — source of truth undecided |
| Deploy pipeline | ✅ Both repos git-backed; confirm storefront's Vercel + `VITE_CONVEX_URL` |

**Critical path to launch: A → B → C below.** The single thing blocking sign-in
*right now* is A.1 (prod OTP env).

---

## 2. Pending work (was "Blockers")

### A. Finish the Convex cutover

**A.1 — Prod OTP env (current sign-in blocker).**
`auth:signIn` errors on prod because the phone provider's `sendPhoneOtp` throws
when neither simulation mode nor SMS credentials are configured. Set one:

```bash
cd <admin repo: ezy-saas-admin-fe>
npx convex env set B2C_OTP_MODE simulation --prod      # OTP is 123456, no SMS
# — or, for real delivery, leave B2C_OTP_MODE unset and set:
#   npx convex env set B2C_SMS_API_URL "<gateway>" --prod
#   npx convex env set B2C_SMS_API_KEY "<key>" --prod
npx convex env list --prod                              # also confirm SITE_URL + JWT keys exist
```

**A.2 — Migrate the remaining endpoints, then remove the NestJS fallback.**
Still routing to NestJS via the fallback in `axiosUrls.js`:

- `user-onboarding/update-user`, `user-information/:id`, `update-user-image/:id`
  → `b2c/auth:completeProfile` / `currentProfile` already exist; just map them in
  `convexClient.js`.
- `e-kyc/upload-documents`, `get-documents` → needs Convex functions (see C).
- `vehicle-plan/notifications` + mark-seen, `environmental-stats`,
  `cancel-booking/:id`, `change-dates/:id` → need Convex functions.

Remove the axios/NestJS fallback **last**, once all of the above are green — so
profile, KYC, and account flows don't break mid-migration.

**A.3 — Seed & link prod Convex data.**
The admin's prod Convex must actually hold the B2C catalog, or cards show the
fallback ₹999 and no km/onboarding extras. Verify:

```bash
npx convex run b2c/catalog:list '{}' --prod    # each model: non-999 price, rentalPlans, perKmCharge/perDayKmLimit/onboardingFee
npx convex run b2c/hubs:list '{}' --prod
```

Per vehicle model in admin: link it to a pricing model (externalId or name),
give it active plans + base rates, and set the km-allowance / extra-km /
onboarding / deposit defaults in Rental Configuration. Fix mismatched specs and
photos (e.g. "Tata Punch EV" rendering as a scooter).

### B. Real payments

Checkout is **simulated** today (`SIMULATE_PAYMENT=true` → Convex
`b2c/booking:confirmSimulatedPayment`). To take real money:

- Wire Razorpay **create order** + **verify payment** as Convex actions
  (`"use node"`); `RAZORPAY_KEY_SECRET` and the webhook secret stay in Convex
  env vars, never in a `VITE_` variable.
- Register the production webhook and verify signature checking.
- Then the §5 pre-flight checklist below.

### C. KYC source of truth

Documents currently upload to the NestJS `/e-kyc/upload-documents` (→ S3) while
the admin reviews from Convex `userProfiles.profileFields` — two disconnected
stores. Decide the source of truth (Convex file storage recommended, per the
migration plan) and wire `get-documents` + document approve/reject accordingly.
Until then, admin KYC review runs on simulated/placeholder documents.

### D. Deploy & config

- Storefront Vercel project: set **`VITE_CONVEX_URL = https://helpful-hummingbird-285.convex.cloud`**
  (Production; also Preview if you want it there). Redeploy — Vite bakes env at
  build time.
- Confirm the storefront repo is connected to Vercel with auto-deploy on push.
- Admin deploys its Convex functions with `npx convex deploy`.

---

## 3. History — changes made in the pre-Convex hardening pass

*(retained from the original runbook; still valid — these were the launch-readiness
fixes to the storefront before the Convex pivot.)*

| File | Change |
|---|---|
| `src/config/env.js` | Single source of truth for `API_BASE_URL`, `RAZORPAY_KEY_ID`; now also `CONVEX_URL`, `USE_MOCKS`, `SIMULATE_PAYMENT` |
| `vite.config.js` | Build aborts on missing required env; strips `console.*` from prod; splits vendor chunks |
| `src/caller/axiosConfig.js`, `BookingCard.jsx`, `BookingDetails.jsx` | Hardcoded dev host / invoice URLs → env |
| `src/pages/Booking.jsx`, `ModifyDates.jsx` | Live Razorpay key → env; removed an env-dump `console.log` |
| `src/caller/convexClient.js` | **The Convex seam** — routes mapped endpoints to the admin's Convex |
| `vercel.json`, `netlify.toml`, `.env.example`, `.gitignore` | SPA rewrites, security headers, env template, secret hygiene |

Newer B2C work layered on top: extra-km + one-time onboarding fee on the cards
and checkout (sourced from admin plan config), the labelled spec row, and the
admin-side quote/catalog exposing `perKmCharge` / `perDayKmLimit` /
`onboarding_fee`.

---

## 4. Deploy order (Convex model)

1. **Admin Convex** — `cd ezy-saas-admin-fe && npx convex deploy` (ships catalog,
   quote, auth, hubs, booking, wallet). Set prod env: `B2C_OTP_MODE`, SMS keys
   (if real), Razorpay secret + webhook secret (when payments go live),
   `SITE_URL`, JWT keys.
2. **Seed / link prod data** (A.3) and verify with `npx convex run b2c/catalog:list ... --prod`.
3. **Storefront** — set `VITE_CONVEX_URL` (admin prod) + `VITE_RAZORPAY_KEY_ID`
   in Vercel; framework **Vite**, build `npm run build`, output `dist`; deploy.
4. **DNS/TLS** — point apex/www at the host; confirm the certificate.

There is no separate NestJS host, Postgres, Redis, or migration step for the
migrated flows. (If any un-migrated endpoint is still needed at launch, that one
still requires the NestJS backend — see A.2.)

---

## 5. Razorpay — check before taking real money

*(unchanged — still applies when payments move off simulation)*

- [ ] The live key belongs to the account you want settlements paid into.
- [ ] No test/staging build is still serving a live key.
- [ ] `RAZORPAY_KEY_SECRET` + webhook secret live **only** in Convex env (server), never in a `VITE_` var.
- [ ] Production webhook registered and signature-checked.
- [ ] One real low-value transaction end to end, then refunded.

---

## 6. Post-deploy smoke tests (Convex)

- [ ] `/` renders; hero + vehicle catalogue load **from admin Convex**
- [ ] Deep link to `/search` renders (SPA rewrite), returns real hubs/models
- [ ] Phone OTP login succeeds (OTP `123456` in simulation); token persists across refresh
- [ ] A vehicle card shows a real (non-₹999) price, `rentalPlans`, and the extra-km / onboarding line
- [ ] Checkout Price Details shows the extra-km line + onboarding fee (first booking); total matches
- [ ] Complete a booking (simulated payment today; real Razorpay once B is done)
- [ ] Booking history + detail load; modify dates; cancel *(once A.2 migrates these)*
- [ ] e-KYC upload + review *(once C is wired)*
- [ ] Browser console clean; no CORS errors calling Convex; no requests to the old NestJS host for migrated paths

---

## 7. Known risks & follow-ups

*(carried over — not launch-blocking, but real)*

1. **Lottie loaders depend on third-party CDNs** (jsDelivr/unpkg wasm + `lottie.host`). Self-host the `.lottie` + wasm in `public/`.
2. **Nominatim reverse geocoding** (`SearchBarContext.jsx`) violates commercial-use policy at volume and blocks by IP. Move to a commercial geocoder.
3. **Auth tokens in `localStorage`** — readable by any XSS. httpOnly cookies are stronger.
4. **No error monitoring.** Wire Sentry; set `build.sourcemap: 'hidden'` and upload maps.
5. **Main bundle ~1 MB** (199 KB gzipped). Vendors split; next win is route-level `React.lazy` on `Booking` / `BookingDetails`.
6. **`npm run lint`: 46 errors / 19 warnings** repo-wide, pre-existing. Clear before they hide a real bug.
7. **Fake upload progress bar** (`UploadCard.jsx`) animates to 100% on a timer before the file is actually sent.

New follow-ups from the Convex pivot:

8. **Convex is the single point of failure now** — the storefront and admin share one deployment. Confirm prod scaling/limits and that a bad admin migration can't break the storefront.
9. **The NestJS fallback is still live in code.** Until A.2 is done, an unmapped call silently hits NestJS — keep `VITE_BACKEND_URL` pointed somewhere valid, or expect those specific flows to fail once NestJS is decommissioned.
