import "dotenv/config";

function mustGet(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const config = {
  port: Number(process.env.PORT ?? "8000"),
  db: {
    host: mustGet("POSTGRES_HOST", "postgres"),
    port: Number(process.env.POSTGRES_PORT ?? "5432"),
    database: mustGet("POSTGRES_DB", "taskflow"),
    user: mustGet("POSTGRES_USER", "taskflow"),
    password: mustGet("POSTGRES_PASSWORD", "taskflow_password"),
  },
  auth: {
    jwtSecret: mustGet("JWT_SECRET"),
    jwtExpiresHours: Number(process.env.JWT_EXPIRES_HOURS ?? "24"),
    bcryptCost: Math.max(12, Number(process.env.BCRYPT_COST ?? "12")),
  },
};

export function databaseUrl() {
  const { host, port, database, user, password } = config.db;
  return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

