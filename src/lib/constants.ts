import type { ToolDefinition, ImageFormat } from "@/types";

export const SITE_NAME = "ImageForge";
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://imagesforge.com";
export const SITE_DESCRIPTION =
  "Free online image tools. Convert, compress, resize, crop, watermark, and adjust images, remove backgrounds, and inspect or strip metadata. No software to install.";

/** How long uploads and results stay on the server before the cleanup job deletes them. */
export const FILE_RETENTION_HOURS = 24;
export const FILE_RETENTION_MS = FILE_RETENTION_HOURS * 60 * 60 * 1000;

export const SUPPORTED_FORMATS: ImageFormat[] = [
  "png",
  "jpeg",
  "webp",
  "avif",
  "tiff",
  "gif",
];

export const FORMAT_LABELS: Record<ImageFormat, string> = {
  png: "PNG",
  jpeg: "JPEG",
  webp: "WebP",
  avif: "AVIF",
  tiff: "TIFF",
  gif: "GIF",
};

export const FORMAT_MIME_TYPES: Record<ImageFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif",
  tiff: "image/tiff",
  gif: "image/gif",
};

export const MIME_TO_FORMAT: Record<string, ImageFormat> = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpeg",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/tiff": "tiff",
  "image/gif": "gif",
};

/**
 * Base raster MIME types supported by sharp for both input and output.
 * Do NOT use this directly for validation, use TOOL_ACCEPTED_TYPES instead,
 * since each tool has different format capabilities.
 */
const RASTER_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/avif",
  "image/tiff",
  "image/gif",
] as const;

export type ToolId =
  | "convert"
  | "remove-bg"
  | "resize"
  | "compress"
  | "watermark"
  | "filters"
  | "metadata";

/**
 * Per-tool accepted MIME types. Each tool explicitly declares what it supports
 * based on its processing capabilities:
 *
 * - convert/metadata: Accept SVG because sharp can rasterize SVG on input,
 *   and these tools either output to an explicit target format (convert)
 *   or only read metadata without producing image output (metadata read).
 *
 * - resize/compress/filters/watermark: Raster only because they output in
 *   the same format as input, and sharp cannot output SVG.
 *
 * - remove-bg: Limited to formats supported by the @imgly/background-removal
 *   WASM library.
 */
export const TOOL_ACCEPTED_TYPES: Record<ToolId, string[]> = {
  convert: [...RASTER_IMAGE_TYPES, "image/svg+xml"],
  resize: [...RASTER_IMAGE_TYPES],
  compress: [...RASTER_IMAGE_TYPES],
  filters: [...RASTER_IMAGE_TYPES],
  watermark: [...RASTER_IMAGE_TYPES],
  metadata: [...RASTER_IMAGE_TYPES, "image/svg+xml"],
  "remove-bg": ["image/png", "image/jpeg", "image/jpg", "image/webp"],
};

export const UPLOAD_LIMITS = {
  anonymous: {
    maxFileSize: 10 * 1024 * 1024, // 10 MB
    maxFiles: 10,
  },
  authenticated: {
    maxFileSize: 50 * 1024 * 1024, // 50 MB
    maxFiles: 100,
  },
} as const;

export const RATE_LIMITS = {
  anonymous: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10/hour
  authenticated: { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100/hour
};

export const CROP_PRESETS = {
  "1:1": { label: "Square 1:1", ratio: 1 },
  "4:3": { label: "Standard 4:3", ratio: 4 / 3 },
  "16:9": { label: "Widescreen 16:9", ratio: 16 / 9 },
  "3:2": { label: "Photo 3:2", ratio: 3 / 2 },
  free: { label: "Free", ratio: 0 },
} as const;

export const FILTER_PRESETS = {
  grayscale: { label: "Grayscale", icon: "CircleDot" },
  sepia: { label: "Sepia", icon: "Sun" },
  invert: { label: "Invert", icon: "RefreshCw" },
  vintage: { label: "Vintage", icon: "Camera" },
  cool: { label: "Cool", icon: "Snowflake" },
  warm: { label: "Warm", icon: "Flame" },
} as const;

export const TOOLS: ToolDefinition[] = [
  {
    id: "convert",
    name: "Convert",
    title: "Image Converter",
    shortLabel: "Convert",
    description:
      "Change images between PNG, JPEG, WebP, AVIF, TIFF, and GIF. Set the quality and keep or remove the metadata.",
    seoDescription:
      "Convert images online for free. Turn PNG, JPEG, WebP, AVIF, TIFF, GIF, or SVG into any other format, with quality control and batch conversion.",
    href: "/convert",
    icon: "ArrowRightLeft",
    requiresAuth: false,
    supportsBatch: true,
  },
  {
    id: "remove-bg",
    name: "Remove background",
    title: "Background Remover",
    shortLabel: "Remove BG",
    description:
      "Cut out the subject of a photo in one click. Runs in your browser, so the image never leaves your device.",
    seoDescription:
      "Remove the background from any photo for free. The AI model runs in your browser, so your image is never uploaded. Get a transparent PNG, a solid color, or a blurred background.",
    href: "/remove-bg",
    icon: "Eraser",
    requiresAuth: true,
    supportsBatch: false,
  },
  {
    id: "resize",
    name: "Resize and crop",
    title: "Image Resizer and Cropper",
    shortLabel: "Resize",
    description:
      "Set exact pixel dimensions, scale by percentage, or crop to a preset ratio such as 1:1 or 16:9.",
    seoDescription:
      "Resize and crop images online for free. Set exact dimensions, scale by percentage, or crop to square, 4:3, 16:9, or 3:2. Batch resize supported.",
    href: "/resize",
    icon: "Maximize2",
    requiresAuth: false,
    supportsBatch: true,
  },
  {
    id: "compress",
    name: "Compress",
    title: "Image Compressor",
    shortLabel: "Compress",
    description:
      "Make files smaller with little visible change. Let the tool pick the settings, or set the quality yourself.",
    seoDescription:
      "Compress JPEG, PNG, WebP, and AVIF images online for free. Automatic mode finds a good balance between size and quality. See the savings before you download.",
    href: "/compress",
    icon: "FileDown",
    requiresAuth: false,
    supportsBatch: false,
  },
  {
    id: "watermark",
    name: "Watermark",
    title: "Watermark Tool",
    shortLabel: "Watermark",
    description:
      "Stamp text or a logo onto your image. Choose the position, size, color, rotation, and opacity, or tile it across the whole image.",
    seoDescription:
      "Add a text or logo watermark to images online for free. Control position, size, color, rotation, and opacity, or tile the watermark across the image.",
    href: "/watermark",
    icon: "Stamp",
    requiresAuth: true,
    supportsBatch: false,
  },
  {
    id: "filters",
    name: "Filters and adjustments",
    title: "Image Filters and Adjustments",
    shortLabel: "Filters",
    description:
      "Apply presets such as grayscale or sepia, then fine-tune brightness, contrast, saturation, hue, sharpness, blur, and gamma.",
    seoDescription:
      "Edit photos online for free. Apply grayscale, sepia, vintage, cool, and warm presets, and adjust brightness, contrast, saturation, hue, sharpness, blur, and gamma.",
    href: "/filters",
    icon: "SlidersHorizontal",
    requiresAuth: true,
    supportsBatch: false,
  },
  {
    id: "metadata",
    name: "Metadata",
    title: "Image Metadata Viewer",
    shortLabel: "Metadata",
    description:
      "See the EXIF data, camera settings, and GPS location stored in a photo, then remove it all before you share the file.",
    seoDescription:
      "View and remove image metadata online for free. Inspect EXIF data, camera settings, and GPS coordinates, then strip everything to protect your privacy.",
    href: "/metadata",
    icon: "Info",
    requiresAuth: false,
    supportsBatch: false,
  },
];

export function getTool(id: ToolId): ToolDefinition {
  const tool = TOOLS.find((t) => t.id === id);
  if (!tool) throw new Error(`Unknown tool: ${id}`);
  return tool;
}
