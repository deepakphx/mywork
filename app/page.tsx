import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

export default async function Home() {
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

  return (
    <div className="min-h-screen bg-zinc-100 px-4 py-10">
      <main className="mx-auto max-w-5xl rounded-xl bg-white border border-zinc-200 p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Dman Logs</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Authenticated admin dashboard.
            </p>
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Logout
            </button>
          </form>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <section className="rounded-lg border border-zinc-200 p-4">
            <h2 className="text-base font-semibold text-zinc-900">Projects</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Manage active and completed projects.
            </p>
            <Link
              href="/projects"
              className="mt-3 inline-block rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Open Projects
            </Link>
          </section>
          <section className="rounded-lg border border-zinc-200 p-4">
            <h2 className="text-base font-semibold text-zinc-900">Work Logs</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Track work entries with date, hours, and descriptions.
            </p>
            <Link
              href="/work-logs"
              className="mt-3 inline-block rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Open Work Logs
            </Link>
          </section>
          <section className="rounded-lg border border-zinc-200 p-4 md:col-span-2">
            <h2 className="text-base font-semibold text-zinc-900">Credentials Vault</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Encrypted server credentials with separate reveal password.
            </p>
            <Link
              href="/credentials"
              className="mt-3 inline-block rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Open Credentials
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
