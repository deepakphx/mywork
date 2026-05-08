import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireApiAuth } from "@/lib/auth-server";

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
      project_id?: number;
      work_date?: string;
      work_title?: string;
      description?: string;
      hours?: number | string | null;
    };

    const projectId = Number(body.project_id);
    const workDate = body.work_date?.trim();
    const workTitle = body.work_title?.trim();
    const description = body.description?.trim() ?? "";
    const hoursValue =
      typeof body.hours === "string" ? body.hours.trim() : body.hours;
    const hours =
      hoursValue === null || hoursValue === undefined || hoursValue === ""
        ? null
        : Number(hoursValue);

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
      "UPDATE work_logs SET project_id = ?, work_date = ?, work_title = ?, description = ?, hours = ? WHERE id = ?",
      [projectId, workDate, workTitle, description, hours, id]
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

    await pool.query("DELETE FROM work_logs WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
