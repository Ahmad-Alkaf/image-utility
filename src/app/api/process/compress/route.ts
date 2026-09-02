import { createProcessHandler } from "@/lib/process-route";
import { compressSchema } from "@/lib/validation";
import { compressImage } from "@/lib/processing/compress";
import { outputFileName } from "@/lib/processing/format";
import { ProcessingType } from "@/generated/prisma";

export const POST = createProcessHandler({
  tool: "compress",
  type: ProcessingType.COMPRESS,
  schema: compressSchema,
  run: async ({ file, inputBuffer, options }) => {
    const { buffer, info } = await compressImage(inputBuffer, options);
    return {
      buffer,
      format: info.format,
      width: info.width,
      height: info.height,
      fileName: outputFileName(file.name, "-compressed", info.format),
      extraMeta: { originalSize: inputBuffer.length },
    };
  },
});
