import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
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

    const totalFilesProcessed = totals._count ?? 0;
    const totalInputBytes = totals._sum.inputFileSize ?? 0;
    const totalOutputBytes = totals._sum.outputFileSize ?? 0;
    const totalSpaceSaved = Math.max(0, totalInputBytes - totalOutputBytes);

    return NextResponse.json({
      totalFilesProcessed,
      totalDataProcessedBytes: totalInputBytes,
      totalSpaceSavedBytes: totalSpaceSaved,
      totalUsers: userCount,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { totalFilesProcessed: 0, totalDataProcessedBytes: 0, totalSpaceSavedBytes: 0, totalUsers: 0 }
    );
  }
}
