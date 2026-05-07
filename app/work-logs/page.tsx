import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import pool from "@/lib/db";
import WorkLogsClient, { type WorkLog } from "@/app/work-logs/work-logs-client";

type Project = {
  id: number;
  project_name: string;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function WorkLogsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    redirect("/login");
  }

  try {
    await verifyAuthToken(token);
  } catch {
    redirect("/login");
  }

  const [projects] = await pool.query<Project[]>(
    "SELECT id, project_name FROM projects ORDER BY project_name ASC"
  );

  const [workLogs] = await pool.query<WorkLog[]>(
    `SELECT wl.id, wl.project_id, DATE_FORMAT(wl.work_date, '%Y-%m-%d') AS work_date, wl.work_title, wl.description, wl.hours, p.project_name
     FROM work_logs wl
     INNER JOIN projects p ON p.id = wl.project_id
     ORDER BY wl.id DESC`
  );

  return <WorkLogsClient initialWorkLogs={workLogs} projects={projects} />;
}
