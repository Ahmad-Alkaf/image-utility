import sharp from "sharp";
import ExifReader from "exif-reader";

interface MetadataResult {
  format: string;
  width: number;
  height: number;
  size: number;
  space: string;
  channels: number;
  depth: string;
  density?: number;
  hasAlpha: boolean;
  exif: Record<string, unknown>;
  gps?: { latitude: number; longitude: number };
}

export async function readMetadata(
  inputBuffer: Buffer
): Promise<MetadataResult> {
  const metadata = await sharp(inputBuffer).metadata();

  const exif: Record<string, unknown> = {};
  let gps: { latitude: number; longitude: number } | undefined;

  if (metadata.exif) {
    try {
      const exifData = ExifReader(metadata.exif) as Record<string, unknown>;

      // Flatten all EXIF sections into a single object
      for (const [key, value] of Object.entries(exifData)) {
        if (value && typeof value === "object" && !Array.isArray(value)) {
          Object.assign(exif, value);
        } else {
          exif[key] = value;
        }
      }

      // Try to extract GPS coordinates
      const gpsSection = exifData.GPSInfo ?? exifData.GPS ?? exifData.gps;
      if (gpsSection && typeof gpsSection === "object") {
        const gpsObj = gpsSection as Record<string, unknown>;
        const lat = convertGPSCoordinate(
          gpsObj.GPSLatitude as number[] | undefined,
          gpsObj.GPSLatitudeRef as string | undefined
        );
        const lon = convertGPSCoordinate(
          gpsObj.GPSLongitude as number[] | undefined,
          gpsObj.GPSLongitudeRef as string | undefined
        );
        if (lat !== null && lon !== null) {
          gps = { latitude: lat, longitude: lon };
        }
      }
    } catch {
      // EXIF parsing failed, continue without it
    }
  }

  return {
    format: metadata.format || "unknown",
    width: metadata.width || 0,
    height: metadata.height || 0,
    size: inputBuffer.length,
    space: metadata.space || "unknown",
    channels: metadata.channels || 0,
    depth: metadata.depth || "unknown",
    density: metadata.density,
    hasAlpha: metadata.hasAlpha || false,
    exif,
    gps,
  };
}

export async function stripMetadata(
  inputBuffer: Buffer
): Promise<{
  buffer: Buffer;
  info: { format: string; width: number; height: number; size: number };
}> {
  const metadata = await sharp(inputBuffer).metadata();
  const format = metadata.format || "png";

  const output = await sharp(inputBuffer)
    .rotate() // auto-orient then discard all EXIF/metadata
    .toFormat(format as keyof sharp.FormatEnum)
    .toBuffer();

  const outputMeta = await sharp(output).metadata();

  return {
    buffer: output,
    info: {
      format,
      width: outputMeta.width || 0,
      height: outputMeta.height || 0,
      size: output.length,
    },
  };
}

function convertGPSCoordinate(
  coords: number[] | undefined,
  ref: string | undefined
): number | null {
  if (!coords || coords.length < 3) return null;
  let decimal = coords[0] + coords[1] / 60 + coords[2] / 3600;
  if (ref === "S" || ref === "W") decimal = -decimal;
  return decimal;
}
