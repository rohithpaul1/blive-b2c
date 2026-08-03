# BLive B2C — Go-Live Runbook

Prepared 27 July 2026. Covers `b2c-fe-development` (React 19 / Vite 7) and
`b2c-be-development` (NestJS 11).

---

## 1. Status at a glance

| Area | State |
|---|---|
| Frontend build | ✅ Verified — builds clean, 2112 modules, 240 KB of JS gzipped |
| Frontend config | ✅ Env-driven, misconfiguration now fails the build |
| Frontend routing on static host | ✅ Verified — deep links render via SPA rewrite |
| Frontend secrets | ✅ No hardcoded API host or payment key left in the bundle |
| Backend build | ❌ **Cannot compile** — see Blocker 1 |
| Deploy pipeline | ❌ **No git repository** — see Blocker 2 |
| Production API host | ❌ Does not exist yet — see Blocker 3 |

**The frontend is ready to deploy. The backend is not, and the frontend is
useless without it.** Work the blockers in order.

---

## 2. Blockers — must clear before going live

### Blocker 1 — the backend cannot build

`b2c-be-development/src/shared/` is **empty**. It is a git submodule pointing at
`https://github.com/blive-arcis/ezy-common-module-be.git`, and every module in
the app imports from it: `AppConfigService`, `AuthGuard`, the response and
exception interceptors, the JWT service, the PDF generator, and all TypeORM
entities (`order.entity`, `hub.entity`, `notification.entity`, …).

`npm run build` will fail on the first import. Fix:

```bash
git submodule update --init --recursive
```

This only works inside a real clone (see Blocker 2), and requires credentials
for the private `blive-arcis` org.

### Blocker 2 — neither folder is a git repository

There is no `.git` directory in either project. Consequences:

- The submodule above cannot be restored — there is no submodule config to act on.
- **Vercel and Netlify deploy from a git repository.** There is no pipeline to
  connect until this is fixed.
- Nothing here is version controlled. The changes in section 3 were made against
  copies with no history behind them.

Fix — clone fresh from your real remotes and re-apply, rather than `git init`-ing
these folders:

```bash
git clone --recurse-submodules <your-b2c-fe-remote> b2c-fe
git clone --recurse-submodules <your-b2c-be-remote> b2c-be
```

Then copy the modified files (section 3) across. Originals are preserved in
`b2c-fe-development/_pre-golive-backup/` if you need to diff.

### Blocker 3 — there is no production API host

The frontend was pointed at `devevolve-api.blive.co.in`, a dev host. You chose to
deploy this backend too, so before the frontend can go anywhere you need:

- a host for the NestJS app (it listens on **4015**, `Dockerfile` is ready)
- a production Postgres, with `migration:run` applied
- a production Redis (BullMQ + cache)
- a DNS record and TLS certificate, e.g. `api.blive.co.in`
- all secrets from `b2c-be-development/.env.example` populated

---

## 3. What was changed

### Frontend — `b2c-fe-development`

| File | Change |
|---|---|
| `src/config/env.js` | **New.** Single source of truth for `API_BASE_URL` and `RAZORPAY_KEY_ID`; strips trailing slashes |
| `vite.config.js` | Build **aborts** if `VITE_BACKEND_URL` / `VITE_RAZORPAY_KEY_ID` are missing; warns on a test key; strips `console.log/debug/info/trace` from prod (keeps `warn`/`error`); splits vendor chunks |
| `src/caller/axiosConfig.js` | Hardcoded `devevolve-api...` base URL → `API_BASE_URL` |
| `src/components/BookingCard.jsx` | Hardcoded invoice URL → `API_BASE_URL` |
| `src/pages/BookingDetails.jsx` | Hardcoded invoice URL → `API_BASE_URL` |
| `src/pages/Booking.jsx` | Live Razorpay key → env; **removed a `console.log` that dumped `import.meta.env` to the browser console** |
| `src/components/ModifyDates.jsx` | Live Razorpay key → env |
| `src/components/UploadCard.jsx` | Removed a `https://fake-server.com/...` placeholder URL |
| `src/pages/SearchPage.jsx` | Removed a debug `console.log` sitting inside JSX render output |
| `vercel.json`, `netlify.toml` | **New.** SPA rewrites, immutable asset caching, HSTS + security headers |
| `.env.example` | **New.** Documented template |
| `.gitignore` | Tightened so `.env*` can never be committed but `.env.example` is kept |
| `package.json` | Added `engines.node >= 20.19` |

The `Dockerfile`, `nginx.conf`, `docker-compose.yml` and `DOCKER_README.md` are
now unused on a static host. Harmless to leave; delete if you want one path only.

### Backend — `b2c-be-development`

| File | Change |
|---|---|
| `src/main.ts` | `origin: '*'` → allowlist from `CORS_ORIGINS`; Swagger no longer served when `NODE_ENV=production` unless `ENABLE_SWAGGER=true` |
| `.env.example` | **New.** Best-effort template — see the warning inside it |

`main.ts` was verified to parse cleanly, but **could not be type-checked**
because of Blocker 1. Re-run `npm run build` once the submodule is restored.

---

## 4. Deploy order

### Step 1 — backend

```bash
git submodule update --init --recursive
npm ci
cp .env.example .env        # then fill in every value
npm run migration:run       # against production Postgres
npm run build
docker build -t blive-b2c-api .
```

Set `CORS_ORIGINS` to your real frontend origins before the first request.
Confirm `GET https://api.blive.co.in/b2c/api` responds, and that
`/b2c/api/docs` returns **404** in production.

> `main.ts` ends with `AppClusterService.register(bootstrap, 2)` — it forks 2
> workers, each capped at 700 MB (`NODE_OPTIONS` in the Dockerfile). Give the
> host at least 2 vCPU and ~2 GB RAM.

### Step 2 — frontend

Connect the repo to Vercel (or Netlify). Framework preset: **Vite**.
Build command `npm run build`, output directory `dist`. Then set:

| Variable | Value |
|---|---|
| `VITE_BACKEND_URL` | `https://api.blive.co.in/b2c/api` — no trailing slash |
| `VITE_RAZORPAY_KEY_ID` | your `rzp_live_…` key id |

Both are read at **build time**. Changing them later requires a redeploy.
If either is missing the build fails with an explicit message — that is
deliberate, it stops a storefront shipping while wired to the dev backend.

### Step 3 — DNS

Point the apex/www records at the host, and confirm the certificate covers both.

---

## 5. Razorpay — check before taking real money

The key `rzp_live_bwdTunYjyHtxtf` was hardcoded in two files while the app was
pointed at the **dev** backend. That means dev and staging builds were configured
to take **live payments**. Before launch:

- [ ] Confirm that key belongs to the account you want settlements paid into.
- [ ] Confirm no test/staging deploy is still serving it (any old build is).
- [ ] `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are backend-only —
      verify neither ever appears in a `VITE_` variable.
- [ ] Register the production webhook URL and verify signature checking.
- [ ] Run one real low-value transaction end to end, then refund it.

> `key_id` is publishable and safe in the bundle. `key_secret` is not, and
> nothing in the frontend should ever see it.

---

## 6. Post-deploy smoke tests

- [ ] `/` renders; hero video and vehicle catalogue load
- [ ] Deep link straight to `/search` — must render, not 404 *(verified locally)*
- [ ] Phone OTP login succeeds; token persists across refresh
- [ ] Vehicle search returns results for a real hub and date range
- [ ] Complete a booking through Razorpay checkout
- [ ] Download an invoice PDF — exercises the backend Puppeteer path
- [ ] Upload an e-KYC document, then confirm it via `GET /e-kyc/get-documents`
- [ ] Modify booking dates, including a top-up payment
- [ ] Cancel a booking
- [ ] Browser console shows no `console.log` noise and no CORS errors
- [ ] Requests from an unlisted origin are rejected by CORS

---

## 7. Known risks and follow-ups

**Worth fixing soon, not launch-blocking:**

1. **Every loading spinner depends on two third-party CDNs.**
   `@lottiefiles/dotlottie-react` fetches its WebAssembly runtime from
   jsDelivr/unpkg, and the animation itself from `lottie.host`. If either is
   slow or blocked, loaders never appear. Self-host the `.lottie` file in
   `public/` and the wasm alongside it.

2. **OpenStreetMap Nominatim is used for reverse geocoding**
   (`src/contexts/SearchBarContext.jsx`). Its usage policy restricts commercial
   and high-volume use, and it blocks by IP. `api.bigdatacloud.net` is also
   called. Move to a commercial geocoder before meaningful traffic.

3. **Auth tokens are stored in `localStorage`**, which is readable by any XSS on
   the page. httpOnly cookies are the stronger option.

4. **No error monitoring.** Nothing reports a production failure. Wire up Sentry,
   then set `build.sourcemap: 'hidden'` in `vite.config.js` and upload the maps.

5. **Main bundle is 1.02 MB (199 KB gzipped; 240 KB across all JS)** in one chunk. Vendors are now split
   out; the next win is route-level `React.lazy` on `Booking` (68 KB source) and
   `BookingDetails` (44 KB).

6. **`npm run lint` reports 46 errors and 19 warnings** repo-wide (mostly
   unused variables, two `no-constant-binary-expression`, and missing hook
   dependencies). All pre-existing — none introduced by these changes. Worth
   clearing before they hide a real bug.

7. **The document upload progress bar is fake.** `UploadCard.jsx` animates to
   100% on a timer; the real upload happens later, when the user submits the
   form. Users see "done" before anything has been sent. Functionally fine
   today — the file itself is uploaded correctly — but the feedback is a lie.
