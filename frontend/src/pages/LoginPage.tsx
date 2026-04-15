import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { InlineAlert } from "../components/InlineAlert";

export function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!email.trim()) return setErr("Email is required.");
    if (!password.trim()) return setErr("Password is required.");
    setLoading(true);
    try {
      await login(email.trim(), password);
      nav("/projects");
    } catch (e: any) {
      const msg = e?.body?.error === "unauthorized" ? "Invalid email or password." : "Login failed.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ padding: "40px 0" }}>
      <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ margin: 0 }}>Welcome back</h2>
          <span className="badge">JWT Auth</span>
        </div>
        <p className="muted" style={{ marginTop: 6 }}>
          Sign in to manage your projects and tasks.
        </p>

        <form onSubmit={onSubmit} style={{ marginTop: 16, display: "grid", gap: 12 }}>
          {err ? <InlineAlert tone="error" title="Couldn’t sign in">{err}</InlineAlert> : null}

          <div>
            <label className="muted" style={{ fontSize: 13 }}>
              Email
            </label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
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
            />
          </div>

          <button className="btn primary" disabled={loading} type="submit">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="muted" style={{ marginTop: 14, fontSize: 14 }}>
          New here? <Link to="/register" style={{ textDecoration: "underline" }}>Create an account</Link>
        </div>
      </div>
    </div>
  );
}

