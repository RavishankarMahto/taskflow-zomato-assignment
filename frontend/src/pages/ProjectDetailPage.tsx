import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type Task } from "../lib/api";
import { InlineAlert } from "../components/InlineAlert";
import { prettyDate, titleCaseStatus } from "../lib/format";

type TaskDraft = {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  status?: "todo" | "in_progress" | "done";
  due_date?: string | null;
  assignee_id?: string | null;
};

export function ProjectDetailPage() {
  const { id } = useParams();
  const projectId = id!;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("");

  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<TaskDraft>({ title: "", priority: "medium", status: "todo" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const r = await api.getProject(projectId);
      setProject(r);
      setTasks(r.tasks);
    } catch (e: any) {
      setErr(e?.body?.error ? `Failed to load: ${e.body.error}` : "Failed to load project.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [projectId]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false;
      if (assigneeFilter && (t.assignee_id || "") !== assigneeFilter) return false;
      return true;
    });
  }, [tasks, statusFilter, assigneeFilter]);

  async function createTask() {
    if (!draft.title.trim()) return setErr("Task title is required.");
    setSaving(true);
    setErr(null);
    try {
      const created = await api.createTask(projectId, {
        title: draft.title.trim(),
        description: draft.description || undefined,
        priority: draft.priority,
        status: draft.status,
        due_date: draft.due_date ?? null,
        assignee_id: draft.assignee_id ?? null,
      });
      setTasks((prev) => [created, ...prev]);
      setDraft({ title: "", priority: "medium", status: "todo" });
      setModalOpen(false);
    } catch (e: any) {
      setErr(e?.body?.error ? `Create failed: ${e.body.error}` : "Create failed.");
    } finally {
      setSaving(false);
    }
  }

  async function optimisticStatus(taskId: string, next: Task["status"]) {
    const prev = tasks;
    setTasks((t) => t.map((x) => (x.id === taskId ? { ...x, status: next } : x)));
    try {
      await api.updateTask(taskId, { status: next });
    } catch {
      setTasks(prev);
      setErr("Update failed. Reverted.");
    }
  }

  async function removeTask(taskId: string) {
    const prev = tasks;
    setTasks((t) => t.filter((x) => x.id !== taskId));
    try {
      await api.deleteTask(taskId);
    } catch {
      setTasks(prev);
      setErr("Delete failed. Reverted.");
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div className="muted" style={{ fontSize: 14 }}>
            <Link to="/projects" style={{ textDecoration: "underline" }}>
              Projects
            </Link>{" "}
            / Project
          </div>
          <h2 style={{ margin: "6px 0 0" }}>{project?.name ?? (loading ? "Loading…" : "Project")}</h2>
          {project?.description ? <div className="muted" style={{ marginTop: 6 }}>{project.description}</div> : null}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" onClick={() => void load()} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button className="btn primary" onClick={() => setModalOpen(true)}>
            + New task
          </button>
        </div>
      </div>

      {err ? <InlineAlert tone="error" title="Action needed">{err}</InlineAlert> : null}

      <div className="card" style={{ display: "grid", gap: 12 }}>
        <div className="row">
          <div>
            <label className="muted" style={{ fontSize: 13 }}>
              Filter by status
            </label>
            <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label className="muted" style={{ fontSize: 13 }}>
              Filter by assignee (UUID)
            </label>
            <input className="input" value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} placeholder="optional" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card">Loading tasks…</div>
      ) : filtered.length === 0 ? (
        <InlineAlert tone="info" title="No tasks match your filters">
          Try clearing filters or create a new task.
        </InlineAlert>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((t) => (
            <div key={t.id} className="card" style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div style={{ fontWeight: 900 }}>{t.title}</div>
                <span className="badge">{titleCaseStatus(t.status)}</span>
              </div>
              {t.description ? <div className="muted">{t.description}</div> : null}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                <div className="muted" style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 14 }}>
                  <span>Priority: <b style={{ color: "var(--text)" }}>{t.priority}</b></span>
                  <span>Due: <b style={{ color: "var(--text)" }}>{prettyDate(t.due_date)}</b></span>
                  <span>Assignee: <b style={{ color: "var(--text)" }}>{t.assignee_id ?? "—"}</b></span>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <select
                    className="select"
                    value={t.status}
                    onChange={(e) => void optimisticStatus(t.id, e.target.value as Task["status"])}
                  >
                    <option value="todo">To do</option>
                    <option value="in_progress">In progress</option>
                    <option value="done">Done</option>
                  </select>
                  <button className="btn" onClick={() => void removeTask(t.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
          onClick={() => !saving && setModalOpen(false)}
        >
          <div className="card" style={{ width: "min(720px, 100%)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 18 }}>Create task</div>
              <button className="btn" onClick={() => setModalOpen(false)} disabled={saving}>
                Close
              </button>
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
              <div>
                <label className="muted" style={{ fontSize: 13 }}>
                  Title
                </label>
                <input className="input" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
              </div>

              <div>
                <label className="muted" style={{ fontSize: 13 }}>
                  Description (optional)
                </label>
                <textarea
                  className="textarea"
                  value={draft.description ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                />
              </div>

              <div className="row">
                <div>
                  <label className="muted" style={{ fontSize: 13 }}>
                    Status
                  </label>
                  <select
                    className="select"
                    value={draft.status}
                    onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as any }))}
                  >
                    <option value="todo">To do</option>
                    <option value="in_progress">In progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="muted" style={{ fontSize: 13 }}>
                    Priority
                  </label>
                  <select
                    className="select"
                    value={draft.priority}
                    onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value as any }))}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="row">
                <div>
                  <label className="muted" style={{ fontSize: 13 }}>
                    Due date (YYYY-MM-DD)
                  </label>
                  <input
                    className="input"
                    value={draft.due_date ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, due_date: e.target.value || null }))}
                    placeholder="2026-04-20"
                  />
                </div>
                <div>
                  <label className="muted" style={{ fontSize: 13 }}>
                    Assignee id (UUID, optional)
                  </label>
                  <input
                    className="input"
                    value={draft.assignee_id ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, assignee_id: e.target.value || null }))}
                    placeholder="leave blank for unassigned"
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button className="btn" onClick={() => setModalOpen(false)} disabled={saving}>
                  Cancel
                </button>
                <button className="btn primary" onClick={() => void createTask()} disabled={saving}>
                  {saving ? "Creating..." : "Create task"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

