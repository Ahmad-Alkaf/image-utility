import { removeBackground } from "@imgly/background-removal";
import sharp from "sharp";

export async function removeImageBackground(
  inputBuffer: Buffer,
  options: { background: "transparent" | "color" | "blur"; backgroundColor?: string; blurAmount?: number }
): Promise<{ buffer: Buffer; info: { format: string; width: number; height: number; size: number } }> {
  // Convert input to blob for @imgly/background-removal
  const blob = new Blob([new Uint8Array(inputBuffer)]);
  const resultBlob = await removeBackground(blob);
  const resultBuffer = Buffer.from(await resultBlob.arrayBuffer());

  let pipeline = sharp(resultBuffer);
  const metadata = await pipeline.metadata();

  if (options.background === "color" && options.backgroundColor) {
    // Flatten transparent onto solid color
    pipeline = sharp(resultBuffer).flatten({ background: options.backgroundColor });
  } else if (options.background === "blur") {
    // Create blurred version of original, composite the foreground on top
    const blurredBg = await sharp(inputBuffer)
      .blur(options.blurAmount || 20)
      .toBuffer();
    pipeline = sharp(blurredBg).composite([{ input: resultBuffer }]);
  }
  // For transparent, just output as PNG

  const output = await pipeline.png().toBuffer();
  const info = await sharp(output).metadata();

  return {
    buffer: output,
    info: {
      format: "png",
      width: info.width || metadata.width || 0,
      height: info.height || metadata.height || 0,
      size: output.length,
    },
  };
}
