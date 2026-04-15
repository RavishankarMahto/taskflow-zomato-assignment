export type ApiError =
  | { error: "validation failed"; fields?: Record<string, string> }
  | { error: "unauthorized" }
  | { error: "forbidden" }
  | { error: "not found" }
  | { error: string };

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

function mustApiUrl() {
  if (!API_URL) throw new Error("Missing VITE_API_URL");
  return API_URL.replace(/\/+$/, "");
}

export function getToken() {
  return localStorage.getItem("taskflow_token");
}

export function setToken(token: string | null) {
  if (!token) localStorage.removeItem("taskflow_token");
  else localStorage.setItem("taskflow_token", token);
}

export type User = { id: string; name: string; email: string };

export function getStoredUser(): User | null {
  const raw = localStorage.getItem("taskflow_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null) {
  if (!user) localStorage.removeItem("taskflow_user");
  else localStorage.setItem("taskflow_user", JSON.stringify(user));
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${mustApiUrl()}${path}`, { ...init, headers });
  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw { status: res.status, body: (body ?? { error: res.statusText }) as ApiError } as const;
  }
  return body as T;
}

export type Project = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  project_id: string;
  assignee_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
};

export const api = {
  async register(input: { name: string; email: string; password: string }) {
    return request<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  async login(input: { email: string; password: string }) {
    return request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  async listProjects() {
    return request<{ projects: Project[] }>("/projects");
  },
  async createProject(input: { name: string; description?: string }) {
    return request<Project>("/projects", { method: "POST", body: JSON.stringify(input) });
  },
  async getProject(id: string) {
    return request<Project & { tasks: Task[] }>(`/projects/${id}`);
  },
  async updateProject(id: string, input: { name?: string; description?: string }) {
    return request<Project>(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(input) });
  },
  async deleteProject(id: string) {
    await request<null>(`/projects/${id}`, { method: "DELETE" });
  },
  async listTasks(projectId: string, filters?: { status?: string; assignee?: string }) {
    const qs = new URLSearchParams();
    if (filters?.status) qs.set("status", filters.status);
    if (filters?.assignee) qs.set("assignee", filters.assignee);
    const q = qs.toString();
    return request<{ tasks: Task[] }>(`/projects/${projectId}/tasks${q ? `?${q}` : ""}`);
  },
  async createTask(projectId: string, input: Partial<Task> & { title: string }) {
    return request<Task>(`/projects/${projectId}/tasks`, { method: "POST", body: JSON.stringify(input) });
  },
  async updateTask(id: string, input: Partial<Task>) {
    return request<Task>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(input) });
  },
  async deleteTask(id: string) {
    await request<null>(`/tasks/${id}`, { method: "DELETE" });
  },
};

