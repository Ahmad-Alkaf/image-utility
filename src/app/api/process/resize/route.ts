import { createProcessHandler } from "@/lib/process-route";
import { resizeSchema } from "@/lib/validation";
import { resizeImage } from "@/lib/processing/resize";
import { outputFileName } from "@/lib/processing/format";
import { ProcessingType } from "@/generated/prisma";

export const POST = createProcessHandler({
  tool: "resize",
  type: ProcessingType.RESIZE,
  schema: resizeSchema,
  run: async ({ file, inputBuffer, options }) => {
    const { buffer, info } = await resizeImage(inputBuffer, options);
    const suffix = options.mode === "crop" ? "-cropped" : "-resized";
    return {
      buffer,
      format: info.format,
      width: info.width,
      height: info.height,
      fileName: outputFileName(file.name, suffix, info.format),
    };
  },
});
