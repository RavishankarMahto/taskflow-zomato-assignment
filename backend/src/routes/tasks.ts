import { Router, Request, Response, NextFunction } from "express";
import Joi from "joi";

import { requireAuth } from "../auth/middleware.js";
import { asyncHandler } from "../http/asyncHandler.js";
import { validate } from "../http/validate.js";
import { pool } from "../db.js";
import { forbidden, notFound } from "../http/errors.js";

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

// GET tasks
tasksRouter.get(
  "/projects/:id/tasks",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.id;
      const userId = req.user!.id;

      const status =
        typeof req.query.status === "string" ? req.query.status : undefined;
      const assignee =
        typeof req.query.assignee === "string"
          ? req.query.assignee
          : undefined;

      const access = await pool.query(
        `
        SELECT 1
        FROM projects p
        LEFT JOIN tasks t ON t.project_id = p.id AND t.assignee_id = $2
        WHERE p.id = $1 AND (p.owner_id = $2 OR t.assignee_id = $2)
        LIMIT 1
        `,
        [projectId, userId]
      );

      if (access.rowCount === 0) throw notFound();

      const clauses: string[] = ["project_id = $1"];
      const params: unknown[] = [projectId];

      if (status) {
        params.push(status);
        clauses.push(`status = $${params.length}`);
      }

      if (assignee) {
        params.push(assignee);
        clauses.push(`assignee_id = $${params.length}`);
      }

      const q = `SELECT * FROM tasks WHERE ${clauses.join(
        " AND "
      )} ORDER BY created_at DESC`;

      const r = await pool.query(q, params);

      res.json({ tasks: r.rows });
    } catch (e) {
      next(e);
    }
  })
);

// CREATE task
const createSchema = Joi.object({
  title: Joi.string().min(1).required(),
  description: Joi.string().allow("").optional(),
  status: Joi.string().valid("todo", "in_progress", "done").optional(),
  priority: Joi.string().valid("low", "medium", "high").optional(),
  assignee_id: Joi.string().uuid().allow(null).optional(),
  due_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .allow(null)
    .optional(),
});

tasksRouter.post(
  "/projects/:id/tasks",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.id;
      const userId = req.user!.id;
      const body = validate(createSchema, req.body);

      const ownerCheck = await pool.query(
        `SELECT owner_id FROM projects WHERE id = $1`,
        [projectId]
      );

      if (ownerCheck.rowCount === 0) throw notFound();
      if (ownerCheck.rows[0].owner_id !== userId) throw forbidden();

      const r = await pool.query(
        `
        INSERT INTO tasks (title, description, status, priority, project_id, assignee_id, due_date, created_by)
        VALUES ($1,$2,COALESCE($3,'todo'),COALESCE($4,'medium'),$5,$6,$7,$8)
        RETURNING *
        `,
        [
          body.title,
          body.description || null,
          body.status ?? null,
          body.priority ?? null,
          projectId,
          body.assignee_id ?? null,
          body.due_date ?? null,
          userId,
        ]
      );

      res.status(201).json(r.rows[0]);
    } catch (e) {
      next(e);
    }
  })
);

// UPDATE task
const patchSchema = Joi.object({
  title: Joi.string().min(1).optional(),
  description: Joi.string().allow("").optional(),
  status: Joi.string().valid("todo", "in_progress", "done").optional(),
  priority: Joi.string().valid("low", "medium", "high").optional(),
  assignee_id: Joi.string().uuid().allow(null).optional(),
  due_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .allow(null)
    .optional(),
});

tasksRouter.patch(
  "/tasks/:id",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const taskId = req.params.id;
      const userId = req.user!.id;
      const body = validate(patchSchema, req.body);

      const existing = await pool.query(
        `SELECT id, project_id, created_by FROM tasks WHERE id = $1`,
        [taskId]
      );

      if (existing.rowCount === 0) throw notFound();

      const task = existing.rows[0];

      const project = await pool.query(
        `SELECT owner_id FROM projects WHERE id = $1`,
        [task.project_id]
      );

      if (project.rowCount === 0) throw notFound();

      const ownerId = project.rows[0].owner_id;

      if (ownerId !== userId && task.created_by !== userId)
        throw forbidden();

      const r = await pool.query(
        `
        UPDATE tasks
        SET
          title = COALESCE($2, title),
          description = COALESCE($3, description),
          status = COALESCE($4, status),
          priority = COALESCE($5, priority),
          assignee_id = COALESCE($6, assignee_id),
          due_date = COALESCE($7, due_date),
          updated_at = now()
        WHERE id = $1
        RETURNING *
        `,
        [
          taskId,
          body.title ?? null,
          body.description ?? null,
          body.status ?? null,
          body.priority ?? null,
          body.assignee_id ?? null,
          body.due_date ?? null,
        ]
      );

      res.json(r.rows[0]);
    } catch (e) {
      next(e);
    }
  })
);

// DELETE task
tasksRouter.delete(
  "/tasks/:id",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const taskId = req.params.id;
      const userId = req.user!.id;

      const existing = await pool.query(
        `SELECT id, project_id, created_by FROM tasks WHERE id = $1`,
        [taskId]
      );

      if (existing.rowCount === 0) throw notFound();

      const task = existing.rows[0];

      const project = await pool.query(
        `SELECT owner_id FROM projects WHERE id = $1`,
        [task.project_id]
      );

      if (project.rowCount === 0) throw notFound();

      const ownerId = project.rows[0].owner_id;

      if (ownerId !== userId && task.created_by !== userId)
        throw forbidden();

      await pool.query(`DELETE FROM tasks WHERE id = $1`, [taskId]);

      res.status(204).send();
    } catch (e) {
      next(e);
    }
  })
);