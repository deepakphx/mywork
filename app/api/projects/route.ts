import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { requireApiAuth } from "@/lib/auth-server";

type Project = RowDataPacket & {
  id: number;
  project_name: string;
  client_name: string;
  status: "active" | "completed";
  created_at: string;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireApiAuth();
    const [rows] = await pool.query<Project[]>(
      "SELECT id, project_name, client_name, status, created_at FROM projects ORDER BY id DESC"
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
      project_name?: string;
      client_name?: string;
      status?: "active" | "completed";
    };

    const projectName = body.project_name?.trim();
    const clientName = body.client_name?.trim();
    const status = body.status === "completed" ? "completed" : "active";

    if (!projectName || !clientName) {
      return NextResponse.json(
        { ok: false, error: "project_name and client_name are required" },
        { status: 400 }
      );
    }

    const [result] = await pool.query(
      "INSERT INTO projects (project_name, client_name, status) VALUES (?, ?, ?)",
      [projectName, clientName, status]
    );

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
