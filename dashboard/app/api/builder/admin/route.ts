// intent: admin endpoint to list, approve, and reject builder applications
// status: done
// confidence: high

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";

function checkAdmin(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return request.headers.get("x-admin-secret") === secret;
}

export async function GET(request: NextRequest) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    const sql = getDb();
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");

    const rows = status
      ? await sql`
          SELECT * FROM builder_applications
          WHERE status = ${status}
          ORDER BY created_at DESC
        `
      : await sql`
          SELECT * FROM builder_applications
          ORDER BY created_at DESC
        `;

    return NextResponse.json({ applications: rows });
  } catch (err) {
    console.error("Builder admin GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { application_id, action } = body as {
      application_id?: string;
      action?: string;
    };

    if (!application_id || typeof application_id !== "string") {
      return NextResponse.json({ error: "application_id is required" }, { status: 400 });
    }
    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
    }

    const sql = getDb();

    // Fetch the application
    const apps = (await sql`
      SELECT * FROM builder_applications WHERE id = ${application_id}
    `) as Record<string, unknown>[];

    if (apps.length === 0) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const app = apps[0];

    if (app.status !== "pending") {
      return NextResponse.json({ error: `Application already ${app.status}` }, { status: 409 });
    }

    if (action === "reject") {
      await sql`
        UPDATE builder_applications
        SET status = 'rejected', reviewed_by = 'admin', reviewed_at = NOW(), updated_at = NOW()
        WHERE id = ${application_id}
      `;
      return NextResponse.json({ status: "rejected", application_id });
    }

    // Approve: generate a builder key and link it
    const keyId = `UT-BLD-${randomUUID().slice(0, 8).toUpperCase()}`;

    await sql`
      INSERT INTO builder_keys (id, user_handle, email)
      VALUES (${keyId}, ${app.user_handle as string}, ${(app.email as string) ?? null})
    `;

    await sql`
      UPDATE builder_applications
      SET status = 'approved', reviewed_by = 'admin', reviewed_at = NOW(),
          key_id = ${keyId}, updated_at = NOW()
      WHERE id = ${application_id}
    `;

    return NextResponse.json({
      status: "approved",
      application_id,
      key: keyId,
    });
  } catch (err) {
    console.error("Builder admin POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
