import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { InlineAlert } from "../components/InlineAlert";

export function RegisterPage() {
  const nav = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!name.trim()) return setErr("Name is required.");
    if (!email.trim()) return setErr("Email is required.");
    if (password.length < 8) return setErr("Password must be at least 8 characters.");
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      nav("/projects");
    } catch (e: any) {
      const fields = e?.body?.fields as Record<string, string> | undefined;
      if (fields?.email) setErr(`Email ${fields.email}`);
      else setErr("Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ padding: "40px 0" }}>
      <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ margin: 0 }}>Create your account</h2>
          <span className="badge">TaskFlow</span>
        </div>
        <p className="muted" style={{ marginTop: 6 }}>
          You’ll be able to create projects and manage tasks.
        </p>

        <form onSubmit={onSubmit} style={{ marginTop: 16, display: "grid", gap: 12 }}>
          {err ? <InlineAlert tone="error" title="Couldn’t register">{err}</InlineAlert> : null}

          <div className="row">
            <div>
              <label className="muted" style={{ fontSize: 13 }}>
                Name
              </label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="muted" style={{ fontSize: 13 }}>
                Email
              </label>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="muted" style={{ fontSize: 13 }}>
              Password
            </label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="min 8 characters"
            />
          </div>

          <button className="btn primary" disabled={loading} type="submit">
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <div className="muted" style={{ marginTop: 14, fontSize: 14 }}>
          Already have an account? <Link to="/login" style={{ textDecoration: "underline" }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}

