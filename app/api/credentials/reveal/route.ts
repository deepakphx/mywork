import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireApiAuth } from "@/lib/auth-server";
import { decryptSecret } from "@/lib/credentials-crypto";

type SettingRow = { reveal_password_hash: string | null };
type CredentialRow = { encrypted_secret: string; iv: string; auth_tag: string };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireApiAuth();
    const body = (await request.json()) as {
      id?: number;
      reveal_password?: string;
    };

    const id = Number(body.id);
    const revealPassword = body.reveal_password ?? "";
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid credential id" }, { status: 400 });
    }
    if (!revealPassword) {
      return NextResponse.json({ ok: false, error: "Reveal password is required" }, { status: 400 });
    }

    const [settingRows] = await pool.query<SettingRow[]>(
      "SELECT reveal_password_hash FROM security_settings WHERE id = 1 LIMIT 1"
    );
    const revealHash = settingRows[0]?.reveal_password_hash;
    if (!revealHash) {
      return NextResponse.json(
        { ok: false, error: "Reveal password not configured yet" },
        { status: 400 }
      );
    }

    const isValid = await bcrypt.compare(revealPassword, revealHash);
    if (!isValid) {
      return NextResponse.json({ ok: false, error: "Invalid reveal password" }, { status: 401 });
    }

    const [credRows] = await pool.query<CredentialRow[]>(
      "SELECT encrypted_secret, iv, auth_tag FROM server_credentials WHERE id = ? LIMIT 1",
      [id]
    );
    const row = credRows[0];
    if (!row) {
      return NextResponse.json({ ok: false, error: "Credential not found" }, { status: 404 });
    }

    const secret = decryptSecret({
      encryptedSecret: row.encrypted_secret,
      iv: row.iv,
      authTag: row.auth_tag,
    });

    return NextResponse.json({ ok: true, secret });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

