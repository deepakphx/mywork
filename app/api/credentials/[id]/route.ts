import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireApiAuth } from "@/lib/auth-server";
import { encryptSecret } from "@/lib/credentials-crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseId(idParam: string) {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiAuth();
    const { id: idParam } = await params;
    const id = parseId(idParam);
    if (!id) {
      return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });
    }

    const body = (await request.json()) as {
      label?: string;
      host?: string;
      username?: string;
      database_name?: string;
      port?: number;
      secret?: string;
    };

    const label = body.label?.trim();
    const host = body.host?.trim();
    const username = body.username?.trim();
    const databaseName = body.database_name?.trim();
    const port = Number(body.port ?? 3306);

    if (!label || !host || !username || !databaseName) {
      return NextResponse.json(
        { ok: false, error: "label, host, username, and database_name are required" },
        { status: 400 }
      );
    }
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
      return NextResponse.json({ ok: false, error: "Invalid port" }, { status: 400 });
    }

    if (body.secret && body.secret.trim()) {
      const encrypted = encryptSecret(body.secret.trim());
      await pool.query(
        `UPDATE server_credentials
         SET label = ?, host = ?, username = ?, database_name = ?, port = ?, encrypted_secret = ?, iv = ?, auth_tag = ?
         WHERE id = ?`,
        [
          label,
          host,
          username,
          databaseName,
          port,
          encrypted.encryptedSecret,
          encrypted.iv,
          encrypted.authTag,
          id,
        ]
      );
    } else {
      await pool.query(
        `UPDATE server_credentials
         SET label = ?, host = ?, username = ?, database_name = ?, port = ?
         WHERE id = ?`,
        [label, host, username, databaseName, port, id]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiAuth();
    const { id: idParam } = await params;
    const id = parseId(idParam);
    if (!id) {
      return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });
    }

    await pool.query("DELETE FROM server_credentials WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

