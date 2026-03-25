import type { ToolDefinition, ImageFormat } from "@/types";

export const SUPPORTED_FORMATS: ImageFormat[] = [
  "png",
  "jpeg",
  "webp",
  "avif",
  "tiff",
  "gif",
];

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

export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/avif",
  "image/tiff",
  "image/gif",
  "image/svg+xml",
];

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
  "1:1": { label: "Square (1:1)", ratio: 1 },
  "4:3": { label: "Standard (4:3)", ratio: 4 / 3 },
  "16:9": { label: "Widescreen (16:9)", ratio: 16 / 9 },
  "3:2": { label: "Photo (3:2)", ratio: 3 / 2 },
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
    name: "Format Conversion",
    description:
      "Convert images between PNG, JPEG, WebP, AVIF, TIFF, and more formats instantly.",
    href: "/convert",
    icon: "ArrowRightLeft",
    requiresAuth: false,
    supportsBatch: true,
  },
  {
    id: "remove-bg",
    name: "Background Removal",
    description:
      "Remove image backgrounds automatically with AI-powered detection.",
    href: "/remove-bg",
    icon: "Eraser",
    requiresAuth: true,
    supportsBatch: false,
  },
  {
    id: "resize",
    name: "Resize & Crop",
    description:
      "Resize images to exact dimensions or crop with preset aspect ratios.",
    href: "/resize",
    icon: "Maximize2",
    requiresAuth: false,
    supportsBatch: true,
  },
  {
    id: "compress",
    name: "Image Compression",
    description:
      "Reduce file size while maintaining quality with smart compression.",
    href: "/compress",
    icon: "FileDown",
    requiresAuth: false,
    supportsBatch: false,
  },
  {
    id: "watermark",
    name: "Watermark",
    description:
      "Add text or image watermarks with customizable placement and opacity.",
    href: "/watermark",
    icon: "Stamp",
    requiresAuth: true,
    supportsBatch: false,
  },
  {
    id: "filters",
    name: "Filters & Adjustments",
    description:
      "Apply filters, adjust brightness, contrast, saturation, and more.",
    href: "/filters",
    icon: "SlidersHorizontal",
    requiresAuth: true,
    supportsBatch: false,
  },
  {
    id: "metadata",
    name: "Metadata Viewer",
    description:
      "View EXIF data, GPS coordinates, camera info and strip metadata for privacy.",
    href: "/metadata",
    icon: "Info",
    requiresAuth: false,
    supportsBatch: false,
  },
];
