import bcrypt from "bcryptjs";
import { config } from "./config.js";
import { pool } from "./db.js";

async function upsertTestData() {
  const email = "test@example.com";
  const password = "password123";
  const passwordHash = await bcrypt.hash(password, config.auth.bcryptCost);

  const userRes = await pool.query(
    `
    INSERT INTO users (name, email, password_hash)
    VALUES ($1, $2, $3)
    ON CONFLICT (email)
    DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash
    RETURNING id, name, email
    `,
    ["Test User", email, passwordHash]
  );
  const user = userRes.rows[0] as { id: string; name: string; email: string };

  const projectRes = await pool.query(
    `
    INSERT INTO projects (name, description, owner_id)
    VALUES ($1, $2, $3)
    RETURNING id
    `,
    ["Demo Project", "Seeded project for reviewer", user.id]
  );
  const projectId = projectRes.rows[0].id as string;

  await pool.query(
    `
    INSERT INTO tasks (title, description, status, priority, project_id, assignee_id, due_date, created_by)
    VALUES
      ($1,$2,'todo','high',$3,$4,$5,$6),
      ($7,$8,'in_progress','medium',$3,$4,$9,$6),
      ($10,$11,'done','low',$3,$4,$12,$6)
    `,
    [
      "Set up environment",
      "Run docker compose up --build",
      projectId,
      user.id,
      "2026-04-20",
      user.id,
      "Try the app",
      "Login with the seeded user",
      "2026-04-21",
      "Review API",
      "Explore Swagger and endpoints",
      "2026-04-22",
    ]
  );
}

async function main() {
  try {
    await upsertTestData();
  } finally {
    // keep pool open for container reuse; but seed is one-shot
    await pool.end();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Seed failed:", err);
  process.exit(1);
});

