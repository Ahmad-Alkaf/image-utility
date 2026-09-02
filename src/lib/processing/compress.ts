import sharp from "sharp";
import { outputFormatFor } from "@/lib/processing/format";
import type { ImageFormat } from "@/types";

interface CompressOptions {
  mode: "auto" | "manual";
  quality: number;
  format?: string;
}

export interface CompressResult {
  buffer: Buffer;
  info: { format: string; width: number; height: number; size: number };
}

/** Encoder options for one format at one quality level. */
function encoderOptions(format: ImageFormat, quality: number) {
  switch (format) {
    case "png":
      // Palette quantization (like pngquant) is what actually shrinks a PNG.
      // Full quality keeps the file lossless.
      return quality >= 100
        ? { compressionLevel: 9, effort: 10 }
        : { compressionLevel: 9, palette: true, quality, effort: 7 };
    case "jpeg":
      return { quality, mozjpeg: true };
    case "webp":
      return { quality, effort: 5 };
    case "avif":
      return { quality, effort: 4 };
    case "tiff":
      return { quality };
    case "gif":
      return { colours: Math.max(2, Math.round((quality / 100) * 256)) };
  }
}

async function encode(input: Buffer, format: ImageFormat, quality: number): Promise<Buffer> {
  return sharp(input).rotate().toFormat(format, encoderOptions(format, quality)).toBuffer();
}

export async function compressImage(
  inputBuffer: Buffer,
  options: CompressOptions
): Promise<CompressResult> {
  const metadata = await sharp(inputBuffer).metadata();
  const inputFormat = outputFormatFor(metadata.format);
  const targetFormat = (options.format as ImageFormat | undefined) || inputFormat;

  let output: Buffer;

  if (options.mode === "auto") {
    // Try a good default first; step down once when it barely helped.
    output = await encode(inputBuffer, targetFormat, 82);
    if (output.length > inputBuffer.length * 0.9) {
      output = await encode(inputBuffer, targetFormat, 70);
    }

    // Never hand back something bigger than the original when the format
    // did not change.
    if (targetFormat === inputFormat && output.length >= inputBuffer.length) {
      return {
        buffer: inputBuffer,
        info: {
          format: inputFormat,
          width: metadata.width || 0,
          height: metadata.height || 0,
          size: inputBuffer.length,
        },
      };
    }
  } else {
    output = await encode(inputBuffer, targetFormat, options.quality);
  }

  const info = await sharp(output).metadata();
  return {
    buffer: output,
    info: {
      format: targetFormat,
      width: info.width || metadata.width || 0,
      height: info.height || metadata.height || 0,
      size: output.length,
    },
  };
}
