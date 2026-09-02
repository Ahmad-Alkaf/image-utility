import sharp from "sharp";
import ExifReader from "exif-reader";
import { outputFormatFor } from "@/lib/processing/format";

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
  hasProfile: boolean;
  orientation?: number;
  exif: Record<string, unknown>;
  gps?: { latitude: number; longitude: number };
}

/** EXIF fields that are byte blobs or of no use to a reader. */
const HIDDEN_EXIF_KEYS = new Set([
  "MakerNote",
  "UserComment",
  "ExifVersion",
  "FlashpixVersion",
  "ComponentsConfiguration",
  "SceneType",
  "FileSource",
  "InteropOffset",
  "ExifOffset",
  "GPSInfo",
  "PrintImageMatching",
  "ImageUniqueID",
  "CFAPattern",
]);

function cleanExifValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString().replace("T", " ").slice(0, 19);
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) return undefined;
  if (typeof value === "string") return value.replace(/\0+$/g, "").trim() || undefined;
  return value;
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
        if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date) && !Buffer.isBuffer(value)) {
          for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            if (HIDDEN_EXIF_KEYS.has(k)) continue;
            const cleaned = cleanExifValue(v);
            if (cleaned !== undefined) exif[k] = cleaned;
          }
        } else if (!HIDDEN_EXIF_KEYS.has(key)) {
          const cleaned = cleanExifValue(value);
          if (cleaned !== undefined) exif[key] = cleaned;
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
    hasProfile: metadata.hasProfile || false,
    orientation: metadata.orientation,
    exif,
    gps,
  };
}

export interface StripResult {
  buffer: Buffer;
  info: { format: string; width: number; height: number; size: number };
}

export async function stripMetadata(inputBuffer: Buffer): Promise<StripResult> {
  const metadata = await sharp(inputBuffer).metadata();
  const format = outputFormatFor(metadata.format);

  // .rotate() bakes in the EXIF orientation, then sharp drops every
  // EXIF/IPTC/XMP block because withMetadata() is not called.
  const output = await sharp(inputBuffer)
    .rotate()
    .toFormat(format)
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
