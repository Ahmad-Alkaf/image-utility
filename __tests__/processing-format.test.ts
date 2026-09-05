import { describe, expect, it } from "vitest";
import { extensionFor, mimeTypeFor, outputFileName, outputFormatFor } from "@/lib/processing/format";

describe("outputFormatFor", () => {
  it("normalises the names sharp reports", () => {
    expect(outputFormatFor("jpeg")).toBe("jpeg");
    expect(outputFormatFor("jpg")).toBe("jpeg");
    expect(outputFormatFor("heif")).toBe("avif");
    expect(outputFormatFor("avif")).toBe("avif");
    expect(outputFormatFor("webp")).toBe("webp");
    expect(outputFormatFor("tiff")).toBe("tiff");
    expect(outputFormatFor("gif")).toBe("gif");
    expect(outputFormatFor("png")).toBe("png");
  });

  it("falls back to PNG for anything it cannot write", () => {
    expect(outputFormatFor("svg")).toBe("png");
    expect(outputFormatFor("heic")).toBe("png");
    expect(outputFormatFor(undefined)).toBe("png");
  });
});

describe("extensionFor", () => {
  it("uses jpg for jpeg and the format name otherwise", () => {
    expect(extensionFor("jpeg")).toBe("jpg");
    expect(extensionFor("png")).toBe("png");
    expect(extensionFor("avif")).toBe("avif");
  });
});

describe("mimeTypeFor", () => {
  it("maps known formats and the jpg alias", () => {
    expect(mimeTypeFor("jpeg")).toBe("image/jpeg");
    expect(mimeTypeFor("jpg")).toBe("image/jpeg");
    expect(mimeTypeFor("webp")).toBe("image/webp");
  });

  it("builds a generic type for unknown formats", () => {
    expect(mimeTypeFor("bmp")).toBe("image/bmp");
  });
});

describe("outputFileName", () => {
  it("replaces the extension and adds the suffix", () => {
    expect(outputFileName("photo.png", "-resized", "jpeg")).toBe("photo-resized.jpg");
    expect(outputFileName("photo.JPEG", "-compressed", "webp")).toBe("photo-compressed.webp");
  });

  it("keeps a name without an extension", () => {
    expect(outputFileName("photo", "-converted", "png")).toBe("photo-converted.png");
  });

  it("keeps dots inside the name", () => {
    expect(outputFileName("my.photo.v2.png", "", "png")).toBe("my.photo.v2.png");
  });

  it("falls back to 'image' when nothing is left", () => {
    expect(outputFileName(".png", "-x", "png")).toBe("image-x.png");
    expect(outputFileName("", "", "gif")).toBe("image.gif");
  });
});
