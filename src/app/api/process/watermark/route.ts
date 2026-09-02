import { createProcessHandler } from "@/lib/process-route";
import { watermarkSchema } from "@/lib/validation";
import { addWatermark } from "@/lib/processing/watermark";
import { outputFileName } from "@/lib/processing/format";
import { ProcessingError } from "@/lib/processing/errors";
import { TOOL_ACCEPTED_TYPES } from "@/lib/constants";
import { ProcessingType } from "@/generated/prisma";

const MAX_WATERMARK_IMAGE_BYTES = 10 * 1024 * 1024;

export const POST = createProcessHandler({
  tool: "watermark",
  type: ProcessingType.WATERMARK,
  schema: watermarkSchema,
  requiresAuth: true,
  run: async ({ file, inputBuffer, options, formData }) => {
    let watermarkImageBuffer: Buffer | undefined;
    if (options.type === "image") {
      const watermarkImage = formData.get("watermarkImage");
      if (!(watermarkImage instanceof File) || watermarkImage.size === 0) {
        throw new ProcessingError("Upload a watermark image.");
      }
      if (!TOOL_ACCEPTED_TYPES.watermark.includes(watermarkImage.type)) {
        throw new ProcessingError("The watermark image must be a PNG, JPEG, WebP, AVIF, TIFF, or GIF file.");
      }
      if (watermarkImage.size > MAX_WATERMARK_IMAGE_BYTES) {
        throw new ProcessingError("The watermark image must be 10 MB or smaller.");
      }
      watermarkImageBuffer = Buffer.from(await watermarkImage.arrayBuffer());
    }

    const { buffer, info } = await addWatermark(inputBuffer, {
      ...options,
      watermarkImageBuffer,
    });
    return {
      buffer,
      format: info.format,
      width: info.width,
      height: info.height,
      fileName: outputFileName(file.name, "-watermarked", info.format),
    };
  },
});
