import { db } from "@/lib/db";
import { deleteFile, sweepLocalFiles } from "@/lib/storage";
import { FILE_RETENTION_MS } from "@/lib/constants";

export interface CleanupResult {
  jobsExpired: number;
  filesDeleted: number;
  orphansDeleted: number;
}

const BATCH_SIZE = 200;

/**
 * Deletes the stored files of every job older than FILE_RETENTION_HOURS
 * and marks the job with filesDeletedAt. Job rows stay so the dashboard
 * history and the public counters keep working.
 */
export async function cleanupExpiredFiles(): Promise<CleanupResult> {
  const cutoff = new Date(Date.now() - FILE_RETENTION_MS);
  const result: CleanupResult = { jobsExpired: 0, filesDeleted: 0, orphansDeleted: 0 };

  for (;;) {
    const jobs = await db.processingJob.findMany({
      where: { filesDeletedAt: null, createdAt: { lt: cutoff } },
      select: { id: true, inputStorageKey: true, outputStorageKey: true },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
    });
    if (jobs.length === 0) break;

    for (const job of jobs) {
      for (const key of [job.inputStorageKey, job.outputStorageKey]) {
        if (!key) continue;
        try {
          await deleteFile(key);
          result.filesDeleted++;
        } catch (error) {
          console.error(`[cleanup] Failed to delete ${key}:`, error);
        }
      }
    }

    await db.processingJob.updateMany({
      where: { id: { in: jobs.map((j) => j.id) } },
      data: {
        filesDeletedAt: new Date(),
        inputStorageKey: null,
        outputStorageKey: null,
      },
    });
    result.jobsExpired += jobs.length;

    if (jobs.length < BATCH_SIZE) break;
  }

  // Files with no job row (crash between upload and insert). Give them a
  // little extra time so an in-flight request is never hit.
  result.orphansDeleted = await sweepLocalFiles(FILE_RETENTION_MS + 60 * 60 * 1000);

  return result;
}

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // hourly
const FIRST_RUN_DELAY_MS = 60 * 1000;

declare global {
  var __imageforgeCleanupTimer: ReturnType<typeof setInterval> | undefined;
}

/**
 * Starts the hourly cleanup loop inside the server process. Called once
 * from instrumentation.ts. Safe to call again (dev hot reload).
 */
export function startCleanupScheduler(): void {
  if (globalThis.__imageforgeCleanupTimer) return;

  const run = async () => {
    try {
      const r = await cleanupExpiredFiles();
      if (r.jobsExpired || r.filesDeleted || r.orphansDeleted) {
        console.log(
          `[cleanup] expired ${r.jobsExpired} jobs, deleted ${r.filesDeleted} files, removed ${r.orphansDeleted} orphans`
        );
      }
    } catch (error) {
      console.error("[cleanup] run failed:", error);
    }
  };

  const first = setTimeout(run, FIRST_RUN_DELAY_MS);
  first.unref();
  const timer = setInterval(run, CLEANUP_INTERVAL_MS);
  timer.unref();
  globalThis.__imageforgeCleanupTimer = timer;
  console.log("[cleanup] scheduler started (hourly)");
}
