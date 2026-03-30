import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { syncUser } from "@/lib/auth";
import { generateStorageKey, storeFile } from "@/lib/storage";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { resizeSchema } from "@/lib/validation";
import { resizeImage } from "@/lib/processing/resize";
import { TOOL_ACCEPTED_TYPES, UPLOAD_LIMITS } from "@/lib/constants";
import { ProcessingType, ProcessingStatus } from "@/generated/prisma";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  let jobId: string | undefined;
  const startTime = Date.now();

  try {
    const { userId } = await auth();
    const clientIp = getClientIp(request);
    const identifier = userId || clientIp;
    const rateLimitResult = checkRateLimit(identifier, !!userId);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("files") as File | null;
    const optionsRaw = formData.get("options") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!TOOL_ACCEPTED_TYPES.resize.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }
    const maxFileSize = userId ? UPLOAD_LIMITS.authenticated.maxFileSize : UPLOAD_LIMITS.anonymous.maxFileSize;
    if (file.size > maxFileSize) {
      return NextResponse.json({ error: `File exceeds ${maxFileSize / (1024 * 1024)}MB limit` }, { status: 400 });
    }
    if (!optionsRaw) {
      return NextResponse.json({ error: "No options provided" }, { status: 400 });
    }

    const parsedOptions = resizeSchema.parse(JSON.parse(optionsRaw));
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const inputStorageKey = generateStorageKey(file.name, "input");
    await storeFile(inputStorageKey, inputBuffer, file.type);

    const dbUser = userId ? await syncUser(userId) : null;

    const job = await db.processingJob.create({
      data: {
        userId: dbUser?.id,
        type: ProcessingType.RESIZE,
        status: ProcessingStatus.PENDING,
        inputFileName: file.name,
        inputFileSize: file.size,
        inputMimeType: file.type,
        inputStorageKey,
        options: JSON.parse(JSON.stringify(parsedOptions)),
      },
    });
    jobId = job.id;

    await db.processingJob.update({
      where: { id: jobId },
      data: { status: ProcessingStatus.PROCESSING },
    });

    const { buffer: outputBuffer, info } = await resizeImage(inputBuffer, {
      mode: parsedOptions.mode,
      width: parsedOptions.width,
      height: parsedOptions.height,
      percentage: parsedOptions.percentage,
      lockAspectRatio: parsedOptions.lockAspectRatio,
      cropArea: parsedOptions.cropArea,
    });

    const outputFileName = file.name.replace(/\.[^.]+$/, `-resized.${info.format}`);
    const outputStorageKey = generateStorageKey(outputFileName, "output");
    const outputMimeType = `image/${info.format === "jpg" ? "jpeg" : info.format}`;
    await storeFile(outputStorageKey, outputBuffer, outputMimeType);

    const processingTimeMs = Date.now() - startTime;

    await db.processingJob.update({
      where: { id: jobId },
      data: {
        status: ProcessingStatus.COMPLETED,
        outputFileName,
        outputFileSize: outputBuffer.length,
        outputMimeType,
        outputStorageKey,
        processingTimeMs,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      jobId,
      downloadUrl: `/api/download/${jobId}?token=${job.downloadToken}`,
      outputMeta: {
        fileName: outputFileName,
        fileSize: outputBuffer.length,
        mimeType: outputMimeType,
        width: info.width,
        height: info.height,
      },
    });
  } catch (error) {
    console.error("Resize error:", error);
    if (jobId) {
      await db.processingJob.update({
        where: { id: jobId },
        data: {
          status: ProcessingStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        },
      }).catch(console.error);
    }
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid options" }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Processing failed" },
      { status: 500 }
    );
  }
}
