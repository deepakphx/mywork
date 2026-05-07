import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireApiAuth } from "@/lib/auth-server";

type WorkLogRow = {
  id: number;
  project_id: number;
  work_date: string;
  work_title: string;
  description: string;
  hours: string | null;
  created_at: string;
  project_name: string;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireApiAuth();
    const [rows] = await pool.query<WorkLogRow[]>(
      `SELECT wl.id, wl.project_id, DATE_FORMAT(wl.work_date, '%Y-%m-%d') AS work_date, wl.work_title, wl.description, wl.hours, wl.created_at, p.project_name
       FROM work_logs wl
       INNER JOIN projects p ON p.id = wl.project_id
       ORDER BY wl.id DESC`
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
      project_id?: number;
      work_date?: string;
      work_title?: string;
      description?: string;
      hours?: number | null;
    };

    const projectId = Number(body.project_id);
    const workDate = body.work_date?.trim();
    const workTitle = body.work_title?.trim();
    const description = body.description?.trim() ?? "";
    const hours =
      body.hours === null || body.hours === undefined || body.hours === ""
        ? null
        : Number(body.hours);

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return NextResponse.json({ ok: false, error: "Valid project_id is required" }, { status: 400 });
    }
    if (!workDate || !workTitle) {
      return NextResponse.json({ ok: false, error: "work_date and work_title are required" }, { status: 400 });
    }
    if (hours !== null && (!Number.isFinite(hours) || hours <= 0)) {
      return NextResponse.json({ ok: false, error: "If provided, hours must be greater than 0" }, { status: 400 });
    }

    await pool.query(
      "INSERT INTO work_logs (project_id, work_date, work_title, description, hours) VALUES (?, ?, ?, ?, ?)",
      [projectId, workDate, workTitle, description, hours]
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
