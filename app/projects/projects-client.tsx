"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export type Project = {
  id: number;
  project_name: string;
  client_name: string;
  status: "active" | "completed";
};

const initialForm = { project_name: "", client_name: "", status: "active" as const };

export default function ProjectsClient({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function refreshProjects() {
    const res = await fetch("/api/projects", { cache: "no-store" });
    const data = (await res.json()) as { ok: boolean; data?: Project[]; error?: string };
    if (!res.ok || !data.ok) {
      throw new Error(data.error ?? "Failed to load projects");
    }
    setProjects(data.data ?? []);
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/projects/${editingId}` : "/api/projects";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Save failed");
      }

      setForm(initialForm);
      setEditingId(null);
      await refreshProjects();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Save failed";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(project: Project) {
    setEditingId(project.id);
    setForm({
      project_name: project.project_name,
      client_name: project.client_name,
      status: project.status,
    });
  }

  async function deleteProject(id: number) {
    const confirmed = window.confirm("Delete this project?");
    if (!confirmed) return;

    setError("");
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Delete failed");
      }
      if (editingId === id) {
        setEditingId(null);
        setForm(initialForm);
      }
      await refreshProjects();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Delete failed";
      setError(message);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-100 px-4 py-10">
      <main className="mx-auto max-w-5xl rounded-xl bg-white border border-zinc-200 p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Projects</h1>
            <p className="mt-1 text-sm text-zinc-600">Add, edit, and delete projects.</p>
          </div>
          <Link className="text-sm font-medium text-zinc-800 hover:text-zinc-600" href="/">
            Back to Dashboard
          </Link>
        </div>

        <form onSubmit={submitForm} className="mt-6 grid gap-3 rounded-lg border border-zinc-200 p-4 md:grid-cols-4">
          <input
            className="rounded-md border border-zinc-300 px-3 py-2 md:col-span-2"
            placeholder="Project name"
            value={form.project_name}
            onChange={(e) => setForm((s) => ({ ...s, project_name: e.target.value }))}
            required
          />
          <input
            className="rounded-md border border-zinc-300 px-3 py-2"
            placeholder="Client name"
            value={form.client_name}
            onChange={(e) => setForm((s) => ({ ...s, client_name: e.target.value }))}
            required
          />
          <select
            className="rounded-md border border-zinc-300 px-3 py-2"
            value={form.status}
            onChange={(e) =>
              setForm((s) => ({ ...s, status: e.target.value as "active" | "completed" }))
            }
          >
            <option value="active">active</option>
            <option value="completed">completed</option>
          </select>

          <div className="md:col-span-4 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {saving ? "Saving..." : editingId ? "Update Project" : "Add Project"}
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
                <th className="px-4 py-3 text-left font-semibold">Client</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-zinc-500" colSpan={4}>
                    No projects yet.
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id} className="border-t border-zinc-200">
                    <td className="px-4 py-3">{project.project_name}</td>
                    <td className="px-4 py-3">{project.client_name}</td>
                    <td className="px-4 py-3">{project.status}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(project)}
                          className="rounded-md border border-zinc-300 px-3 py-1.5"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteProject(project.id)}
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

