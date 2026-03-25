import sharp from "sharp";

interface ResizeOptions {
  mode: "exact" | "percentage" | "crop";
  width?: number;
  height?: number;
  percentage?: number;
  lockAspectRatio: boolean;
  cropArea?: { x: number; y: number; width: number; height: number };
}

export async function resizeImage(inputBuffer: Buffer, options: ResizeOptions): Promise<{ buffer: Buffer; info: { format: string; width: number; height: number; size: number } }> {
  const metadata = await sharp(inputBuffer).metadata();
  let pipeline = sharp(inputBuffer);

  if (options.mode === "crop" && !options.cropArea) {
    throw new Error("Crop mode requires a crop area");
  }

  if (options.mode === "crop" && options.cropArea) {
    const imgW = metadata.width || 0;
    const imgH = metadata.height || 0;
    const cropLeft = Math.round(options.cropArea.x);
    const cropTop = Math.round(options.cropArea.y);
    const cropWidth = Math.round(options.cropArea.width);
    const cropHeight = Math.round(options.cropArea.height);
    if (cropLeft + cropWidth > imgW || cropTop + cropHeight > imgH) {
      throw new Error("Crop area exceeds image dimensions");
    }
    pipeline = pipeline.extract({
      left: cropLeft,
      top: cropTop,
      width: cropWidth,
      height: cropHeight,
    });
  } else if (options.mode === "percentage" && options.percentage) {
    if (!metadata.width || !metadata.height) {
      throw new Error("Cannot determine image dimensions for percentage resize");
    }
    const scale = options.percentage / 100;
    const newWidth = Math.round(metadata.width * scale);
    const newHeight = Math.round(metadata.height * scale);
    pipeline = pipeline.resize(newWidth, newHeight, { fit: "fill" });
  } else if (options.mode === "exact") {
    if (!options.width && !options.height) {
      throw new Error("At least one of width or height must be provided for exact resize");
    }
    pipeline = pipeline.resize(options.width, options.height, {
      fit: options.lockAspectRatio ? "inside" : "fill",
      withoutEnlargement: false,
    });
  }

  const format = metadata.format || "png";
  const output = await pipeline.toFormat(format as keyof sharp.FormatEnum).toBuffer();
  const info = await sharp(output).metadata();

  return {
    buffer: output,
    info: {
      format: format,
      width: info.width || 0,
      height: info.height || 0,
      size: output.length,
    },
  };
}
