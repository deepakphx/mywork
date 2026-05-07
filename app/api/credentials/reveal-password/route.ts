import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { requireApiAuth } from "@/lib/auth-server";

type SettingRow = RowDataPacket & { reveal_password_hash: string | null };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireApiAuth();
    const body = (await request.json()) as {
      new_password?: string;
      current_password?: string;
    };

    const newPassword = body.new_password ?? "";
    const currentPassword = body.current_password ?? "";
    if (newPassword.length < 6) {
      return NextResponse.json(
        { ok: false, error: "New reveal password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const [settingRows] = await pool.query<SettingRow[]>(
      "SELECT reveal_password_hash FROM security_settings WHERE id = 1 LIMIT 1"
    );
    const existingHash = settingRows[0]?.reveal_password_hash;

    if (existingHash) {
      const isValid = await bcrypt.compare(currentPassword, existingHash);
      if (!isValid) {
        return NextResponse.json(
          { ok: false, error: "Current reveal password is incorrect" },
          { status: 401 }
        );
      }
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      `INSERT INTO security_settings (id, reveal_password_hash)
       VALUES (1, ?)
       ON DUPLICATE KEY UPDATE reveal_password_hash = VALUES(reveal_password_hash)`,
      [newHash]
    );

    return NextResponse.json({ ok: true, message: "Reveal password saved" });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
