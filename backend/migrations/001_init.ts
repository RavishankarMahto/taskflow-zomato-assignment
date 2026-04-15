import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createExtension("pgcrypto", { ifNotExists: true });

  pgm.createType("task_status", ["todo", "in_progress", "done"]);
  pgm.createType("task_priority", ["low", "medium", "high"]);

  pgm.createTable("users", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    name: { type: "text", notNull: true },
    email: { type: "text", notNull: true, unique: true },
    password_hash: { type: "text", notNull: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
  pgm.createIndex("users", "email", { name: "ux_users_email", unique: true });

  pgm.createTable("projects", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    name: { type: "text", notNull: true },
    description: { type: "text" },
    owner_id: { type: "uuid", notNull: true, references: "users", onDelete: "cascade" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
  pgm.createIndex("projects", "owner_id", { name: "ix_projects_owner_id" });

  pgm.createTable("tasks", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    title: { type: "text", notNull: true },
    description: { type: "text" },
    status: { type: "task_status", notNull: true, default: "todo" },
    priority: { type: "task_priority", notNull: true, default: "medium" },
    project_id: { type: "uuid", notNull: true, references: "projects", onDelete: "cascade" },
    assignee_id: { type: "uuid", references: "users", onDelete: "set null" },
    due_date: { type: "date" },
    created_by: { type: "uuid", notNull: true, references: "users", onDelete: "cascade" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
  pgm.createIndex("tasks", "project_id", { name: "ix_tasks_project_id" });
  pgm.createIndex("tasks", "assignee_id", { name: "ix_tasks_assignee_id" });
  pgm.createIndex("tasks", "status", { name: "ix_tasks_status" });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("tasks", "status", { name: "ix_tasks_status" });
  pgm.dropIndex("tasks", "assignee_id", { name: "ix_tasks_assignee_id" });
  pgm.dropIndex("tasks", "project_id", { name: "ix_tasks_project_id" });
  pgm.dropTable("tasks");

  pgm.dropIndex("projects", "owner_id", { name: "ix_projects_owner_id" });
  pgm.dropTable("projects");

  pgm.dropIndex("users", "email", { name: "ux_users_email" });
  pgm.dropTable("users");

  pgm.dropType("task_priority");
  pgm.dropType("task_status");
}

