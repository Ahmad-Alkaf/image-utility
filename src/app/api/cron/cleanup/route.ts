import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { cleanupExpiredFiles } from "@/lib/cleanup";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (token.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(secret));
}

/**
 * Runs the file cleanup on demand. The server already runs it every hour
 * on its own (see instrumentation.ts); this route exists so the job can
 * be triggered from outside (a Coolify scheduled task, a test).
 *
 * Requires `Authorization: Bearer <CRON_SECRET>`. Disabled when the
 * variable is not set.
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await cleanupExpiredFiles();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cleanup] manual run failed:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}

export const GET = POST;
