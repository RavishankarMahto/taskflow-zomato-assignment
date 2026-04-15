export function prettyDate(s: string | null | undefined) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

export function titleCaseStatus(s: string) {
  if (s === "in_progress") return "In progress";
  if (s === "todo") return "To do";
  if (s === "done") return "Done";
  return s;
}

