import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { AUTH_COOKIE_NAME, signAuthToken } from "@/lib/auth";

type AdminRow = {
  id: number;
  username: string;
  password_hash: string;
};

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

    if (!username || !password) {
      return NextResponse.json(
        { ok: false, error: "username and password are required" },
        { status: 400 }
      );
    }

    const [rows] = await pool.query<AdminRow[]>(
      "SELECT id, username, password_hash FROM admin WHERE username = ? LIMIT 1",
      [username]
    );
    const admin = rows[0];

    if (!admin) {
      return NextResponse.json(
        { ok: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { ok: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await signAuthToken({ username: admin.username });
    const response = NextResponse.json({ ok: true, message: "Login successful" });
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

