import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import Joi from "joi";

import { asyncHandler } from "../http/asyncHandler.js";
import { validate } from "../http/validate.js";
import { config } from "../config.js";
import { pool } from "../db.js";
import { HttpError, validationError } from "../http/errors.js";
import { signAccessToken } from "../auth/jwt.js";

export const authRouter = Router();

const registerSchema = Joi.object({
  name: Joi.string().min(1).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

authRouter.post(
  "/register",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = validate(registerSchema, req.body);

      const passwordHash = await bcrypt.hash(
        body.password,
        config.auth.bcryptCost
      );

      const r = await pool.query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, name, email`,
        [body.name, body.email.toLowerCase(), passwordHash]
      );

      const user = r.rows[0];
      const token = signAccessToken({
        user_id: user.id,
        email: user.email,
      });

      res.status(201).json({ token, user });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";

      if (
        msg.includes("duplicate key") ||
        msg.includes("users_email_key")
      ) {
        next(validationError({ email: "already in use" }));
        return;
      }

      next(e);
    }
  })
);

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(1).required(),
});

authRouter.post(
  "/login",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = validate(loginSchema, req.body);

      const r = await pool.query(
        `SELECT id, name, email, password_hash 
         FROM users WHERE email = $1 LIMIT 1`,
        [body.email.toLowerCase()]
      );

      if (r.rowCount === 0) {
        throw new HttpError(401, { error: "unauthorized" });
      }

      const row = r.rows[0];

      const ok = await bcrypt.compare(body.password, row.password_hash);
      if (!ok) {
        throw new HttpError(401, { error: "unauthorized" });
      }

      const user = {
        id: row.id,
        name: row.name,
        email: row.email,
      };

      const token = signAccessToken({
        user_id: row.id,
        email: row.email,
      });

      res.status(200).json({ token, user });
    } catch (e) {
      next(e);
    }
  })
);