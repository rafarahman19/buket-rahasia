export async function register(): Promise<void> {
  // Validate required server secrets immediately at Node.js server boot
  // (skipped during static `next build` compilation phase).
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  ) {
    const { getServerEnv } = await import("./lib/env");
    getServerEnv();
  }
}
