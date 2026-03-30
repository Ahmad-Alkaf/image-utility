import sharp from "sharp";

interface CompressOptions {
  mode: "auto" | "manual";
  quality: number;
  format?: string;
}

export async function compressImage(inputBuffer: Buffer, options: CompressOptions): Promise<{ buffer: Buffer; info: { format: string; width: number; height: number; size: number } }> {
  const metadata = await sharp(inputBuffer).metadata();
  const inputFormat = metadata.format || "jpeg";
  const targetFormat = (options.format || inputFormat) as keyof sharp.FormatEnum;

  const quality = options.quality;

  const formatOptions = (q: number) => {
    if (targetFormat === "png") {
      return { compressionLevel: Math.round((1 - q / 100) * 9) };
    }
    return { quality: q };
  };

  if (options.mode === "auto") {
    // Smart compression: find optimal quality that reduces size significantly
    // Start at 85, try to achieve at least 30% reduction
    let bestBuffer = await sharp(inputBuffer).toFormat(targetFormat, formatOptions(85)).toBuffer();
    const reductionRatio = bestBuffer.length / inputBuffer.length;

    if (reductionRatio > 0.9) {
      // Not enough reduction, try lower quality
      bestBuffer = await sharp(inputBuffer).toFormat(targetFormat, formatOptions(70)).toBuffer();
    }

    // If output is not smaller, return the original to avoid enlargement
    if (bestBuffer.length >= inputBuffer.length) {
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

    const info = await sharp(bestBuffer).metadata();
    return {
      buffer: bestBuffer,
      info: {
        format: targetFormat,
        width: info.width || metadata.width || 0,
        height: info.height || metadata.height || 0,
        size: bestBuffer.length,
      },
    };
  }

  // Manual mode
  const output = await sharp(inputBuffer).toFormat(targetFormat, formatOptions(quality)).toBuffer();
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
