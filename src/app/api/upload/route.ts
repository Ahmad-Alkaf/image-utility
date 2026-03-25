import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateStorageKey, storeFile } from "@/lib/storage";
import { UPLOAD_LIMITS, ACCEPTED_IMAGE_TYPES } from "@/lib/constants";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const ip = getClientIp(req);
    const rateLimitId = userId || ip;
    const rateLimit = checkRateLimit(rateLimitId, !!userId);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    const limits = userId ? UPLOAD_LIMITS.authenticated : UPLOAD_LIMITS.anonymous;
    const maxFileSize = limits.maxFileSize;

    if (files.length > limits.maxFiles) {
      return NextResponse.json(
        { error: `Too many files. Maximum ${limits.maxFiles} files allowed.` },
        { status: 400 }
      );
    }
    const results = [];

    for (const file of files) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Unsupported file type: ${file.type}` },
          { status: 400 }
        );
      }

      if (file.size > maxFileSize) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds ${maxFileSize / (1024 * 1024)}MB limit` },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const storageKey = generateStorageKey(file.name, "input");
      await storeFile(storageKey, buffer, file.type);

      results.push({
        storageKey,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });
    }

    return NextResponse.json({ files: results });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
