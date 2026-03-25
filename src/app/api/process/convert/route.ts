import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { generateStorageKey, storeFile } from "@/lib/storage";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { convertSchema } from "@/lib/validation";
import { convertImage } from "@/lib/processing/convert";
import { ACCEPTED_IMAGE_TYPES, UPLOAD_LIMITS, FORMAT_MIME_TYPES } from "@/lib/constants";
import { ProcessingType, ProcessingStatus } from "@/generated/prisma";

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
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }
    const maxFileSize = userId ? UPLOAD_LIMITS.authenticated.maxFileSize : UPLOAD_LIMITS.anonymous.maxFileSize;
    if (file.size > maxFileSize) {
      return NextResponse.json({ error: `File exceeds ${maxFileSize / (1024 * 1024)}MB limit` }, { status: 400 });
    }
    if (!optionsRaw) {
      return NextResponse.json({ error: "No options provided" }, { status: 400 });
    }

    const parsedOptions = convertSchema.parse(JSON.parse(optionsRaw));
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const inputStorageKey = generateStorageKey(file.name, "input");
    await storeFile(inputStorageKey, inputBuffer, file.type);

    const job = await db.processingJob.create({
      data: {
        userId: userId || undefined,
        type: ProcessingType.CONVERT,
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

    const { buffer: outputBuffer, info } = await convertImage(inputBuffer, {
      format: parsedOptions.format,
      quality: parsedOptions.quality,
      stripMetadata: parsedOptions.stripMetadata,
    });

    const outputFileName = file.name.replace(/\.[^.]+$/, `.${parsedOptions.format}`);
    const outputStorageKey = generateStorageKey(outputFileName, "output");
    const outputMimeType = FORMAT_MIME_TYPES[parsedOptions.format as keyof typeof FORMAT_MIME_TYPES] || `image/${parsedOptions.format}`;
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
      downloadUrl: `/api/download/${jobId}`,
      outputMeta: {
        fileName: outputFileName,
        fileSize: outputBuffer.length,
        mimeType: outputMimeType,
        width: info.width,
        height: info.height,
      },
    });
  } catch (error) {
    console.error("Convert error:", error);
    if (jobId) {
      await db.processingJob.update({
        where: { id: jobId },
        data: {
          status: ProcessingStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        },
      }).catch(console.error);
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Processing failed" },
      { status: 500 }
    );
  }
}
