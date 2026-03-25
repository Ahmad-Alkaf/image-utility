import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getFile } from "@/lib/storage";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();

    const job = await db.processingJob.findUnique({
      where: { id },
    });

    if (!job || !job.outputStorageKey) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    if (job.userId) {
      const dbUser = userId ? await db.user.findUnique({ where: { clerkId: userId } }) : null;
      if (!dbUser || dbUser.id !== job.userId) {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    // Check if file has expired (24 hours)
    const expiryTime = new Date(job.createdAt.getTime() + 24 * 60 * 60 * 1000);
    if (new Date() > expiryTime) {
      return NextResponse.json(
        { error: "File has expired" },
        { status: 410 }
      );
    }

    const buffer = await getFile(job.outputStorageKey);
    const fileName = job.outputFileName || "processed-image";
    const mimeType = job.outputMimeType || "application/octet-stream";

    const url = new URL(req.url);
    const inline = url.searchParams.get("inline") === "true";
    const disposition = inline ? "inline" : `attachment; filename="${fileName}"`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": disposition,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Download failed" },
      { status: 500 }
    );
  }
}
