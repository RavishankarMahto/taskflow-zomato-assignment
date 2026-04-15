import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Project } from "../lib/api";
import { InlineAlert } from "../components/InlineAlert";

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const r = await api.listProjects();
      setProjects(r.projects);
    } catch (e: any) {
      setErr(e?.body?.error ? `Failed to load projects: ${e.body.error}` : "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const empty = useMemo(() => !loading && !err && projects.length === 0, [loading, err, projects.length]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!name.trim()) return setErr("Project name is required.");
    setCreating(true);
    try {
      const p = await api.createProject({ name: name.trim(), description: description.trim() || undefined });
      setProjects((prev) => [p, ...prev]);
      setName("");
      setDescription("");
      setCreateOpen(false);
    } catch (e: any) {
      setErr(e?.body?.error ? `Create failed: ${e.body.error}` : "Create failed.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0 }}>Projects</h2>
          <div className="muted" style={{ marginTop: 4 }}>
            Projects you own or have tasks assigned in.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" onClick={() => void load()} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button className="btn primary" onClick={() => setCreateOpen((v) => !v)}>
            + New project
          </button>
        </div>
      </div>

      {err ? <InlineAlert tone="error" title="Something went wrong">{err}</InlineAlert> : null}

      {createOpen ? (
        <div className="card">
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Create project</div>
          <form onSubmit={onCreate} style={{ display: "grid", gap: 12 }}>
            <div className="row">
              <div>
                <label className="muted" style={{ fontSize: 13 }}>
                  Name
                </label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="muted" style={{ fontSize: 13 }}>
                  Description (optional)
                </label>
                <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn" type="button" onClick={() => setCreateOpen(false)} disabled={creating}>
                Cancel
              </button>
              <button className="btn primary" type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {loading ? (
        <div className="card">Loading projects…</div>
      ) : empty ? (
        <InlineAlert tone="info" title="No projects yet">
          Create your first project to start tracking tasks.
        </InlineAlert>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {projects.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`} className="card" style={{ display: "block" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div style={{ fontWeight: 900 }}>{p.name}</div>
                <span className="badge">Open</span>
              </div>
              <div className="muted" style={{ marginTop: 6 }}>
                {p.description || "—"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

