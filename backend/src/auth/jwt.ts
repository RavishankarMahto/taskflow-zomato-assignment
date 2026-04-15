import jwt from "jsonwebtoken";
import { config } from "../config.js";

export type JwtClaims = {
  user_id: string;
  email: string;
};

export function signAccessToken(claims: JwtClaims) {
  return jwt.sign(claims, config.auth.jwtSecret, {
    expiresIn: `${config.auth.jwtExpiresHours}h`,
  });
}

export function verifyAccessToken(token: string): JwtClaims {
  const decoded = jwt.verify(token, config.auth.jwtSecret);
  if (typeof decoded !== "object" || decoded === null) {
    throw new Error("Invalid token");
  }
  const { user_id, email } = decoded as Record<string, unknown>;
  if (typeof user_id !== "string" || typeof email !== "string") {
    throw new Error("Invalid token claims");
  }
  return { user_id, email };
}

