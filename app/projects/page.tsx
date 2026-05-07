import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import pool from "@/lib/db";
import ProjectsClient, { type Project } from "@/app/projects/projects-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type ProjectRow = RowDataPacket & Project;

export default async function ProjectsPage() {
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

  const [projects] = await pool.query<ProjectRow[]>(
    "SELECT id, project_name, client_name, status FROM projects ORDER BY id DESC"
  );

  return <ProjectsClient initialProjects={projects} />;
}
