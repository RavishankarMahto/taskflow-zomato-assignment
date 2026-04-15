import type { NextFunction, Request, Response } from "express";
import { unauthorized } from "../http/errors.js";
import { verifyAccessToken } from "./jwt.js";

export type AuthUser = { id: string; email: string };

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) {
    return next(unauthorized());
  }
  const token = header.slice("bearer ".length).trim();
  try {
    const claims = verifyAccessToken(token);
    req.user = { id: claims.user_id, email: claims.email };
    return next();
  } catch {
    return next(unauthorized());
  }
}

