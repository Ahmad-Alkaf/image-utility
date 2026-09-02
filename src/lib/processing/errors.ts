/**
 * An error whose message is safe to show to the user.
 * Process routes answer 400 with the message. Every other error
 * becomes a generic 500 so internal details never leak.
 */
export class ProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProcessingError";
  }
}

const SHARP_INPUT_ERROR = /unsupported image format|input buffer|input file|premature end|corrupt|invalid|bad|too large|exceeds pixel limit/i;

/** True when sharp rejected the input file (damaged, truncated, wrong type). */
export function isInputImageError(error: unknown): boolean {
  return error instanceof Error && SHARP_INPUT_ERROR.test(error.message);
}

export const INPUT_IMAGE_ERROR_MESSAGE =
  "The image could not be read. The file may be damaged, truncated, or in a format we do not support.";
