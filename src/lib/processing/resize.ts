import sharp from "sharp";
import { ProcessingError } from "@/lib/processing/errors";
import { outputFormatFor } from "@/lib/processing/format";

interface ResizeOptions {
  mode: "exact" | "percentage" | "crop";
  width?: number;
  height?: number;
  percentage?: number;
  lockAspectRatio: boolean;
  cropArea?: { x: number; y: number; width: number; height: number };
}

export interface ResizeResult {
  buffer: Buffer;
  info: { format: string; width: number; height: number; size: number };
}

export async function resizeImage(
  inputBuffer: Buffer,
  options: ResizeOptions
): Promise<ResizeResult> {
  const metadata = await sharp(inputBuffer).metadata();
  // Apply the EXIF orientation first so crop coordinates match what the
  // user saw in the browser.
  let pipeline = sharp(inputBuffer).rotate();
  const orientedSwap = (metadata.orientation ?? 1) >= 5;
  const imgW = (orientedSwap ? metadata.height : metadata.width) || 0;
  const imgH = (orientedSwap ? metadata.width : metadata.height) || 0;

  if (options.mode === "crop") {
    if (!options.cropArea) {
      throw new ProcessingError("Select a crop area first.");
    }
    const cropLeft = Math.round(options.cropArea.x);
    const cropTop = Math.round(options.cropArea.y);
    const cropWidth = Math.round(options.cropArea.width);
    const cropHeight = Math.round(options.cropArea.height);
    if (cropLeft + cropWidth > imgW || cropTop + cropHeight > imgH) {
      throw new ProcessingError("The crop area is outside the image.");
    }
    pipeline = pipeline.extract({
      left: cropLeft,
      top: cropTop,
      width: cropWidth,
      height: cropHeight,
    });
  } else if (options.mode === "percentage") {
    if (!options.percentage) {
      throw new ProcessingError("Enter a scale percentage.");
    }
    if (!imgW || !imgH) {
      throw new ProcessingError("The image dimensions could not be read.");
    }
    const scale = options.percentage / 100;
    const newWidth = Math.max(1, Math.round(imgW * scale));
    const newHeight = Math.max(1, Math.round(imgH * scale));
    pipeline = pipeline.resize(newWidth, newHeight, { fit: "fill" });
  } else {
    if (!options.width && !options.height) {
      throw new ProcessingError("Enter a width, a height, or both.");
    }
    pipeline = pipeline.resize(options.width, options.height, {
      fit: options.lockAspectRatio ? "inside" : "fill",
      withoutEnlargement: false,
    });
  }

  const format = outputFormatFor(metadata.format);
  const output = await pipeline.toFormat(format).toBuffer();
  const info = await sharp(output).metadata();

  return {
    buffer: output,
    info: {
      format,
      width: info.width || 0,
      height: info.height || 0,
      size: output.length,
    },
  };
}
