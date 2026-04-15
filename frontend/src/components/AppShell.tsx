import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <>
      <header className="nav">
        <div className="container navInner">
          <Link to="/projects" className="brand">
            TaskFlow <span className="badge">Task manager</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="muted" style={{ fontSize: 14 }}>
              {user ? (
                <>
                  Signed in as <b style={{ color: "var(--text)" }}>{user.name}</b>
                </>
              ) : null}
            </span>
            <button
              className="btn"
              onClick={() => {
                logout();
                nav("/login");
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="container" style={{ padding: "22px 0 40px" }}>
        {children}
      </main>
    </>
  );
}

