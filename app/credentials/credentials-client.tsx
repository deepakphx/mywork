"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export type Credential = {
  id: number;
  label: string;
  host: string;
  username: string;
  database_name: string;
  port: number;
};

const initialForm = {
  label: "",
  host: "",
  username: "",
  database_name: "",
  port: "3306",
  secret: "",
};

export default function CredentialsClient({
  initialCredentials,
}: {
  initialCredentials: Credential[];
}) {
  const [credentials, setCredentials] = useState(initialCredentials);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [visibleSecrets, setVisibleSecrets] = useState<Record<number, string>>({});

  async function refreshCredentials() {
    const res = await fetch("/api/credentials", { cache: "no-store" });
    const data = (await res.json()) as {
      ok: boolean;
      data?: Credential[];
      error?: string;
    };
    if (!res.ok || !data.ok) {
      throw new Error(data.error ?? "Failed to load credentials");
    }
    setCredentials(data.data ?? []);
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/credentials/${editingId}` : "/api/credentials";
      const payload: Record<string, unknown> = {
        label: form.label,
        host: form.host,
        username: form.username,
        database_name: form.database_name,
        port: Number(form.port),
      };
      if (!editingId || form.secret.trim()) {
        payload.secret = form.secret;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Save failed");

      setForm(initialForm);
      setEditingId(null);
      await refreshCredentials();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(row: Credential) {
    setEditingId(row.id);
    setForm({
      label: row.label,
      host: row.host,
      username: row.username,
      database_name: row.database_name,
      port: String(row.port),
      secret: "",
    });
  }

  async function deleteCredential(id: number) {
    if (!window.confirm("Delete this credential?")) return;
    try {
      const res = await fetch(`/api/credentials/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Delete failed");
      await refreshCredentials();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  async function revealSecret(id: number) {
    const revealPassword = window.prompt("Enter reveal password");
    if (!revealPassword) return;
    try {
      const res = await fetch("/api/credentials/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, reveal_password: revealPassword }),
      });
      const data = (await res.json()) as { ok: boolean; secret?: string; error?: string };
      if (!res.ok || !data.ok || !data.secret) {
        throw new Error(data.error ?? "Reveal failed");
      }
      setVisibleSecrets((prev) => ({ ...prev, [id]: data.secret! }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reveal failed");
    }
  }

  async function setRevealPassword() {
    const current = window.prompt("Current reveal password (leave empty if first setup)") ?? "";
    const next = window.prompt("New reveal password (min 6 chars)") ?? "";
    if (!next) return;
    try {
      const res = await fetch("/api/credentials/reveal-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: current, new_password: next }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Failed to save reveal password");
      window.alert("Reveal password saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save reveal password");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-100 px-4 py-10">
      <main className="mx-auto max-w-6xl rounded-xl border border-zinc-200 bg-white p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Server Credentials</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Stored encrypted. Reveal requires separate password.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void setRevealPassword()}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            >
              Set Reveal Password
            </button>
            <Link className="text-sm font-medium text-zinc-800 hover:text-zinc-600" href="/">
              Back to Dashboard
            </Link>
          </div>
        </div>

        <form onSubmit={submitForm} className="mt-6 grid gap-3 rounded-lg border border-zinc-200 p-4 md:grid-cols-6">
          <input className="rounded-md border border-zinc-300 px-3 py-2" placeholder="Label" value={form.label} onChange={(e) => setForm((s) => ({ ...s, label: e.target.value }))} required />
          <input className="rounded-md border border-zinc-300 px-3 py-2" placeholder="Host" value={form.host} onChange={(e) => setForm((s) => ({ ...s, host: e.target.value }))} required />
          <input className="rounded-md border border-zinc-300 px-3 py-2" placeholder="Username" value={form.username} onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))} required />
          <input className="rounded-md border border-zinc-300 px-3 py-2" placeholder="Database" value={form.database_name} onChange={(e) => setForm((s) => ({ ...s, database_name: e.target.value }))} required />
          <input className="rounded-md border border-zinc-300 px-3 py-2" placeholder="Port" value={form.port} onChange={(e) => setForm((s) => ({ ...s, port: e.target.value }))} required />
          <input className="rounded-md border border-zinc-300 px-3 py-2" type="password" placeholder={editingId ? "New secret (optional)" : "Secret/password"} value={form.secret} onChange={(e) => setForm((s) => ({ ...s, secret: e.target.value }))} required={!editingId} />

          <div className="md:col-span-6 flex gap-2">
            <button type="submit" disabled={saving} className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60">
              {saving ? "Saving..." : editingId ? "Update Credential" : "Add Credential"}
            </button>
            {editingId ? (
              <button type="button" onClick={() => { setEditingId(null); setForm(initialForm); }} className="rounded-md border border-zinc-300 px-4 py-2 text-sm">
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Label</th>
                <th className="px-4 py-3 text-left font-semibold">Host</th>
                <th className="px-4 py-3 text-left font-semibold">Username</th>
                <th className="px-4 py-3 text-left font-semibold">Database</th>
                <th className="px-4 py-3 text-left font-semibold">Port</th>
                <th className="px-4 py-3 text-left font-semibold">Secret</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {credentials.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-zinc-500" colSpan={7}>No credentials yet.</td>
                </tr>
              ) : (
                credentials.map((row) => (
                  <tr key={row.id} className="border-t border-zinc-200">
                    <td className="px-4 py-3">{row.label}</td>
                    <td className="px-4 py-3">{row.host}</td>
                    <td className="px-4 py-3">{row.username}</td>
                    <td className="px-4 py-3">{row.database_name}</td>
                    <td className="px-4 py-3">{row.port}</td>
                    <td className="px-4 py-3 font-mono">
                      {visibleSecrets[row.id] ?? "********"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => void revealSecret(row.id)} className="rounded-md border border-zinc-300 px-3 py-1.5">
                          Visible
                        </button>
                        <button type="button" onClick={() => startEdit(row)} className="rounded-md border border-zinc-300 px-3 py-1.5">
                          Edit
                        </button>
                        <button type="button" onClick={() => void deleteCredential(row.id)} className="rounded-md bg-red-600 px-3 py-1.5 text-white hover:bg-red-700">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

