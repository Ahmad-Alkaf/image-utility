import sharp from "sharp";

export async function convertImage(
  inputBuffer: Buffer,
  options: { format: string; quality: number; stripMetadata: boolean }
): Promise<{
  buffer: Buffer;
  info: { format: string; width: number; height: number; size: number };
}> {
  const { format, quality, stripMetadata } = options;

  let pipeline = sharp(inputBuffer);

  if (stripMetadata) {
    pipeline = pipeline.withMetadata({});
  } else {
    pipeline = pipeline.withMetadata();
  }

  switch (format) {
    case "png": {
      const compressionLevel = Math.round((1 - quality / 100) * 9);
      pipeline = pipeline.png({ compressionLevel });
      break;
    }
    case "jpeg": {
      pipeline = pipeline.jpeg({ quality });
      break;
    }
    case "webp": {
      pipeline = pipeline.webp({ quality });
      break;
    }
    case "avif": {
      pipeline = pipeline.avif({ quality });
      break;
    }
    case "tiff": {
      pipeline = pipeline.tiff({ quality });
      break;
    }
    case "gif": {
      pipeline = pipeline.gif();
      break;
    }
    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  if (stripMetadata) {
    pipeline = pipeline.withMetadata({});
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
