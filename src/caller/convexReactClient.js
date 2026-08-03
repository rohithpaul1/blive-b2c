import { ConvexReactClient } from "convex/react";
import { CONVEX_URL } from "../config/env";

// One shared client is important: ConvexAuthProvider attaches the active
// Driver session to this instance, and imperative API adapters reuse it for
// authenticated checkout/history calls outside React hooks.
export const convexClient = CONVEX_URL ? new ConvexReactClient(CONVEX_URL) : null;

