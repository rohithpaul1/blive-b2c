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
import { ConvexHttpClient } from "convex/browser";
import { CONVEX_URL } from "../config/env";

const client = CONVEX_URL ? new ConvexHttpClient(CONVEX_URL) : null;

/** True when a Convex deployment URL is configured. */
export const USE_CONVEX = !!client;

const ok = (data, message = "OK") => ({ status: "success", message, data });

/**
 * Try to resolve a request against Convex.
 * @returns {Promise<{handled: boolean, result?: any}>}
 */
export async function resolveConvex(method, path) {
  if (!client) return { handled: false };
  const p = (path || "").split("?")[0];

  // ---- mapped B2C endpoints (grow this list per migration slice) ----
  if (method === "GET" && p === "/vehicle-plan/all-hubs") {
    const hubs = await client.query("b2c/hubs:list", {});
    return { handled: true, result: ok(hubs) };
  }
  if (method === "GET" && p.startsWith("/vehicle-plan/vehicle-model-with-plan")) {
    const data = await client.query("b2c/catalog:list", {});
    return { handled: true, result: ok(data) };
  }

  // not migrated yet — let the caller fall back to mocks / REST
  return { handled: false };
}
