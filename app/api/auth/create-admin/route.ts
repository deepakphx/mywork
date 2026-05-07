import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";

type CountRow = RowDataPacket & { total: number };
type AdminRow = RowDataPacket & { id: number };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };

    const username = body.username?.trim();
    const password = body.password;

    if (!username || !password || password.length < 6) {
      return NextResponse.json(
        { ok: false, error: "username and password (min 6 chars) are required" },
        { status: 400 }
      );
    }

    const [countRows] = await pool.query<CountRow[]>(
      "SELECT COUNT(*) AS total FROM admin"
    );
    if (countRows[0]?.total > 0) {
      return NextResponse.json(
        { ok: false, error: "Admin user already exists" },
        { status: 409 }
      );
    }

    const [existingRows] = await pool.query<AdminRow[]>(
      "SELECT id FROM admin WHERE username = ? LIMIT 1",
      [username]
    );
    if (existingRows.length > 0) {
      return NextResponse.json(
        { ok: false, error: "Username already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await pool.query("INSERT INTO admin (username, password_hash) VALUES (?, ?)", [
      username,
      passwordHash,
    ]);

    return NextResponse.json({ ok: true, message: "Admin created successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
