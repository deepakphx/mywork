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

    await pool.query(
      "UPDATE projects SET project_name = ?, client_name = ?, status = ? WHERE id = ?",
      [projectName, clientName, status, id]
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

    await pool.query("DELETE FROM projects WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

