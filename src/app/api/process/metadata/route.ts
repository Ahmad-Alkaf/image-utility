import { NextResponse } from "next/server";
import { createProcessHandler } from "@/lib/process-route";
import { metadataSchema } from "@/lib/validation";
import { readMetadata, stripMetadata } from "@/lib/processing/metadata";
import { outputFileName } from "@/lib/processing/format";
import { ProcessingType } from "@/generated/prisma";

export const POST = createProcessHandler({
  tool: "metadata",
  type: ProcessingType.METADATA_STRIP,
  schema: metadataSchema,
  // "read" answers straight away: nothing is stored and no job is created.
  before: async ({ inputBuffer, options }) => {
    if (options.action !== "read") return undefined;
    const metadata = await readMetadata(inputBuffer);
    return NextResponse.json({ metadata });
  },
  run: async ({ file, inputBuffer }) => {
    const { buffer, info } = await stripMetadata(inputBuffer);
    return {
      buffer,
      format: info.format,
      width: info.width,
      height: info.height,
      fileName: outputFileName(file.name, "-clean", info.format),
    };
  },
});
