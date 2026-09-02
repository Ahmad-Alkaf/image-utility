import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getFile } from "@/lib/storage";
import { db } from "@/lib/db";
import { FILE_RETENTION_MS } from "@/lib/constants";

const EXPIRED_MESSAGE = "This file has expired. Results are deleted after 24 hours.";

/**
 * Serves a processed file. Access is granted by the download token in the
 * URL, or by a signed-in session that owns the job.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await db.processingJob.findUnique({ where: { id } });

    if (!job) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const hasValidToken = !!token && token === job.downloadToken;

    let hasValidSession = false;
    if (!hasValidToken && job.userId) {
      const { userId } = await auth();
      if (userId) {
        const dbUser = await db.user.findUnique({
          where: { clerkId: userId },
          select: { id: true },
        });
        hasValidSession = !!dbUser && dbUser.id === job.userId;
      }
    }

    if (!hasValidToken && !hasValidSession) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const expired =
      job.filesDeletedAt !== null ||
      !job.outputStorageKey ||
      Date.now() > job.createdAt.getTime() + FILE_RETENTION_MS;
    if (expired) {
      return NextResponse.json({ error: EXPIRED_MESSAGE }, { status: 410 });
    }

    let buffer: Buffer;
    try {
      buffer = await getFile(job.outputStorageKey!);
    } catch {
      return NextResponse.json({ error: EXPIRED_MESSAGE }, { status: 410 });
    }

    const fileName = job.outputFileName || "processed-image";
    const mimeType = job.outputMimeType || "application/octet-stream";

    const inline = url.searchParams.get("inline") === "true";
    const safeFileName = fileName.replace(/[^\w.\-]/g, "_");
    const disposition = inline ? "inline" : `attachment; filename="${safeFileName}"`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": disposition,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
