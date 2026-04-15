import { Router, Request, Response, NextFunction } from "express";
import Joi from "joi";

import { requireAuth } from "../auth/middleware.js";
import { asyncHandler } from "../http/asyncHandler.js";
import { validate } from "../http/validate.js";
import { pool } from "../db.js";
import { forbidden, notFound } from "../http/errors.js";

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

// GET all projects
projectsRouter.get(
  "/",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;

      const r = await pool.query(
        `
        SELECT DISTINCT p.*
        FROM projects p
        LEFT JOIN tasks t ON t.project_id = p.id
        WHERE p.owner_id = $1 OR t.assignee_id = $1
        ORDER BY p.created_at DESC
        `,
        [userId]
      );

      res.json({ projects: r.rows });
    } catch (e) {
      next(e);
    }
  })
);

// CREATE project
const createSchema = Joi.object({
  name: Joi.string().min(1).required(),
  description: Joi.string().allow("").optional(),
});

projectsRouter.post(
  "/",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const body = validate(createSchema, req.body);

      const r = await pool.query(
        `
        INSERT INTO projects (name, description, owner_id)
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [body.name, body.description || null, userId]
      );

      res.status(201).json(r.rows[0]);
    } catch (e) {
      next(e);
    }
  })
);

// GET single project
projectsRouter.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.id;
      const userId = req.user!.id;

      const pr = await pool.query(
        `
        SELECT p.*
        FROM projects p
        LEFT JOIN tasks t ON t.project_id = p.id AND t.assignee_id = $2
        WHERE p.id = $1 AND (p.owner_id = $2 OR t.assignee_id = $2)
        LIMIT 1
        `,
        [projectId, userId]
      );

      if (pr.rowCount === 0) throw notFound();

      const tr = await pool.query(
        `SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at DESC`,
        [projectId]
      );

      res.json({ ...pr.rows[0], tasks: tr.rows });
    } catch (e) {
      next(e);
    }
  })
);

// UPDATE project
const patchSchema = Joi.object({
  name: Joi.string().min(1).optional(),
  description: Joi.string().allow("").optional(),
});

projectsRouter.patch(
  "/:id",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.id;
      const userId = req.user!.id;
      const body = validate(patchSchema, req.body);

      const ownerCheck = await pool.query(
        `SELECT owner_id FROM projects WHERE id = $1`,
        [projectId]
      );

      if (ownerCheck.rowCount === 0) throw notFound();
      if (ownerCheck.rows[0].owner_id !== userId) throw forbidden();

      const r = await pool.query(
        `
        UPDATE projects
        SET
          name = COALESCE($2, name),
          description = COALESCE($3, description)
        WHERE id = $1
        RETURNING *
        `,
        [projectId, body.name ?? null, body.description ?? null]
      );

      res.json(r.rows[0]);
    } catch (e) {
      next(e);
    }
  })
);

// DELETE project
projectsRouter.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.id;
      const userId = req.user!.id;

      const ownerCheck = await pool.query(
        `SELECT owner_id FROM projects WHERE id = $1`,
        [projectId]
      );

      if (ownerCheck.rowCount === 0) throw notFound();
      if (ownerCheck.rows[0].owner_id !== userId) throw forbidden();

      await pool.query(`DELETE FROM projects WHERE id = $1`, [projectId]);

      res.status(204).send();
    } catch (e) {
      next(e);
    }
  })
);