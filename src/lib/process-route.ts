import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ZodError } from "zod";
import { db } from "@/lib/db";
import { syncUser } from "@/lib/auth";
import { generateStorageKey, storeFile } from "@/lib/storage";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { TOOL_ACCEPTED_TYPES, UPLOAD_LIMITS, type ToolId } from "@/lib/constants";
import { mimeTypeFor } from "@/lib/processing/format";
import {
  ProcessingError,
  isInputImageError,
  INPUT_IMAGE_ERROR_MESSAGE,
} from "@/lib/processing/errors";
import { ProcessingType, ProcessingStatus } from "@/generated/prisma";

/** What a tool's `run` function returns. */
export interface ProcessedOutput {
  buffer: Buffer;
  /** Output format name, e.g. "jpeg", "png", "webp". */
  format: string;
  width: number;
  height: number;
  /** File name offered to the user for download. */
  fileName: string;
  /** Extra fields merged into `outputMeta` in the response. */
  extraMeta?: Record<string, unknown>;
}

export interface ProcessContext<TOptions> {
  file: File;
  inputBuffer: Buffer;
  options: TOptions;
  formData: FormData;
  userId: string | null;
  /** Upload limits that apply to this caller (anonymous or signed in). */
  limits: (typeof UPLOAD_LIMITS)[keyof typeof UPLOAD_LIMITS];
}

export interface ProcessRouteConfig<TOptions> {
  tool: ToolId;
  type: ProcessingType;
  /** Zod schema for the JSON in the "options" form field. */
  schema: { parse(data: unknown): TOptions };
  /** When true, anonymous callers get 401. */
  requiresAuth?: boolean;
  /**
   * Optional hook that runs after validation but before anything is stored.
   * Return a response to answer without creating a job (used by the
   * metadata "read" action).
   */
  before?: (ctx: ProcessContext<TOptions>) => Promise<NextResponse | undefined>;
  /** Does the image work. Throw ProcessingError for user-facing failures. */
  run: (ctx: ProcessContext<TOptions>) => Promise<ProcessedOutput>;
}

const RATE_LIMIT_MESSAGE =
  "You have reached the hourly limit. Sign in for a higher limit, or try again later.";

function megabytes(bytes: number): number {
  return Math.round(bytes / (1024 * 1024));
}

/**
 * Builds the POST handler shared by every server-side tool:
 * auth, rate limit, file validation, storage, job bookkeeping, and
 * consistent error responses.
 */
export function createProcessHandler<TOptions>(config: ProcessRouteConfig<TOptions>) {
  return async function POST(request: NextRequest): Promise<NextResponse> {
    let jobId: string | undefined;
    const startTime = Date.now();

    try {
      const { userId } = await auth();
      if (config.requiresAuth && !userId) {
        return NextResponse.json(
          { error: "Please sign in to use this tool." },
          { status: 401 }
        );
      }

      const identifier = userId || getClientIp(request);
      const rateLimit = checkRateLimit(identifier, !!userId);
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: RATE_LIMIT_MESSAGE },
          {
            status: 429,
            headers: {
              "Retry-After": String(Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))),
            },
          }
        );
      }

      const formData = await request.formData();
      const file = formData.get("files");
      const optionsRaw = formData.get("options");

      if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file was received." }, { status: 400 });
      }
      if (!TOOL_ACCEPTED_TYPES[config.tool].includes(file.type)) {
        return NextResponse.json(
          { error: "This file type is not supported by this tool." },
          { status: 400 }
        );
      }
      const limits = userId ? UPLOAD_LIMITS.authenticated : UPLOAD_LIMITS.anonymous;
      if (file.size > limits.maxFileSize) {
        return NextResponse.json(
          {
            error: `The file is larger than the ${megabytes(limits.maxFileSize)} MB limit${userId ? "" : ". Sign in to upload files up to " + megabytes(UPLOAD_LIMITS.authenticated.maxFileSize) + " MB"}.`,
          },
          { status: 400 }
        );
      }
      if (file.size === 0) {
        return NextResponse.json({ error: "The file is empty." }, { status: 400 });
      }
      if (typeof optionsRaw !== "string" || !optionsRaw) {
        return NextResponse.json({ error: "No options were received." }, { status: 400 });
      }

      const options = config.schema.parse(JSON.parse(optionsRaw));
      const inputBuffer = Buffer.from(await file.arrayBuffer());
      const ctx: ProcessContext<TOptions> = { file, inputBuffer, options, formData, userId, limits };

      if (config.before) {
        const early = await config.before(ctx);
        if (early) return early;
      }

      const inputStorageKey = generateStorageKey(file.name, "input");
      await storeFile(inputStorageKey, inputBuffer, file.type);

      const dbUser = userId ? await syncUser(userId) : null;

      const job = await db.processingJob.create({
        data: {
          userId: dbUser?.id,
          type: config.type,
          status: ProcessingStatus.PROCESSING,
          inputFileName: file.name,
          inputFileSize: file.size,
          inputMimeType: file.type,
          inputStorageKey,
          options: JSON.parse(JSON.stringify(options)),
        },
      });
      jobId = job.id;

      const output = await config.run(ctx);

      const outputMimeType = mimeTypeFor(output.format);
      const outputStorageKey = generateStorageKey(output.fileName, "output");
      await storeFile(outputStorageKey, output.buffer, outputMimeType);

      await db.processingJob.update({
        where: { id: jobId },
        data: {
          status: ProcessingStatus.COMPLETED,
          outputFileName: output.fileName,
          outputFileSize: output.buffer.length,
          outputMimeType,
          outputStorageKey,
          processingTimeMs: Date.now() - startTime,
          completedAt: new Date(),
        },
      });

      return NextResponse.json({
        jobId,
        downloadUrl: `/api/download/${jobId}?token=${job.downloadToken}`,
        outputMeta: {
          fileName: output.fileName,
          fileSize: output.buffer.length,
          mimeType: outputMimeType,
          width: output.width,
          height: output.height,
          ...output.extraMeta,
        },
      });
    } catch (error) {
      console.error(`[${config.tool}] error:`, error);

      if (jobId) {
        await db.processingJob
          .update({
            where: { id: jobId },
            data: {
              status: ProcessingStatus.FAILED,
              errorMessage: error instanceof Error ? error.message.slice(0, 500) : "Unknown error",
            },
          })
          .catch(console.error);
      }

      if (error instanceof ZodError || error instanceof SyntaxError) {
        return NextResponse.json({ error: "The options are not valid." }, { status: 400 });
      }
      if (error instanceof ProcessingError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (isInputImageError(error)) {
        return NextResponse.json({ error: INPUT_IMAGE_ERROR_MESSAGE }, { status: 400 });
      }
      return NextResponse.json(
        { error: "Processing failed. Please try again." },
        { status: 500 }
      );
    }
  };
}
