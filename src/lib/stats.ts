import { db } from "@/lib/db";

export interface SiteStats {
  totalFilesProcessed: number;
  totalDataProcessedBytes: number;
  totalSpaceSavedBytes: number;
  totalUsers: number;
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/** Minimum thresholds for stats to be worth displaying publicly. */
const STATS_THRESHOLDS = {
  totalFilesProcessed: 500,
  totalDataProcessedBytes: 1024 * 1024 * 1024, // 1 GB
  totalSpaceSavedBytes: 100 * 1024 * 1024, // 100 MB
  totalUsers: 500,
} as const;

let cached: { data: SiteStats; expiresAt: number } | null = null;

export async function getStats(): Promise<SiteStats> {
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  try {
    const [totals, userCount] = await Promise.all([
      db.processingJob.aggregate({
        where: { status: "COMPLETED" },
        _count: true,
        _sum: {
          inputFileSize: true,
          outputFileSize: true,
        },
      }),
      db.user.count(),
    ]);

    const totalInputBytes = totals._sum.inputFileSize ?? 0;
    const totalOutputBytes = totals._sum.outputFileSize ?? 0;

    const data: SiteStats = {
      totalFilesProcessed: totals._count ?? 0,
      totalDataProcessedBytes: totalInputBytes,
      totalSpaceSavedBytes: Math.max(0, totalInputBytes - totalOutputBytes),
      totalUsers: userCount,
    };

    cached = { data, expiresAt: Date.now() + CACHE_TTL_MS };
    return data;
  } catch (error) {
    console.error("Stats error:", error);
    throw error;
  }
}

/** Returns true only when every stat meets its display threshold. */
export function areStatsWorthShowing(stats: SiteStats): boolean {
  return (
    stats.totalFilesProcessed >= STATS_THRESHOLDS.totalFilesProcessed &&
    stats.totalDataProcessedBytes >= STATS_THRESHOLDS.totalDataProcessedBytes &&
    stats.totalSpaceSavedBytes >= STATS_THRESHOLDS.totalSpaceSavedBytes &&
    stats.totalUsers >= STATS_THRESHOLDS.totalUsers
  );
}
