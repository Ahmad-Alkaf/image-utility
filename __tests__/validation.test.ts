import { describe, expect, it } from "vitest";
import {
  compressSchema,
  convertSchema,
  filtersSchema,
  metadataSchema,
  removeBgSchema,
  resizeSchema,
  watermarkSchema,
} from "@/lib/validation";

describe("convertSchema", () => {
  it("applies defaults", () => {
    expect(convertSchema.parse({ format: "webp" })).toEqual({ format: "webp", quality: 100, stripMetadata: false });
  });

  it("rejects unsupported formats and out-of-range quality", () => {
    expect(convertSchema.safeParse({ format: "svg" }).success).toBe(false);
    expect(convertSchema.safeParse({ format: "bmp" }).success).toBe(false);
    expect(convertSchema.safeParse({ format: "png", quality: 0 }).success).toBe(false);
    expect(convertSchema.safeParse({ format: "png", quality: 101 }).success).toBe(false);
    expect(convertSchema.safeParse({ format: "png", quality: "80" }).success).toBe(false);
  });
});

describe("removeBgSchema", () => {
  it("defaults to a transparent background", () => {
    expect(removeBgSchema.parse({})).toEqual({ background: "transparent" });
  });

  it("limits the blur amount", () => {
    expect(removeBgSchema.safeParse({ background: "blur", blurAmount: 50 }).success).toBe(true);
    expect(removeBgSchema.safeParse({ background: "blur", blurAmount: 51 }).success).toBe(false);
    expect(removeBgSchema.safeParse({ background: "gradient" }).success).toBe(false);
  });
});

describe("resizeSchema", () => {
  it("requires a width or height in exact mode", () => {
    expect(resizeSchema.safeParse({ mode: "exact", width: 800 }).success).toBe(true);
    expect(resizeSchema.safeParse({ mode: "exact", height: 600 }).success).toBe(true);
    expect(resizeSchema.safeParse({ mode: "exact" }).success).toBe(false);
  });

  it("requires a percentage in percentage mode", () => {
    expect(resizeSchema.safeParse({ mode: "percentage", percentage: 50 }).success).toBe(true);
    expect(resizeSchema.safeParse({ mode: "percentage" }).success).toBe(false);
    expect(resizeSchema.safeParse({ mode: "percentage", percentage: 501 }).success).toBe(false);
  });

  it("requires a crop area in crop mode", () => {
    const cropArea = { x: 0, y: 0, width: 10, height: 10 };
    expect(resizeSchema.safeParse({ mode: "crop", cropArea }).success).toBe(true);
    expect(resizeSchema.safeParse({ mode: "crop", cropPreset: "1:1" }).success).toBe(false);
    expect(resizeSchema.safeParse({ mode: "crop", cropArea: { ...cropArea, width: 0 } }).success).toBe(false);
    expect(resizeSchema.safeParse({ mode: "crop", cropArea: { ...cropArea, x: -1 } }).success).toBe(false);
  });

  it("locks the aspect ratio by default and caps dimensions at 10000", () => {
    expect(resizeSchema.parse({ mode: "exact", width: 10000 }).lockAspectRatio).toBe(true);
    expect(resizeSchema.safeParse({ mode: "exact", width: 10001 }).success).toBe(false);
    expect(resizeSchema.safeParse({ mode: "exact", width: 0 }).success).toBe(false);
  });
});

describe("compressSchema", () => {
  it("defaults to automatic mode at quality 75", () => {
    expect(compressSchema.parse({})).toEqual({ mode: "auto", quality: 75 });
  });

  it("accepts an optional output format from the supported list", () => {
    expect(compressSchema.safeParse({ format: "avif" }).success).toBe(true);
    expect(compressSchema.safeParse({ format: "heic" }).success).toBe(false);
  });
});

describe("watermarkSchema", () => {
  it("requires text for a text watermark", () => {
    expect(watermarkSchema.safeParse({ type: "text", text: "Sample" }).success).toBe(true);
    expect(watermarkSchema.safeParse({ type: "text" }).success).toBe(false);
    expect(watermarkSchema.safeParse({ type: "text", text: "" }).success).toBe(false);
    expect(watermarkSchema.safeParse({ type: "image" }).success).toBe(true);
  });

  it("applies defaults for opacity, rotation, and position", () => {
    expect(watermarkSchema.parse({ type: "image" })).toEqual({
      type: "image",
      opacity: 0.5,
      rotation: 0,
      position: "bottom-right",
    });
  });

  it("validates colors, sizes, and ranges", () => {
    const base = { type: "text", text: "x" };
    expect(watermarkSchema.safeParse({ ...base, fontColor: "#fff" }).success).toBe(true);
    expect(watermarkSchema.safeParse({ ...base, fontColor: "#ffffff80" }).success).toBe(true);
    expect(watermarkSchema.safeParse({ ...base, fontColor: "white" }).success).toBe(false);
    expect(watermarkSchema.safeParse({ ...base, fontSize: 7 }).success).toBe(false);
    expect(watermarkSchema.safeParse({ ...base, fontSize: 201 }).success).toBe(false);
    expect(watermarkSchema.safeParse({ ...base, opacity: 1.1 }).success).toBe(false);
    expect(watermarkSchema.safeParse({ ...base, rotation: -361 }).success).toBe(false);
    expect(watermarkSchema.safeParse({ ...base, position: "tile" }).success).toBe(true);
    expect(watermarkSchema.safeParse({ ...base, position: "middle" }).success).toBe(false);
    expect(watermarkSchema.safeParse({ ...base, text: "x".repeat(201) }).success).toBe(false);
  });
});

describe("filtersSchema", () => {
  it("defaults every adjustment to neutral", () => {
    expect(filtersSchema.parse({})).toEqual({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      hue: 0,
      sharpness: 0,
      blur: 0,
      gamma: 1,
    });
  });

  it("enforces the slider ranges and the preset list", () => {
    expect(filtersSchema.safeParse({ brightness: 101 }).success).toBe(false);
    expect(filtersSchema.safeParse({ contrast: -101 }).success).toBe(false);
    expect(filtersSchema.safeParse({ hue: 361 }).success).toBe(false);
    expect(filtersSchema.safeParse({ gamma: 0.05 }).success).toBe(false);
    expect(filtersSchema.safeParse({ gamma: 3 }).success).toBe(true);
    expect(filtersSchema.safeParse({ preset: "sepia" }).success).toBe(true);
    expect(filtersSchema.safeParse({ preset: "noir" }).success).toBe(false);
  });
});

describe("metadataSchema", () => {
  it("accepts only read and strip", () => {
    expect(metadataSchema.parse({ action: "read" })).toEqual({ action: "read" });
    expect(metadataSchema.safeParse({ action: "strip" }).success).toBe(true);
    expect(metadataSchema.safeParse({ action: "edit" }).success).toBe(false);
    expect(metadataSchema.safeParse({}).success).toBe(false);
  });
});
