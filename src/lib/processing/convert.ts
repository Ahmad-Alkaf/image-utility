import sharp from "sharp";
import { ProcessingError } from "@/lib/processing/errors";

export interface ConvertResult {
  buffer: Buffer;
  info: { format: string; width: number; height: number; size: number };
}

export async function convertImage(
  inputBuffer: Buffer,
  options: { format: string; quality: number; stripMetadata: boolean }
): Promise<ConvertResult> {
  const { format, quality, stripMetadata } = options;

  let pipeline = sharp(inputBuffer);

  if (stripMetadata) {
    // .rotate() with no argument applies the EXIF orientation, so the
    // picture still looks right after the orientation tag is dropped.
    pipeline = pipeline.rotate();
  } else {
    pipeline = pipeline.withMetadata();
  }

  switch (format) {
    case "png": {
      // PNG is lossless. Quality only drives the deflate effort.
      const compressionLevel = Math.round((1 - quality / 100) * 9);
      pipeline = pipeline.png({ compressionLevel });
      break;
    }
    case "jpeg":
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
      break;
    case "webp":
      pipeline = pipeline.webp({ quality });
      break;
    case "avif":
      pipeline = pipeline.avif({ quality });
      break;
    case "tiff":
      pipeline = pipeline.tiff({ quality });
      break;
    case "gif": {
      const colours = Math.max(2, Math.round((quality / 100) * 256));
      pipeline = pipeline.gif({ colours });
      break;
    }
    default:
      throw new ProcessingError(`Unsupported target format: ${format}`);
  }

  const outputBuffer = await pipeline.toBuffer();
  const metadata = await sharp(outputBuffer).metadata();

  return {
    buffer: outputBuffer,
    info: {
      format,
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
      size: outputBuffer.length,
    },
  };
}
