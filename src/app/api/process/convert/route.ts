import { createProcessHandler } from "@/lib/process-route";
import { convertSchema } from "@/lib/validation";
import { convertImage } from "@/lib/processing/convert";
import { outputFileName } from "@/lib/processing/format";
import { ProcessingType } from "@/generated/prisma";

export const POST = createProcessHandler({
  tool: "convert",
  type: ProcessingType.CONVERT,
  schema: convertSchema,
  run: async ({ file, inputBuffer, options }) => {
    const { buffer, info } = await convertImage(inputBuffer, options);
    return {
      buffer,
      format: info.format,
      width: info.width,
      height: info.height,
      fileName: outputFileName(file.name, "", info.format),
    };
  },
});
