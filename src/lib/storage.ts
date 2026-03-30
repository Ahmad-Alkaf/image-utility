import { promises as fs } from "fs";
import path from "path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import crypto from "crypto";

const hasS3Keys =
  !!process.env.S3_ACCESS_KEY_ID && !!process.env.S3_SECRET_ACCESS_KEY;
const STORAGE_TYPE = hasS3Keys ? "s3" : "local";
const LOCAL_DIR = path.join(process.cwd(), ".storage");
const RESOLVED_LOCAL_DIR = path.resolve(LOCAL_DIR);

if (STORAGE_TYPE === "local") {
  console.log("[storage] No S3 credentials found — using local storage at .storage/");
}

function safePath(key: string): string {
  const resolved = path.resolve(LOCAL_DIR, key);
  if (!resolved.startsWith(RESOLVED_LOCAL_DIR + path.sep) && resolved !== RESOLVED_LOCAL_DIR) {
    throw new Error("Invalid storage key");
  }
  return resolved;
}

let _s3Client: S3Client | null = null;
function getS3Client() {
  if (!_s3Client) {
    _s3Client = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
    });
  }
  return _s3Client;
}

export function generateStorageKey(
  fileName: string,
  prefix: string = "input"
): string {
  const ext = path.extname(fileName).replace(/[^a-zA-Z0-9.]/g, "");
  const id = crypto.randomUUID();
  return `${prefix}/${id}${ext}`;
}

export async function storeFile(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  if (STORAGE_TYPE === "s3") {
    const s3 = getS3Client();
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
  } else {
    const filePath = safePath(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
  }
}

export async function getFile(key: string): Promise<Buffer> {
  if (STORAGE_TYPE === "s3") {
    const s3 = getS3Client();
    const response = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
      })
    );
    const stream = response.Body;
    if (!stream) throw new Error("Empty response from S3");
    return Buffer.from(await stream.transformToByteArray());
  } else {
    const filePath = safePath(key);
    return fs.readFile(filePath);
  }
}

export async function deleteFile(key: string): Promise<void> {
  if (STORAGE_TYPE === "s3") {
    const s3 = getS3Client();
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
      })
    );
  } else {
    const filePath = safePath(key);
    await fs.unlink(filePath).catch(() => {});
  }
}

