import sharp from "sharp";

interface FilterOptions {
  brightness: number;    // -100 to 100
  contrast: number;      // -100 to 100
  saturation: number;    // -100 to 100
  hue: number;           // 0 to 360
  sharpness: number;     // 0 to 100
  blur: number;          // 0 to 100
  gamma: number;         // 0.1 to 3
  preset?: "grayscale" | "sepia" | "invert" | "vintage" | "cool" | "warm";
}

export async function applyFilters(inputBuffer: Buffer, options: FilterOptions): Promise<{ buffer: Buffer; info: { format: string; width: number; height: number; size: number } }> {
  const metadata = await sharp(inputBuffer).metadata();
  let pipeline = sharp(inputBuffer);

  // Compute base modulate values from slider adjustments
  let baseBrightness = 1 + options.brightness / 100;
  let baseSaturation = 1 + options.saturation / 100;
  let baseHue = options.hue;

  // Apply preset first if specified
  if (options.preset) {
    switch (options.preset) {
      case "grayscale":
        pipeline = pipeline.grayscale();
        break;
      case "sepia":
        pipeline = pipeline.tint({ r: 112, g: 66, b: 20 });
        break;
      case "invert":
        pipeline = pipeline.negate();
        break;
      case "vintage":
        baseBrightness *= 1.1;
        baseSaturation *= 0.7;
        pipeline = pipeline.tint({ r: 120, g: 100, b: 80 });
        break;
      case "cool":
        pipeline = pipeline.tint({ r: 80, g: 100, b: 140 });
        break;
      case "warm":
        pipeline = pipeline.tint({ r: 140, g: 110, b: 80 });
        break;
    }
  }

  // Apply combined modulate (preset + slider adjustments merged into one call)
  if (baseBrightness !== 1 || baseSaturation !== 1 || baseHue !== 0) {
    pipeline = pipeline.modulate({
      brightness: baseBrightness,
      saturation: baseSaturation,
      hue: baseHue,
    });
  }

  // Contrast via linear adjustment
  if (options.contrast !== 0) {
    const a = 1 + options.contrast / 100;
    const b = 128 * (1 - a);
    pipeline = pipeline.linear(a, b);
  }

  // Gamma
  if (options.gamma !== 1) {
    pipeline = pipeline.gamma(options.gamma);
  }

  // Sharpen
  if (options.sharpness > 0) {
    pipeline = pipeline.sharpen({ sigma: options.sharpness / 10 });
  }

  // Blur
  if (options.blur > 0) {
    const sigma = Math.max(0.3, options.blur / 5);
    pipeline = pipeline.blur(sigma);
  }

  const format = metadata.format || "png";
  const output = await pipeline.toFormat(format as keyof sharp.FormatEnum).toBuffer();
  const info = await sharp(output).metadata();

  return {
    buffer: output,
    info: {
      format,
      width: info.width || metadata.width || 0,
      height: info.height || metadata.height || 0,
      size: output.length,
    },
  };
}
