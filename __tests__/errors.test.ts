import { describe, expect, it } from "vitest";
import { INPUT_IMAGE_ERROR_MESSAGE, isInputImageError, ProcessingError } from "@/lib/processing/errors";

describe("ProcessingError", () => {
  it("is an Error with its own name and the given message", () => {
    const err = new ProcessingError("The watermark image is too large.");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ProcessingError);
    expect(err.name).toBe("ProcessingError");
    expect(err.message).toBe("The watermark image is too large.");
  });
});

describe("isInputImageError", () => {
  it("recognises the messages sharp uses for bad input", () => {
    const messages = [
      "Input buffer contains unsupported image format",
      "Input file is missing",
      "Input file contains unsupported image format",
      "VipsJpeg: Premature end of JPEG file",
      "Input image exceeds pixel limit",
      "pngload_buffer: bad PNG header",
      "Corrupt JPEG data: premature end of data segment",
      "Invalid input",
      "Image is too large",
    ];
    for (const message of messages) {
      expect(isInputImageError(new Error(message)), message).toBe(true);
    }
  });

  it("ignores unrelated errors and non-errors", () => {
    expect(isInputImageError(new Error("ECONNREFUSED 127.0.0.1:5432"))).toBe(false);
    expect(isInputImageError(new Error("Unexpected token in JSON"))).toBe(false);
    expect(isInputImageError("Input buffer contains unsupported image format")).toBe(false);
    expect(isInputImageError({ message: "corrupt" })).toBe(false);
    expect(isInputImageError(null)).toBe(false);
    expect(isInputImageError(undefined)).toBe(false);
  });

  it("does not treat a ProcessingError as an input error unless its text matches", () => {
    expect(isInputImageError(new ProcessingError("Please pick a smaller font size."))).toBe(false);
  });
});

describe("INPUT_IMAGE_ERROR_MESSAGE", () => {
  it("is a user-facing sentence without internal details", () => {
    expect(INPUT_IMAGE_ERROR_MESSAGE).toMatch(/could not be read/);
    expect(INPUT_IMAGE_ERROR_MESSAGE).not.toMatch(/sharp|vips/i);
  });
});
