import { Webhook } from "svix";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

interface ClerkUserEvent {
  type: string;
  data: {
    id: string;
    email_addresses?: { email_address: string }[];
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string | null;
  };
}

/**
 * Clerk -> database user sync. Registered in the Clerk dashboard as
 * POST /api/webhooks/clerk with CLERK_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }

  // The signature covers the raw body bytes. Never re-serialize it.
  const body = await req.text();
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: ClerkUserEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ClerkUserEvent;
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  const eventType = evt.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const email = email_addresses?.[0]?.email_address ?? "";
    const name = `${first_name ?? ""} ${last_name ?? ""}`.trim() || null;

    await db.user.upsert({
      where: { clerkId: id },
      update: { email, name, imageUrl: image_url ?? null },
      create: { clerkId: id, email, name, imageUrl: image_url ?? null },
    });
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;
    await db.user.delete({ where: { clerkId: id } }).catch(() => {});
  }

  return NextResponse.json({ received: true });
}
