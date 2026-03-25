import { z } from "zod";
import { SUPPORTED_FORMATS } from "@/lib/constants";

export const convertSchema = z.object({
  format: z.enum(SUPPORTED_FORMATS as [string, ...string[]]),
  quality: z.number().min(1).max(100).default(100),
  stripMetadata: z.boolean().default(false),
});

export const removeBgSchema = z.object({
  background: z.enum(["transparent", "color", "blur"]).default("transparent"),
  backgroundColor: z.string().optional(),
  blurAmount: z.number().min(1).max(50).optional(),
});

export const resizeSchema = z.object({
  mode: z.enum(["exact", "percentage", "crop"]),
  width: z.number().min(1).max(10000).optional(),
  height: z.number().min(1).max(10000).optional(),
  percentage: z.number().min(1).max(500).optional(),
  lockAspectRatio: z.boolean().default(true),
  cropPreset: z.enum(["1:1", "4:3", "16:9", "3:2", "free"]).optional(),
  cropArea: z
    .object({
      x: z.number().min(0),
      y: z.number().min(0),
      width: z.number().min(1),
      height: z.number().min(1),
    })
    .optional(),
});

export const compressSchema = z.object({
  mode: z.enum(["auto", "manual"]).default("auto"),
  quality: z.number().min(1).max(100).default(75),
  format: z.enum(SUPPORTED_FORMATS as [string, ...string[]]).optional(),
});

export const watermarkSchema = z.object({
  type: z.enum(["text", "image"]),
  text: z.string().max(200).optional(),
  fontSize: z.number().min(8).max(200).optional(),
  fontColor: z.string().regex(/^#[0-9a-fA-F]{3,8}$/).optional(),
  opacity: z.number().min(0).max(1).default(0.5),
  rotation: z.number().min(-360).max(360).default(0),
  position: z
    .enum([
      "top-left",
      "top-center",
      "top-right",
      "center-left",
      "center",
      "center-right",
      "bottom-left",
      "bottom-center",
      "bottom-right",
      "tile",
    ])
    .default("bottom-right"),
});

export const filtersSchema = z.object({
  brightness: z.number().min(-100).max(100).default(0),
  contrast: z.number().min(-100).max(100).default(0),
  saturation: z.number().min(-100).max(100).default(0),
  hue: z.number().min(0).max(360).default(0),
  sharpness: z.number().min(0).max(100).default(0),
  blur: z.number().min(0).max(100).default(0),
  gamma: z.number().min(0.1).max(3).default(1),
  preset: z
    .enum(["grayscale", "sepia", "invert", "vintage", "cool", "warm"])
    .optional(),
});

export const metadataSchema = z.object({
  action: z.enum(["read", "strip"]),
});

export type ConvertInput = z.infer<typeof convertSchema>;
export type RemoveBgInput = z.infer<typeof removeBgSchema>;
export type ResizeInput = z.infer<typeof resizeSchema>;
export type CompressInput = z.infer<typeof compressSchema>;
export type WatermarkInput = z.infer<typeof watermarkSchema>;
export type FiltersInput = z.infer<typeof filtersSchema>;
export type MetadataInput = z.infer<typeof metadataSchema>;
