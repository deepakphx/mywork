"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Project = {
  id: number;
  project_name: string;
};

export type WorkLog = {
  id: number;
  project_id: number;
  project_name: string;
  work_date: string;
  work_title: string;
  description: string | null;
  hours: string | null;
};

const initialForm = {
  project_id: "",
  work_date: "",
  work_title: "",
  description: "",
  hours: "",
};

export default function WorkLogsClient({
  initialWorkLogs,
  projects,
}: {
  initialWorkLogs: WorkLog[];
  projects: Project[];
}) {
  const [workLogs, setWorkLogs] = useState<WorkLog[]>(initialWorkLogs);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function refreshWorkLogs() {
    const res = await fetch("/api/work-logs", { cache: "no-store" });
    const data = (await res.json()) as { ok: boolean; data?: WorkLog[]; error?: string };
    if (!res.ok || !data.ok) {
      throw new Error(data.error ?? "Failed to load work logs");
    }
    setWorkLogs(data.data ?? []);
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/work-logs/${editingId}` : "/api/work-logs";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: Number(form.project_id),
          work_date: form.work_date,
          work_title: form.work_title,
          description: form.description.trim() ? form.description : null,
          hours: form.hours.trim() ? Number(form.hours) : null,
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Save failed");
      }

      setForm(initialForm);
      setEditingId(null);
      await refreshWorkLogs();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Save failed";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(workLog: WorkLog) {
    setEditingId(workLog.id);
    setForm({
      project_id: String(workLog.project_id),
      work_date: workLog.work_date.slice(0, 10),
      work_title: workLog.work_title,
      description: workLog.description ?? "",
      hours: workLog.hours ?? "",
    });
  }

  async function deleteWorkLog(id: number) {
    const confirmed = window.confirm("Delete this work log?");
    if (!confirmed) return;

    setError("");
    try {
      const res = await fetch(`/api/work-logs/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Delete failed");
      }
      if (editingId === id) {
        setEditingId(null);
        setForm(initialForm);
      }
      await refreshWorkLogs();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Delete failed";
      setError(message);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-100 px-4 py-10">
      <main className="mx-auto max-w-6xl rounded-xl bg-white border border-zinc-200 p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Work Logs</h1>
            <p className="mt-1 text-sm text-zinc-600">Add, edit, and delete work logs.</p>
          </div>
          <Link className="text-sm font-medium text-zinc-800 hover:text-zinc-600" href="/">
            Back to Dashboard
          </Link>
        </div>

        <form onSubmit={submitForm} className="mt-6 grid gap-3 rounded-lg border border-zinc-200 p-4 md:grid-cols-6">
          <select
            className="rounded-md border border-zinc-300 px-3 py-2 md:col-span-2"
            value={form.project_id}
            onChange={(e) => setForm((s) => ({ ...s, project_id: e.target.value }))}
            required
          >
            <option value="">Select project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.project_name}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="rounded-md border border-zinc-300 px-3 py-2"
            value={form.work_date}
            onChange={(e) => setForm((s) => ({ ...s, work_date: e.target.value }))}
            required
          />
          <input
            className="rounded-md border border-zinc-300 px-3 py-2 md:col-span-2"
            placeholder="Work title"
            value={form.work_title}
            onChange={(e) => setForm((s) => ({ ...s, work_title: e.target.value }))}
            required
          />
          <input
            type="number"
            min="0.1"
            step="0.1"
            className="rounded-md border border-zinc-300 px-3 py-2"
            placeholder="Hours"
            value={form.hours}
            onChange={(e) => setForm((s) => ({ ...s, hours: e.target.value }))}
          />
          <textarea
            className="rounded-md border border-zinc-300 px-3 py-2 md:col-span-6"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
            rows={3}
          />

          <div className="md:col-span-6 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {saving ? "Saving..." : editingId ? "Update Work Log" : "Add Work Log"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(initialForm);
                }}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm"
              >
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
                <th className="px-4 py-3 text-left font-semibold">Project</th>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Title</th>
                <th className="px-4 py-3 text-left font-semibold">Hours</th>
                <th className="px-4 py-3 text-left font-semibold">Description</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workLogs.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-zinc-500" colSpan={6}>
                    No work logs yet.
                  </td>
                </tr>
              ) : (
                workLogs.map((workLog) => (
                  <tr key={workLog.id} className="border-t border-zinc-200 align-top">
                    <td className="px-4 py-3">{workLog.project_name}</td>
                    <td className="px-4 py-3">{workLog.work_date.slice(0, 10)}</td>
                    <td className="px-4 py-3">{workLog.work_title}</td>
                    <td className="px-4 py-3">{workLog.hours ?? "-"}</td>
                    <td className="px-4 py-3 max-w-xs break-words">{workLog.description}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(workLog)}
                          className="rounded-md border border-zinc-300 px-3 py-1.5"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteWorkLog(workLog.id)}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
                        >
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
