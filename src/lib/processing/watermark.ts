import sharp from "sharp";
import { outputFormatFor } from "@/lib/processing/format";
import { ProcessingError } from "@/lib/processing/errors";

interface WatermarkOptions {
  type: "text" | "image";
  text?: string;
  fontSize?: number;
  fontColor?: string;
  opacity: number;
  rotation: number;
  position: string; // "top-left" | ... | "bottom-right" | "tile"
  watermarkImageBuffer?: Buffer;
}

export interface WatermarkResult {
  buffer: Buffer;
  info: { format: string; width: number; height: number; size: number };
}

// DejaVu Sans is installed in the Docker image (ttf-dejavu). Arial and
// Helvetica cover Windows and macOS dev machines.
const FONT_STACK = "'DejaVu Sans', Arial, Helvetica, sans-serif";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** SVG canvas of the given size with one line of text at (x, y). */
function textSvg(opts: {
  width: number;
  height: number;
  text: string;
  fontSize: number;
  fontColor: string;
  opacity: number;
  rotation: number;
  x: number;
  y: number;
  anchor: string;
}): Buffer {
  const cx = opts.width / 2;
  const cy = opts.height / 2;
  const transform = opts.rotation ? ` transform="rotate(${opts.rotation}, ${cx}, ${cy})"` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${opts.width}" height="${opts.height}">
  <text x="${opts.x}" y="${opts.y}" text-anchor="${opts.anchor}"${transform}
    fill="${opts.fontColor}" fill-opacity="${opts.opacity}"
    font-family="${FONT_STACK}" font-size="${opts.fontSize}" font-weight="bold">${escapeXml(opts.text)}</text>
</svg>`;
  return Buffer.from(svg);
}

/** Resizes the watermark image to fit in a box and applies the opacity. */
async function imageOverlay(source: Buffer, maxWidth: number, maxHeight: number, opacity: number): Promise<Buffer> {
  return sharp(source)
    .rotate()
    .resize(Math.max(1, maxWidth), Math.max(1, maxHeight), { fit: "inside", withoutEnlargement: true })
    .ensureAlpha()
    .composite([
      {
        input: Buffer.from([0, 0, 0, Math.round(opacity * 255)]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();
}

export async function addWatermark(
  inputBuffer: Buffer,
  options: WatermarkOptions
): Promise<WatermarkResult> {
  const metadata = await sharp(inputBuffer).metadata();
  const orientedSwap = (metadata.orientation ?? 1) >= 5;
  const imgWidth = (orientedSwap ? metadata.height : metadata.width) || 800;
  const imgHeight = (orientedSwap ? metadata.width : metadata.height) || 600;

  const isText = options.type === "text";
  if (isText && !options.text?.trim()) {
    throw new ProcessingError("Enter the watermark text.");
  }
  if (!isText && !options.watermarkImageBuffer) {
    throw new ProcessingError("Upload a watermark image.");
  }

  const fontSize = options.fontSize || 48;
  const fontColor = options.fontColor || "#ffffff";
  const margin = Math.round(Math.max(12, Math.min(imgWidth, imgHeight) * 0.03));

  let overlay: sharp.OverlayOptions;

  if (options.position === "tile") {
    // Repeated pattern across the whole picture.
    const tileSize = isText
      ? Math.max(160, Math.round(fontSize * Math.max(4, (options.text!.length + 2) * 0.7)))
      : Math.max(64, Math.round(Math.min(imgWidth, imgHeight) * 0.25));

    const tile = isText
      ? textSvg({
          width: tileSize,
          height: tileSize,
          text: options.text!,
          fontSize,
          fontColor,
          opacity: options.opacity,
          rotation: options.rotation,
          x: tileSize / 2,
          y: tileSize / 2 + fontSize / 3,
          anchor: "middle",
        })
      : await imageOverlay(options.watermarkImageBuffer!, tileSize, tileSize, options.opacity);

    overlay = { input: tile, tile: true, gravity: "northwest" };
  } else if (isText) {
    // Full-size transparent canvas with the text placed at the right spot.
    overlay = {
      input: textSvg({
        width: imgWidth,
        height: imgHeight,
        text: options.text!,
        fontSize,
        fontColor,
        opacity: options.opacity,
        rotation: options.rotation,
        x: getTextX(options.position, imgWidth, margin),
        y: getTextY(options.position, imgHeight, fontSize, margin),
        anchor: getTextAnchor(options.position),
      }),
      gravity: "northwest",
    };
  } else {
    // Logo at most 30% of the picture, placed with gravity.
    const logo = await imageOverlay(
      options.watermarkImageBuffer!,
      Math.round(imgWidth * 0.3),
      Math.round(imgHeight * 0.3),
      options.opacity
    );
    overlay = { input: logo, gravity: getGravity(options.position) as sharp.Gravity };
  }

  const format = outputFormatFor(metadata.format);
  const output = await sharp(inputBuffer)
    .rotate()
    .composite([overlay])
    .toFormat(format)
    .toBuffer();
  const outInfo = await sharp(output).metadata();

  return {
    buffer: output,
    info: {
      format,
      width: outInfo.width || imgWidth,
      height: outInfo.height || imgHeight,
      size: output.length,
    },
  };
}

function getGravity(position: string): string {
  const map: Record<string, string> = {
    "top-left": "northwest",
    "top-center": "north",
    "top-right": "northeast",
    "center-left": "west",
    "center": "center",
    "center-right": "east",
    "bottom-left": "southwest",
    "bottom-center": "south",
    "bottom-right": "southeast",
  };
  return map[position] || "southeast";
}

function getTextX(position: string, width: number, margin: number): number {
  if (position.includes("left")) return margin;
  if (position.includes("right")) return width - margin;
  return width / 2;
}

function getTextY(position: string, height: number, fontSize: number, margin: number): number {
  if (position.includes("top")) return fontSize + margin;
  if (position.includes("bottom")) return height - margin;
  return height / 2 + fontSize / 3;
}

function getTextAnchor(position: string): string {
  if (position.includes("left")) return "start";
  if (position.includes("right")) return "end";
  return "middle";
}
