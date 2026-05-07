import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireApiAuth } from "@/lib/auth-server";
import { encryptSecret } from "@/lib/credentials-crypto";

type CredentialRow = {
  id: number;
  label: string;
  host: string;
  username: string;
  database_name: string;
  port: number;
  created_at: string;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireApiAuth();
    const [rows] = await pool.query<CredentialRow[]>(
      `SELECT id, label, host, username, database_name, port, created_at
       FROM server_credentials ORDER BY id DESC`
    );
    return NextResponse.json({ ok: true, data: rows });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireApiAuth();
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
    const secret = body.secret?.trim();

    if (!label || !host || !username || !databaseName || !secret) {
      return NextResponse.json(
        { ok: false, error: "label, host, username, database_name, and secret are required" },
        { status: 400 }
      );
    }
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
      return NextResponse.json({ ok: false, error: "Invalid port" }, { status: 400 });
    }

    const encrypted = encryptSecret(secret);
    await pool.query(
      `INSERT INTO server_credentials
      (label, host, username, database_name, port, encrypted_secret, iv, auth_tag)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        label,
        host,
        username,
        databaseName,
        port,
        encrypted.encryptedSecret,
        encrypted.iv,
        encrypted.authTag,
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

