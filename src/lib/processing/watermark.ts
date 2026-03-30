import sharp from "sharp";

interface WatermarkOptions {
  type: "text" | "image";
  text?: string;
  fontSize?: number;
  fontColor?: string;
  opacity: number;
  rotation: number;
  position: string; // "top-left" | "top-center" | "top-right" | "center-left" | "center" | "center-right" | "bottom-left" | "bottom-center" | "bottom-right" | "tile"
  watermarkImageBuffer?: Buffer;
}

export async function addWatermark(inputBuffer: Buffer, options: WatermarkOptions): Promise<{ buffer: Buffer; info: { format: string; width: number; height: number; size: number } }> {
  const metadata = await sharp(inputBuffer).metadata();
  const imgWidth = metadata.width || 800;
  const imgHeight = metadata.height || 600;

  let overlayBuffer: Buffer;

  if (options.type === "text" && options.text) {
    const fontSize = options.fontSize || 48;
    const fontColor = options.fontColor || "#ffffff";

    // Create SVG text overlay
    const escapedText = options.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const svgText = `<svg width="${imgWidth}" height="${imgHeight}">
      <style>
        .watermark {
          fill: ${fontColor};
          opacity: ${options.opacity};
          font-size: ${fontSize}px;
          font-family: Arial, sans-serif;
          font-weight: bold;
        }
      </style>
      <text class="watermark"
        x="${getTextX(options.position, imgWidth)}"
        y="${getTextY(options.position, imgHeight, fontSize)}"
        text-anchor="${getTextAnchor(options.position)}"
        ${options.rotation ? `transform="rotate(${options.rotation}, ${imgWidth/2}, ${imgHeight/2})"` : ""}
      >${escapedText}</text>
    </svg>`;

    overlayBuffer = Buffer.from(svgText);
  } else if (options.type === "image" && options.watermarkImageBuffer) {
    // Resize watermark image and adjust opacity
    const maxWatermarkWidth = Math.round(imgWidth * 0.3);
    const maxWatermarkHeight = Math.round(imgHeight * 0.3);

    overlayBuffer = await sharp(options.watermarkImageBuffer)
      .resize(maxWatermarkWidth, maxWatermarkHeight, { fit: "inside" })
      .ensureAlpha()
      .composite([{
        input: Buffer.from([0, 0, 0, Math.round(options.opacity * 255)]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: "dest-in",
      }])
      .toBuffer();
  } else {
    // No watermark to apply
    const output = await sharp(inputBuffer).toBuffer();
    return { buffer: output, info: { format: metadata.format || "png", width: imgWidth, height: imgHeight, size: output.length } };
  }

  const gravity = getGravity(options.position);

  let pipeline = sharp(inputBuffer);

  if (options.position === "tile") {
    // For tile mode, create a repeated pattern
    const tileSize = 200;
    let tileBuffer: Buffer;
    if (options.type === "text" && options.text) {
      const fontSize = options.fontSize || 48;
      const fontColor = options.fontColor || "#ffffff";
      const escapedText = options.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const tileSvg = `<svg width="${tileSize}" height="${tileSize}">
        <style>
          .watermark {
            fill: ${fontColor};
            opacity: ${options.opacity};
            font-size: ${fontSize}px;
            font-family: Arial, sans-serif;
            font-weight: bold;
          }
        </style>
        <text class="watermark"
          x="${tileSize / 2}"
          y="${tileSize / 2 + fontSize / 3}"
          text-anchor="middle"
          ${options.rotation ? `transform="rotate(${options.rotation}, ${tileSize / 2}, ${tileSize / 2})"` : ""}
        >${escapedText}</text>
      </svg>`;
      tileBuffer = Buffer.from(tileSvg);
    } else if (options.type === "image" && options.watermarkImageBuffer) {
      tileBuffer = await sharp(options.watermarkImageBuffer)
        .resize(tileSize, tileSize, { fit: "inside" })
        .ensureAlpha()
        .composite([{
          input: Buffer.from([0, 0, 0, Math.round(options.opacity * 255)]),
          raw: { width: 1, height: 1, channels: 4 },
          tile: true,
          blend: "dest-in",
        }])
        .toBuffer();
    } else {
      // No valid watermark source for tiling — return the image unmodified
      const output = await sharp(inputBuffer).toBuffer();
      return { buffer: output, info: { format: metadata.format || "png", width: imgWidth, height: imgHeight, size: output.length } };
    }

    pipeline = pipeline.composite([{
      input: tileBuffer,
      tile: true,
      gravity: "northwest",
    }]);
  } else if (options.type === "text") {
    // Text SVG overlay is already full-size with positioned text — use northwest for 1:1 alignment
    pipeline = pipeline.composite([{
      input: overlayBuffer,
      gravity: "northwest" as sharp.Gravity,
    }]);
  } else {
    // Image watermark is smaller — use gravity for positioning
    pipeline = pipeline.composite([{
      input: overlayBuffer,
      gravity: gravity as sharp.Gravity,
    }]);
  }

  const format = metadata.format || "png";
  const output = await pipeline.toFormat(format as keyof sharp.FormatEnum).toBuffer();
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

function getTextX(position: string, width: number): number {
  if (position.includes("left")) return 20;
  if (position.includes("right")) return width - 20;
  return width / 2;
}

function getTextY(position: string, height: number, fontSize: number): number {
  if (position.includes("top")) return fontSize + 20;
  if (position.includes("bottom")) return height - 20;
  return height / 2 + fontSize / 3;
}

function getTextAnchor(position: string): string {
  if (position.includes("left")) return "start";
  if (position.includes("right")) return "end";
  return "middle";
}
