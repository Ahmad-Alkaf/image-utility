import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { generateStorageKey, storeFile } from "@/lib/storage";
import { checkRateLimit } from "@/lib/rate-limit";
import { watermarkSchema } from "@/lib/validation";
import { addWatermark } from "@/lib/processing/watermark";
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";
import { ProcessingType, ProcessingStatus } from "@/generated/prisma";

export async function POST(request: NextRequest) {
  let jobId: string | undefined;
  const startTime = Date.now();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Sign in required for watermark tool" },
        { status: 401 }
      );
    }

    const rateLimitResult = checkRateLimit(userId, true);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("files") as File | null;
    const watermarkImageFile = formData.get("watermarkImage") as File | null;
    const optionsRaw = formData.get("options") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 50MB limit" }, { status: 400 });
    }
    if (!optionsRaw) {
      return NextResponse.json({ error: "No options provided" }, { status: 400 });
    }

    const parsedOptions = watermarkSchema.parse(JSON.parse(optionsRaw));
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const inputStorageKey = generateStorageKey(file.name, "input");
    await storeFile(inputStorageKey, inputBuffer, file.type);

    const job = await db.processingJob.create({
      data: {
        userId,
        type: ProcessingType.WATERMARK,
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

    let watermarkImageBuffer: Buffer | undefined;
    if (parsedOptions.type === "image" && watermarkImageFile) {
      watermarkImageBuffer = Buffer.from(await watermarkImageFile.arrayBuffer());
    }

    const { buffer: outputBuffer, info } = await addWatermark(inputBuffer, {
      type: parsedOptions.type,
      text: parsedOptions.text,
      fontSize: parsedOptions.fontSize,
      fontColor: parsedOptions.fontColor,
      opacity: parsedOptions.opacity,
      rotation: parsedOptions.rotation,
      position: parsedOptions.position,
      watermarkImageBuffer,
    });

    const outputFileName = file.name.replace(/\.[^.]+$/, `-watermarked.${info.format}`);
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
    console.error("Watermark error:", error);
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
