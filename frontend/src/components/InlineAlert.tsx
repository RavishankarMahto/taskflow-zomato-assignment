export function InlineAlert({
  tone,
  title,
  children,
}: {
  tone: "error" | "info";
  title: string;
  children?: React.ReactNode;
}) {
  const bg = tone === "error" ? "rgba(226,55,68,0.12)" : "rgba(124,58,237,0.12)";
  const border = tone === "error" ? "rgba(226,55,68,0.35)" : "rgba(124,58,237,0.35)";
  return (
    <div className="card" style={{ background: bg, borderColor: border }}>
      <div style={{ fontWeight: 800 }}>{title}</div>
      {children ? <div className="muted" style={{ marginTop: 6 }}>{children}</div> : null}
    </div>
  );
}

