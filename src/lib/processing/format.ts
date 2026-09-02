import type sharp from "sharp";
import { FORMAT_MIME_TYPES } from "@/lib/constants";
import type { ImageFormat } from "@/types";

/**
 * Maps the format name sharp reports for an input image to the format
 * we write back out. sharp reports AVIF input as "heif"; writing "heif"
 * would produce a HEIC container, so we pin it to AVIF. Anything we
 * cannot write (svg, ...) falls back to PNG.
 */
export function outputFormatFor(inputFormat: string | undefined): ImageFormat {
  switch (inputFormat) {
    case "jpeg":
    case "jpg":
      return "jpeg";
    case "heif":
    case "avif":
      return "avif";
    case "webp":
    case "tiff":
    case "gif":
    case "png":
      return inputFormat;
    default:
      return "png";
  }
}

/** File extension for an output format. */
export function extensionFor(format: string): string {
  return format === "jpeg" ? "jpg" : format;
}

/** MIME type for an output format. */
export function mimeTypeFor(format: string): string {
  const normalized = format === "jpg" ? "jpeg" : format;
  return FORMAT_MIME_TYPES[normalized as ImageFormat] ?? `image/${normalized}`;
}

/**
 * Builds the output file name: strips the old extension (if any),
 * appends a suffix such as "-resized", then the new extension.
 */
export function outputFileName(inputName: string, suffix: string, format: string): string {
  const base = inputName.replace(/\.[a-zA-Z0-9]+$/, "") || "image";
  return `${base}${suffix}.${extensionFor(format)}`;
}

export type SharpFormat = keyof sharp.FormatEnum;
