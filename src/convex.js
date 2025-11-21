import { ConvexProvider, ConvexReactClient } from "convex/react";

// For development, we'll use a placeholder URL
// In production, you'll set this to your actual Convex deployment URL
const convexUrl = import.meta.env.VITE_CONVEX_URL || "https://example.convex.cloud";

const convex = new ConvexReactClient(convexUrl);

export { ConvexProvider, convex };