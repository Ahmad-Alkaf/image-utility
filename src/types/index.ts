import { ProcessingType, ProcessingStatus } from "@/generated/prisma";

export type { ProcessingType, ProcessingStatus };

export interface ToolDefinition {
  id: string;
  /** Short name used on cards and in the dashboard. */
  name: string;
  /** Page title and H1, e.g. "Image Converter". */
  title: string;
  /** Label for tight spaces such as the header and footer. */
  shortLabel: string;
  /** One or two sentences shown on the tool card and page. */
  description: string;
  /** Longer text for the meta description tag. */
  seoDescription: string;
  href: string;
  icon: string;
  requiresAuth: boolean;
  supportsBatch: boolean;
}

export interface ProcessingResult {
  jobId: string;
  downloadUrl: string;
  outputMeta: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    width?: number;
    height?: number;
  };
}

export interface ImageMeta {
  width: number;
  height: number;
  format: string;
  size: number;
  fileName: string;
}

export interface UploadedFile {
  storageKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface ExifData {
  make?: string;
  model?: string;
  dateTime?: string;
  exposureTime?: string;
  fNumber?: number;
  iso?: number;
  focalLength?: number;
  gps?: {
    latitude: number;
    longitude: number;
  };
  software?: string;
  orientation?: number;
  [key: string]: unknown;
}

export type ImageFormat =
  | "png"
  | "jpeg"
  | "webp"
  | "avif"
  | "tiff"
  | "gif";

export type CropPreset = "1:1" | "4:3" | "16:9" | "3:2" | "free";

export type WatermarkPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"
  | "tile";

export type FilterPreset =
  | "grayscale"
  | "sepia"
  | "invert"
  | "vintage"
  | "cool"
  | "warm";

export interface ConvertOptions {
  format: ImageFormat;
  quality: number;
  stripMetadata: boolean;
}

export interface RemoveBgOptions {
  background: "transparent" | "color" | "blur";
  backgroundColor?: string;
  blurAmount?: number;
}

export interface ResizeOptions {
  mode: "exact" | "percentage" | "crop";
  width?: number;
  height?: number;
  percentage?: number;
  lockAspectRatio: boolean;
  cropPreset?: CropPreset;
  cropArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface CompressOptions {
  mode: "auto" | "manual";
  quality: number;
  format?: ImageFormat;
}

export interface WatermarkOptions {
  type: "text" | "image";
  text?: string;
  fontSize?: number;
  fontColor?: string;
  opacity: number;
  rotation: number;
  position: WatermarkPosition;
  imageStorageKey?: string;
}

export interface FilterOptions {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  sharpness: number;
  blur: number;
  gamma: number;
  preset?: FilterPreset;
}

export interface MetadataOptions {
  action: "read" | "strip";
}
