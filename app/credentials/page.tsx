import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import pool from "@/lib/db";
import CredentialsClient, { type Credential } from "@/app/credentials/credentials-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type CredentialRow = RowDataPacket & Credential;

export default async function CredentialsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) redirect("/login");
  try {
    await verifyAuthToken(token);
  } catch {
    redirect("/login");
  }

  const [rows] = await pool.query<CredentialRow[]>(
    `SELECT id, label, host, username, database_name, port
     FROM server_credentials ORDER BY id DESC`
  );

  return <CredentialsClient initialCredentials={rows} />;
}
