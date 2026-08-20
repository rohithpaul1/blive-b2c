/**
 * ---------------------------------------------------------------------------
 * CONVEX SEAM
 * ---------------------------------------------------------------------------
 * When VITE_CONVEX_URL is set, the API layer (axiosUrls.js) routes mapped
 * endpoints here — to the SHARED Convex backend the admin runs on. Both apps
 * read/write the same tables, so they're interconnected.
 *
 * This is an incremental migration: only endpoints listed below are handled by
 * Convex. Everything else returns { handled: false } and falls through to the
 * mock layer (or the real REST backend), so the app keeps working while we
 * migrate domain by domain. As each B2C Convex function ships, add its route
 * here.
 *
 * Responses mirror the backend wrapper { status, message, data } that
 * getAPI/postAPI return, so components need no changes.
 * ---------------------------------------------------------------------------
 */
import { convexClient as client } from "./convexReactClient";

/** True when a Convex deployment URL is configured. */
export const USE_CONVEX = !!client;

const ok = (data, message = "OK") => ({ status: "success", message, data });

/**
 * Try to resolve a request against Convex.
 * @returns {Promise<{handled: boolean, result?: any}>}
 */
const serializable = (value) =>
  value == null ? value : JSON.parse(JSON.stringify(value));

export async function resolveConvex(method, path, data) {
  if (!client) return { handled: false };
  const p = (path || "").split("?")[0];
  const queryParams = new URLSearchParams((path || "").split("?")[1] || "");

  // ---- mapped B2C endpoints (grow this list per migration slice) ----
  if (method === "GET" && p === "/vehicle-plan/all-hubs") {
    const hubs = await client.query("b2c/hubs:list", {});
    return { handled: true, result: ok(hubs) };
  }
  if (method === "GET" && p.startsWith("/vehicle-plan/vehicle-model-with-plan")) {
    const data = await client.query("b2c/catalog:list", {});
    return { handled: true, result: ok(data) };
  }
  if (method === "GET" && p === "/vehicle-plan/check-new-user") {
    const catalog = await client.query("b2c/booking:couponCatalog", {});
    return { handled: true, result: ok({ newUser: catalog.newUser }) };
  }
  if (method === "GET" && p === "/vehicle-plan/available-coupons") {
    const rawContext = queryParams.get("couponContext");
    let input;
    try {
      input = rawContext ? JSON.parse(rawContext) : undefined;
    } catch {
      input = undefined;
    }
    const catalog = await client.query("b2c/booking:couponCatalog", {
      input: serializable(input),
    });
    return { handled: true, result: ok(catalog.coupons) };
  }
  if (method === "POST" && p === "/vehicle-plan/dynamic-calculation") {
    const quote = await client.query("b2c/booking:quote", {
      input: serializable(data),
    });
    return { handled: true, result: ok(quote, "Price and availability calculated") };
  }
  if (method === "POST" && p === "/vehicle-plan/handle-payment") {
    const checkout = await client.mutation("b2c/booking:startCheckout", {
      input: serializable(data),
    });
    return { handled: true, result: ok(checkout, "Vehicle reserved for checkout") };
  }
  if (method === "POST" && p === "/vehicle-plan/verify-payment") {
    const confirmation = await client.mutation("b2c/booking:confirmSimulatedPayment", {
      input: serializable(data),
    });
    return { handled: true, result: ok(confirmation, "Payment confirmed and booking created") };
  }
  if (method === "GET" && p === "/vehicle-plan/booking-history") {
    const history = await client.query("b2c/booking:history", {});
    return { handled: true, result: ok(history) };
  }
  if (method === "GET" && p.startsWith("/vehicle-plan/booking/")) {
    const id = decodeURIComponent(p.slice("/vehicle-plan/booking/".length));
    const booking = await client.query("b2c/booking:detail", { id });
    return { handled: true, result: ok(booking) };
  }

  // ---- customer management: profile (userProfiles) ----
  if (method === "GET" && p.startsWith("/user-onboarding/user-information/")) {
    const profile = await client.query("b2c/auth:currentProfile", {});
    return { handled: true, result: ok(profile) };
  }
  if (method === "POST" && p === "/user-onboarding/update-user") {
    const profile = await client.mutation("b2c/auth:completeProfile", {
      firstName: String(data?.firstName ?? "").trim(),
      lastName: String(data?.lastName ?? "").trim(),
      ...(data?.email ? { email: String(data.email).trim() } : {}),
    });
    return { handled: true, result: ok(profile, "Profile updated") };
  }

  // ---- customer management: e-KYC documents (read) ----
  if (method === "GET" && p.startsWith("/e-kyc/get-documents")) {
    const docs = await client.query("b2c/auth:getDocuments", {});
    return { handled: true, result: ok(docs) };
  }

  // ---- booking management: cancel ----
  if (method === "POST" && p.startsWith("/vehicle-plan/cancel-booking/")) {
    const id = decodeURIComponent(p.slice("/vehicle-plan/cancel-booking/".length));
    const booking = await client.mutation("b2c/booking:cancel", {
      id,
      reason: data?.cancelationReason ?? data?.reason ?? undefined,
    });
    return { handled: true, result: ok(booking, "Booking cancelled") };
  }

  // not migrated yet — let the caller fall back to mocks / REST.
  // Still on the REST fallback: document/image UPLOADS (multipart → need Convex
  // file storage), notifications, environmental-stats, change-dates.
  return { handled: false };
}
