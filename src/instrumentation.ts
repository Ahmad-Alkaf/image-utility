/**
 * Runs once when the Next.js server starts. Starts the hourly cleanup
 * that deletes uploads and results older than FILE_RETENTION_HOURS.
 * Skipped during `next build` and in the edge runtime.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { startCleanupScheduler } = await import("./lib/cleanup");
  startCleanupScheduler();
}
